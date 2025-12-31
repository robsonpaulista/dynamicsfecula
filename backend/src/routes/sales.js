const express = require('express');
const { Decimal } = require('@prisma/client/runtime/library');
const prisma = require('../lib/prisma');
const { authenticate, authorize } = require('../middleware/auth');
const { NotFoundError, BadRequestError } = require('../utils/errors');

const router = express.Router();

router.use(authenticate);

// GET /api/sales
router.get('/', async (req, res) => {
  const { page = 1, limit = 20, status, customerId } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {};
  if (status) where.status = status;
  if (customerId) where.customerId = customerId;

  const [orders, total] = await Promise.all([
    prisma.salesOrder.findMany({
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
    prisma.salesOrder.count({ where }),
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

// GET /api/sales/:id
router.get('/:id', async (req, res) => {
  const order = await prisma.salesOrder.findUnique({
    where: { id: req.params.id },
    include: {
      customer: true,
      items: {
        include: {
          product: true,
        },
      },
      accountsReceivable: true,
      createdBy: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!order) {
    throw new NotFoundError('Pedido de venda não encontrado');
  }

  res.json({ success: true, data: order });
});

// POST /api/sales
router.post('/', authorize('ADMIN', 'VENDAS'), async (req, res) => {
  const { customerId, saleDate, items } = req.body;

  if (!customerId || !items || !Array.isArray(items) || items.length === 0) {
    throw new BadRequestError('Cliente e itens são obrigatórios');
  }

  // Calcular total
  let total = new Decimal(0);
  const salesItems = [];

  for (const item of items) {
    const product = await prisma.product.findUnique({
      where: { id: item.productId },
      include: { stockBalance: true },
    });

    if (!product) {
      throw new NotFoundError(`Produto ${item.productId} não encontrado`);
    }

    // Verificar estoque (apenas para produtos físicos)
    if (product.type !== 'SERVICO') {
      const balance = product.stockBalance;
      if (!balance || balance.quantity.toNumber() < item.quantity) {
        throw new BadRequestError(
          `Estoque insuficiente para ${product.name}. Disponível: ${balance?.quantity.toNumber() || 0}`
        );
      }
    }

    const itemTotal = new Decimal(item.quantity).times(item.unitPrice);
    total = total.plus(itemTotal);

    salesItems.push({
      productId: item.productId,
      quantity: new Decimal(item.quantity),
      unitPrice: new Decimal(item.unitPrice),
      total: itemTotal,
    });
  }

  const order = await prisma.salesOrder.create({
    data: {
      customerId,
      saleDate: new Date(saleDate || new Date()),
      total,
      status: 'DRAFT',
      createdById: req.user.id,
      items: {
        create: salesItems,
      },
    },
    include: {
      customer: true,
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  res.status(201).json({ success: true, data: order });
});

// POST /api/sales/:id/confirm
router.post('/:id/confirm', authorize('ADMIN', 'VENDAS'), async (req, res) => {
  const { createAccountsReceivable } = req.body;

  const order = await prisma.salesOrder.findUnique({
    where: { id: req.params.id },
    include: {
      items: {
        include: {
          product: {
            include: {
              stockBalance: true,
            },
          },
        },
      },
    },
  });

  if (!order) {
    throw new NotFoundError('Pedido de venda não encontrado');
  }

  if (order.status === 'DELIVERED') {
    throw new BadRequestError('Pedido já foi confirmado/entregue');
  }

  if (order.status === 'CANCELED') {
    throw new BadRequestError('Pedido cancelado não pode ser confirmado');
  }

  // Baixar estoque para cada item
  for (const item of order.items) {
    const product = item.product;

    // Apenas produtos físicos baixam estoque
    if (product.type !== 'SERVICO') {
      // Criar movimentação de saída
      await prisma.stockMovement.create({
        data: {
          productId: item.productId,
          type: 'OUT',
          quantity: item.quantity,
          referenceType: 'SALE',
          referenceId: order.id,
          note: `Saída - Pedido de venda #${order.id}`,
          createdById: req.user.id,
        },
      });

      // Atualizar saldo
      const balance = product.stockBalance;
      if (balance) {
        const newQuantity = balance.quantity.minus(item.quantity);
        if (newQuantity.toNumber() < 0) {
          throw new BadRequestError(
            `Estoque insuficiente para ${product.name} após validação`
          );
        }

        await prisma.stockBalance.update({
          where: { productId: item.productId },
          data: { quantity: newQuantity },
        });
      }
    }
  }

  // Criar contas a receber se solicitado
  if (createAccountsReceivable) {
    await prisma.accountsReceivable.create({
      data: {
        customerId: order.customerId,
        salesOrderId: order.id,
        description: `Venda - Pedido #${order.id}`,
        dueDate: new Date(order.saleDate),
        amount: order.total,
        status: 'OPEN',
      },
    });
  }

  // Atualizar status do pedido
  await prisma.salesOrder.update({
    where: { id: order.id },
    data: { status: 'DELIVERED' },
  });

  res.json({
    success: true,
    message: 'Pedido confirmado e estoque atualizado com sucesso',
  });
});

// PUT /api/sales/:id/cancel
router.put('/:id/cancel', authorize('ADMIN', 'VENDAS'), async (req, res) => {
  const order = await prisma.salesOrder.update({
    where: { id: req.params.id },
    data: { status: 'CANCELED' },
  });

  res.json({ success: true, data: order });
});

module.exports = router;












