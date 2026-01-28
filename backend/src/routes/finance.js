const express = require('express');
const { Decimal } = require('@prisma/client/runtime/library');
const prisma = require('../lib/prisma');
const { authenticate, authorize } = require('../middleware/auth');
const { NotFoundError, BadRequestError } = require('../utils/errors');

const router = express.Router();

router.use(authenticate);

// ============================================
// CONTAS A PAGAR
// ============================================

// GET /api/finance/ap
router.get('/ap', async (req, res) => {
  const { page = 1, limit = 20, status, from, to } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {};
  if (status) where.status = status;
  if (from || to) {
    where.dueDate = {};
    if (from) where.dueDate.gte = new Date(from);
    if (to) where.dueDate.lte = new Date(to);
  }

  const [accounts, total] = await Promise.all([
    prisma.accountsPayable.findMany({
      where,
      skip,
      take: parseInt(limit),
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
          },
        },
        category: true,
        paymentMethod: true,
      },
      orderBy: { dueDate: 'asc' },
    }),
    prisma.accountsPayable.count({ where }),
  ]);

  res.json({
    success: true,
    data: accounts,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
});

// POST /api/finance/ap/:id/pay
router.post('/ap/:id/pay', authorize('ADMIN', 'FINANCEIRO'), async (req, res) => {
  const { paidAt, paymentMethodId } = req.body;

  const account = await prisma.accountsPayable.findUnique({
    where: { id: req.params.id },
  });

  if (!account) {
    throw new NotFoundError('Conta a pagar não encontrada');
  }

  if (account.status === 'PAID') {
    throw new BadRequestError('Conta já foi paga');
  }

  // Atualizar conta
  const updatedAccount = await prisma.accountsPayable.update({
    where: { id: req.params.id },
    data: {
      status: 'PAID',
      paidAt: new Date(paidAt || new Date()),
      paymentMethodId,
    },
  });

  // Criar transação de caixa
  await prisma.cashTransaction.create({
    data: {
      type: 'OUT',
      origin: 'AP',
      originId: account.id,
      date: new Date(paidAt || new Date()),
      amount: account.amount,
      description: account.description,
      categoryId: account.categoryId,
      createdById: req.user.id,
    },
  });

  res.json({
    success: true,
    data: updatedAccount,
    message: 'Conta paga e registrada no fluxo de caixa',
  });
});

// ============================================
// CONTAS A RECEBER
// ============================================

// GET /api/finance/ar
router.get('/ar', async (req, res) => {
  const { page = 1, limit = 20, status, from, to } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {};
  if (status) where.status = status;
  if (from || to) {
    where.dueDate = {};
    if (from) where.dueDate.gte = new Date(from);
    if (to) where.dueDate.lte = new Date(to);
  }

  const [accounts, total] = await Promise.all([
    prisma.accountsReceivable.findMany({
      where,
      skip,
      take: parseInt(limit),
      include: {
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
        category: true,
        paymentMethod: true,
      },
      orderBy: { dueDate: 'asc' },
    }),
    prisma.accountsReceivable.count({ where }),
  ]);

  res.json({
    success: true,
    data: accounts,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
});

// POST /api/finance/ar/:id/receive
router.post('/ar/:id/receive', authorize('ADMIN', 'FINANCEIRO'), async (req, res) => {
  const { receivedAt, paymentMethodId } = req.body;

  const account = await prisma.accountsReceivable.findUnique({
    where: { id: req.params.id },
  });

  if (!account) {
    throw new NotFoundError('Conta a receber não encontrada');
  }

  if (account.status === 'RECEIVED') {
    throw new BadRequestError('Conta já foi recebida');
  }

  // Atualizar conta
  const updatedAccount = await prisma.accountsReceivable.update({
    where: { id: req.params.id },
    data: {
      status: 'RECEIVED',
      receivedAt: new Date(receivedAt || new Date()),
      paymentMethodId,
    },
  });

  // Criar transação de caixa
  await prisma.cashTransaction.create({
    data: {
      type: 'IN',
      origin: 'AR',
      originId: account.id,
      date: new Date(receivedAt || new Date()),
      amount: account.amount,
      description: account.description,
      categoryId: account.categoryId,
      createdById: req.user.id,
    },
  });

  res.json({
    success: true,
    data: updatedAccount,
    message: 'Conta recebida e registrada no fluxo de caixa',
  });
});

// ============================================
// FLUXO DE CAIXA
// ============================================

// GET /api/finance/cashflow
router.get('/cashflow', async (req, res) => {
  const { from, to } = req.query;

  if (!from || !to) {
    throw new BadRequestError('Período (from/to) é obrigatório');
  }

  const where = {
    date: {
      gte: new Date(from),
      lte: new Date(to),
    },
  };

  const transactions = await prisma.cashTransaction.findMany({
    where,
    include: {
      category: true,
      createdBy: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { date: 'desc' },
  });

  // Calcular totais
  const totalIn = transactions
    .filter((t) => t.type === 'IN')
    .reduce((sum, t) => sum.plus(t.amount), new Decimal(0));

  const totalOut = transactions
    .filter((t) => t.type === 'OUT')
    .reduce((sum, t) => sum.plus(t.amount), new Decimal(0));

  const balance = totalIn.minus(totalOut);

  res.json({
    success: true,
    data: {
      transactions,
      summary: {
        totalIn: totalIn.toNumber(),
        totalOut: totalOut.toNumber(),
        balance: balance.toNumber(),
      },
    },
  });
});

module.exports = router;

















