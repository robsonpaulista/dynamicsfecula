const express = require('express');
const bcrypt = require('bcryptjs');
const { z } = require('zod');
const prisma = require('../lib/prisma');
const { authenticate, authorize } = require('../middleware/auth');
const { BadRequestError, NotFoundError } = require('../utils/errors');

const router = express.Router();

const userSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres').optional(),
  role: z.enum(['ADMIN', 'FINANCEIRO', 'COMPRAS', 'VENDAS', 'ESTOQUE']),
  isActive: z.boolean().optional(),
});

// Todas as rotas requerem autenticação
router.use(authenticate);

// GET /api/users
router.get('/', authorize('ADMIN'), async (req, res) => {
  const { page = 1, limit = 20, search } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: parseInt(limit),
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where }),
  ]);

  res.json({
    success: true,
    data: users,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
});

// GET /api/users/:id
router.get('/:id', authorize('ADMIN'), async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new NotFoundError('Usuário não encontrado');
  }

  res.json({ success: true, data: user });
});

// POST /api/users
router.post('/', authorize('ADMIN'), async (req, res) => {
  const data = userSchema.parse(req.body);

  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    throw new BadRequestError('Email já cadastrado');
  }

  const passwordHash = data.password
    ? await bcrypt.hash(data.password, 10)
    : null;

  if (!passwordHash) {
    throw new BadRequestError('Senha é obrigatória');
  }

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash,
      role: data.role,
      isActive: data.isActive ?? true,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  res.status(201).json({ success: true, data: user });
});

// PUT /api/users/:id
router.put('/:id', authorize('ADMIN'), async (req, res) => {
  const updateData = userSchema.partial().parse(req.body);

  if (updateData.password) {
    updateData.passwordHash = await bcrypt.hash(updateData.password, 10);
    delete updateData.password;
  }

  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      updatedAt: true,
    },
  });

  res.json({ success: true, data: user });
});

// DELETE /api/users/:id
router.delete('/:id', authorize('ADMIN'), async (req, res) => {
  await prisma.user.update({
    where: { id: req.params.id },
    data: { isActive: false },
  });

  res.json({ success: true, message: 'Usuário desativado com sucesso' });
});

module.exports = router;

















