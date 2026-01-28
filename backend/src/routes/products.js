const express = require('express');
const { z } = require('zod');
const { Decimal } = require('@prisma/client/runtime/library');
const prisma = require('../lib/prisma');
const { authenticate, authorize } = require('../middleware/auth');
const { NotFoundError, BadRequestError } = require('../utils/errors');

const router = express.Router();

const productSchema = z.object({
  sku: z.string().min(1, 'SKU é obrigatório'),
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  type: z.enum(['MP', 'PA', 'SERVICO']),
  unit: z.string().min(1, 'Unidade é obrigatória'),
  minStock: z.number().min(0).optional(),
  costPrice: z.number().min(0).optional(),
  salePrice: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
});

router.use(authenticate);

// GET /api/products
router.get('/', async (req, res) => {
  const { page = 1, limit = 20, search, type, isActive } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { sku: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (type) where.type = type;
  if (isActive !== undefined) where.isActive = isActive === 'true';

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: parseInt(limit),
      include: {
        stockBalance: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.product.count({ where }),
  ]);

  res.json({
    success: true,
    data: products,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  const product = await prisma.product.findUnique({
    where: { id: req.params.id },
    include: {
      stockBalance: true,
      stockMovements: {
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: {
            select: { name: true },
          },
        },
      },
    },
  });

  if (!product) {
    throw new NotFoundError('Produto não encontrado');
  }

  res.json({ success: true, data: product });
});

// POST /api/products
router.post('/', authorize('ADMIN', 'ESTOQUE', 'COMPRAS'), async (req, res) => {
  const data = productSchema.parse(req.body);

  const existingProduct = await prisma.product.findUnique({
    where: { sku: data.sku },
  });

  if (existingProduct) {
    throw new BadRequestError('SKU já cadastrado');
  }

  const product = await prisma.product.create({
    data: {
      sku: data.sku,
      name: data.name,
      type: data.type,
      unit: data.unit,
      minStock: data.minStock ? new Decimal(data.minStock) : null,
      costPrice: data.costPrice ? new Decimal(data.costPrice) : null,
      salePrice: data.salePrice ? new Decimal(data.salePrice) : null,
      isActive: data.isActive ?? true,
    },
  });

  // Criar saldo inicial zerado
  await prisma.stockBalance.create({
    data: {
      productId: product.id,
      quantity: new Decimal(0),
    },
  });

  res.status(201).json({ success: true, data: product });
});

// PUT /api/products/:id
router.put('/:id', authorize('ADMIN', 'ESTOQUE', 'COMPRAS'), async (req, res) => {
  const updateData = productSchema.partial().parse(req.body);

  const updateFields = {};
  if (updateData.minStock !== undefined) {
    updateFields.minStock = new Decimal(updateData.minStock);
  }
  if (updateData.costPrice !== undefined) {
    updateFields.costPrice = new Decimal(updateData.costPrice);
  }
  if (updateData.salePrice !== undefined) {
    updateFields.salePrice = new Decimal(updateData.salePrice);
  }

  const product = await prisma.product.update({
    where: { id: req.params.id },
    data: {
      ...updateData,
      ...updateFields,
    },
  });

  res.json({ success: true, data: product });
});

// DELETE /api/products/:id
router.delete('/:id', authorize('ADMIN', 'ESTOQUE'), async (req, res) => {
  await prisma.product.update({
    where: { id: req.params.id },
    data: { isActive: false },
  });

  res.json({ success: true, message: 'Produto desativado com sucesso' });
});

module.exports = router;

















