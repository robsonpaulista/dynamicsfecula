const express = require('express');
const { Decimal } = require('@prisma/client/runtime/library');
const prisma = require('../lib/prisma');
const { authenticate, authorize } = require('../middleware/auth');
const { NotFoundError, BadRequestError } = require('../utils/errors');

const router = express.Router();

router.use(authenticate);

// GET /api/stock/balances
router.get('/balances', async (req, res) => {
  const { page = 1, limit = 50, search, lowStock } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {
    product: {
      isActive: true,
    },
  };

  if (search) {
    where.product = {
      ...where.product,
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ],
    };
  }

  if (lowStock === 'true') {
    where.product = {
      ...where.product,
      minStock: { not: null },
    };
  }

  const [balances, total] = await Promise.all([
    prisma.stockBalance.findMany({
      where,
      skip,
      take: parseInt(limit),
      include: {
        product: {
          select: {
            id: true,
            sku: true,
            name: true,
            type: true,
            unit: true,
            minStock: true,
            costPrice: true,
          },
        },
      },
      orderBy: {
        product: { name: 'asc' },
      },
    }),
    prisma.stockBalance.count({ where }),
  ]);

  // Adicionar flag de estoque baixo
  const balancesWithLowStock = balances.map((balance) => {
    const product = balance.product;
    const isLowStock =
      product.minStock &&
      balance.quantity.toNumber() <= product.minStock.toNumber();

    return {
      ...balance,
      product: {
        ...product,
        isLowStock,
      },
    };
  });

  res.json({
    success: true,
    data: balancesWithLowStock,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
});

// GET /api/stock/movements
router.get('/movements', async (req, res) => {
  const { page = 1, limit = 50, productId, type, from, to } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {};
  if (productId) where.productId = productId;
  if (type) where.type = type;
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) where.createdAt.lte = new Date(to);
  }

  const [movements, total] = await Promise.all([
    prisma.stockMovement.findMany({
      where,
      skip,
      take: parseInt(limit),
      include: {
        product: {
          select: {
            id: true,
            sku: true,
            name: true,
            unit: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.stockMovement.count({ where }),
  ]);

  res.json({
    success: true,
    data: movements,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
});

// POST /api/stock/adjust
router.post('/adjust', authorize('ADMIN', 'ESTOQUE'), async (req, res) => {
  const { productId, quantity, note } = req.body;

  if (!productId || quantity === undefined) {
    throw new BadRequestError('Produto e quantidade são obrigatórios');
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    throw new NotFoundError('Produto não encontrado');
  }

  // Criar movimentação de ajuste
  const movement = await prisma.stockMovement.create({
    data: {
      productId,
      type: 'ADJUST',
      quantity: new Decimal(quantity),
      note: note || 'Ajuste manual',
      referenceType: 'MANUAL',
      createdById: req.user.id,
    },
  });

  // Atualizar saldo
  const balance = await prisma.stockBalance.findUnique({
    where: { productId },
  });

  const newQuantity = balance
    ? balance.quantity.plus(quantity)
    : new Decimal(quantity);

  await prisma.stockBalance.upsert({
    where: { productId },
    create: {
      productId,
      quantity: newQuantity,
    },
    update: {
      quantity: newQuantity,
    },
  });

  res.status(201).json({
    success: true,
    data: movement,
    message: 'Ajuste de estoque realizado com sucesso',
  });
});

module.exports = router;













