const express = require('express');
const { z } = require('zod');
const prisma = require('../lib/prisma');
const { authenticate, authorize } = require('../middleware/auth');
const { NotFoundError } = require('../utils/errors');

const router = express.Router();

const customerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  document: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  addressJson: z.any().optional(),
  isActive: z.boolean().optional(),
});

router.use(authenticate);

// GET /api/customers
router.get('/', async (req, res) => {
  const { page = 1, limit = 20, search, isActive } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { document: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (isActive !== undefined) where.isActive = isActive === 'true';

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { name: 'asc' },
    }),
    prisma.customer.count({ where }),
  ]);

  res.json({
    success: true,
    data: customers,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
});

// GET /api/customers/:id
router.get('/:id', async (req, res) => {
  const customer = await prisma.customer.findUnique({
    where: { id: req.params.id },
  });

  if (!customer) {
    throw new NotFoundError('Cliente não encontrado');
  }

  res.json({ success: true, data: customer });
});

// POST /api/customers
router.post('/', authorize('ADMIN', 'VENDAS'), async (req, res) => {
  const data = customerSchema.parse(req.body);

  const customer = await prisma.customer.create({
    data: {
      name: data.name,
      document: data.document,
      phone: data.phone,
      email: data.email || null,
      addressJson: data.addressJson,
      isActive: data.isActive ?? true,
    },
  });

  res.status(201).json({ success: true, data: customer });
});

// PUT /api/customers/:id
router.put('/:id', authorize('ADMIN', 'VENDAS'), async (req, res) => {
  const updateData = customerSchema.partial().parse(req.body);

  const customer = await prisma.customer.update({
    where: { id: req.params.id },
    data: updateData,
  });

  res.json({ success: true, data: customer });
});

// DELETE /api/customers/:id
router.delete('/:id', authorize('ADMIN', 'VENDAS'), async (req, res) => {
  await prisma.customer.update({
    where: { id: req.params.id },
    data: { isActive: false },
  });

  res.json({ success: true, message: 'Cliente desativado com sucesso' });
});

module.exports = router;












