const express = require('express');
const { Decimal } = require('@prisma/client/runtime/library');
const prisma = require('../lib/prisma');
const { authenticate, authorize } = require('../middleware/auth');
const { NotFoundError, BadRequestError } = require('../utils/errors');

const router = express.Router();

router.use(authenticate);

// GET /api/purchases
router.get('/', async (req, res) => {
  const { page = 1, limit = 20, status, supplierId } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {};
  if (status) where.status = status;
  if (supplierId) where.supplierId = supplierId;

  const [orders, total] = await Promise.all([
    prisma.purchaseOrder.findMany({
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
        items: {
          include: {
            product: {
              select: {
                id: true,
                sku: true,
                name: true,
                unit: true,
              },
            },
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
    prisma.purchaseOrder.count({ where }),
  ]);

  res.json({
    success: true,
    data: orders,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
});

// GET /api/purchases/:id
router.get('/:id', async (req, res) => {
  const order = await prisma.purchaseOrder.findUnique({
    where: { id: req.params.id },
    include: {
      supplier: true,
      items: {
        include: {
          product: true,
        },
      },
      receipts: true,
      accountsPayable: true,
      createdBy: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!order) {
    throw new NotFoundError('Pedido de compra não encontrado');
  }

  res.json({ success: true, data: order });
});

// POST /api/purchases
router.post('/', authorize('ADMIN', 'COMPRAS'), async (req, res) => {
  const { supplierId, issueDate, items, notes } = req.body;

  if (!supplierId || !items || !Array.isArray(items) || items.length === 0) {
    throw new BadRequestError('Fornecedor e itens são obrigatórios');
  }

  // Calcular total
  let total = new Decimal(0);
  const purchaseItems = [];

  for (const item of items) {
    const product = await prisma.product.findUnique({
      where: { id: item.productId },
    });

    if (!product) {
      throw new NotFoundError(`Produto ${item.productId} não encontrado`);
    }

    const itemTotal = new Decimal(item.quantity).times(item.unitPrice);
    total = total.plus(itemTotal);

    purchaseItems.push({
      productId: item.productId,
      quantity: new Decimal(item.quantity),
      unitPrice: new Decimal(item.unitPrice),
      total: itemTotal,
    });
  }

  const order = await prisma.purchaseOrder.create({
    data: {
      supplierId,
      issueDate: new Date(issueDate),
      total,
      notes,
      status: 'DRAFT',
      createdById: req.user.id,
      items: {
        create: purchaseItems,
      },
    },
    include: {
      supplier: true,
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  res.status(201).json({ success: true, data: order });
});

// POST /api/purchases/:id/receive
router.post('/:id/receive', authorize('ADMIN', 'COMPRAS'), async (req, res) => {
  const { receiptDate, invoiceNumber, createAccountsPayable } = req.body;

  const order = await prisma.purchaseOrder.findUnique({
    where: { id: req.params.id },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!order) {
    throw new NotFoundError('Pedido de compra não encontrado');
  }

  if (order.status === 'RECEIVED') {
    throw new BadRequestError('Pedido já foi recebido');
  }

  if (order.status === 'CANCELED') {
    throw new BadRequestError('Pedido cancelado não pode ser recebido');
  }

  // Criar recebimento
  const receipt = await prisma.purchaseReceipt.create({
    data: {
      purchaseOrderId: order.id,
      receiptDate: new Date(receiptDate || new Date()),
      invoiceNumber,
      total: order.total,
      createdById: req.user.id,
    },
  });

  // Atualizar estoque para cada item
  for (const item of order.items) {
    // Criar movimentação de entrada
    await prisma.stockMovement.create({
      data: {
        productId: item.productId,
        type: 'IN',
        quantity: item.quantity,
        unitCost: item.unitPrice,
        referenceType: 'PURCHASE',
        referenceId: order.id,
        note: `Entrada - Pedido de compra #${order.id}`,
        createdById: req.user.id,
      },
    });

    // Atualizar saldo
    const balance = await prisma.stockBalance.findUnique({
      where: { productId: item.productId },
    });

    const newQuantity = balance
      ? balance.quantity.plus(item.quantity)
      : item.quantity;

    await prisma.stockBalance.upsert({
      where: { productId: item.productId },
      create: {
        productId: item.productId,
        quantity: newQuantity,
      },
      update: {
        quantity: newQuantity,
      },
    });

    // Atualizar custo médio do produto
    const avgCost = item.unitPrice;
    await prisma.product.update({
      where: { id: item.productId },
      data: {
        costPrice: avgCost,
      },
    });
  }

  // Criar contas a pagar se solicitado
  if (createAccountsPayable) {
    await prisma.accountsPayable.create({
      data: {
        supplierId: order.supplierId,
        purchaseOrderId: order.id,
        description: `Compra - Pedido #${order.id}`,
        dueDate: new Date(receiptDate || new Date()),
        amount: order.total,
        status: 'OPEN',
      },
    });
  }

  // Atualizar status do pedido
  await prisma.purchaseOrder.update({
    where: { id: order.id },
    data: { status: 'RECEIVED' },
  });

  res.json({
    success: true,
    data: receipt,
    message: 'Pedido recebido e estoque atualizado com sucesso',
  });
});

// PUT /api/purchases/:id/approve
router.put('/:id/approve', authorize('ADMIN', 'COMPRAS'), async (req, res) => {
  const order = await prisma.purchaseOrder.update({
    where: { id: req.params.id },
    data: { status: 'APPROVED' },
  });

  res.json({ success: true, data: order });
});

// PUT /api/purchases/:id/cancel
router.put('/:id/cancel', authorize('ADMIN', 'COMPRAS'), async (req, res) => {
  const order = await prisma.purchaseOrder.update({
    where: { id: req.params.id },
    data: { status: 'CANCELED' },
  });

  res.json({ success: true, data: order });
});

module.exports = router;








