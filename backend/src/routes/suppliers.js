const express = require('express');
const { z } = require('zod');
const prisma = require('../lib/prisma');
const { authenticate, authorize } = require('../middleware/auth');
const { NotFoundError } = require('../utils/errors');

const router = express.Router();

const supplierSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  document: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  addressJson: z.any().optional(),
  isActive: z.boolean().optional(),
});

router.use(authenticate);

// GET /api/suppliers
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

  const [suppliers, total] = await Promise.all([
    prisma.supplier.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { name: 'asc' },
    }),
    prisma.supplier.count({ where }),
  ]);

  res.json({
    success: true,
    data: suppliers,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
});

// GET /api/suppliers/:id
router.get('/:id', async (req, res) => {
  const supplier = await prisma.supplier.findUnique({
    where: { id: req.params.id },
  });

  if (!supplier) {
    throw new NotFoundError('Fornecedor não encontrado');
  }

  res.json({ success: true, data: supplier });
});

// POST /api/suppliers
router.post('/', authorize('ADMIN', 'COMPRAS'), async (req, res) => {
  const data = supplierSchema.parse(req.body);

  const supplier = await prisma.supplier.create({
    data: {
      name: data.name,
      document: data.document,
      phone: data.phone,
      email: data.email || null,
      addressJson: data.addressJson,
      isActive: data.isActive ?? true,
    },
  });

  res.status(201).json({ success: true, data: supplier });
});

// PUT /api/suppliers/:id
router.put('/:id', authorize('ADMIN', 'COMPRAS'), async (req, res) => {
  const updateData = supplierSchema.partial().parse(req.body);

  const supplier = await prisma.supplier.update({
    where: { id: req.params.id },
    data: updateData,
  });

  res.json({ success: true, data: supplier });
});

// DELETE /api/suppliers/:id
router.delete('/:id', authorize('ADMIN', 'COMPRAS'), async (req, res) => {
  await prisma.supplier.update({
    where: { id: req.params.id },
    data: { isActive: false },
  });

  res.json({ success: true, message: 'Fornecedor desativado com sucesso' });
});

module.exports = router;








