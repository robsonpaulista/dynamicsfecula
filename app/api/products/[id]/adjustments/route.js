import { NextResponse } from 'next/server'
import { z } from 'zod'
import { Decimal } from '@prisma/client/runtime/library'
import { prisma } from '@/lib/prisma'
import { authenticate, authorize } from '@/middleware/auth'

const createStockAdjustmentSchema = z.object({
  type: z.enum(['AVARIA', 'INVENTARIO']),
  quantity: z.number().refine((val) => val !== 0, {
    message: 'Quantidade deve ser diferente de zero',
  }),
  reason: z.string().min(1, 'Motivo é obrigatório'),
  photoBase64: z.string().optional(),
}).refine((data) => {
  // Se for AVARIA, foto é obrigatória
  if (data.type === 'AVARIA' && !data.photoBase64) {
    return false
  }
  return true
}, {
  message: 'Foto é obrigatória para ajuste de avaria',
  path: ['photoBase64'],
})

export async function POST(request, { params }) {
  try {
    const user = authenticate(request)
    authorize(user, 'ADMIN', 'ESTOQUE', 'FINANCEIRO')

    const body = await request.json()
    const data = createStockAdjustmentSchema.parse(body)

    // Verificar se o produto existe
    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        stockBalance: true,
      },
    })

    if (!product) {
      return NextResponse.json(
        { success: false, error: { message: 'Produto não encontrado', code: 'NOT_FOUND' } },
        { status: 404 }
      )
    }

    // Criar o ajuste
    const adjustment = await prisma.stockAdjustment.create({
      data: {
        productId: params.id,
        type: data.type,
        quantity: new Decimal(data.quantity),
        reason: data.reason,
        photoBase64: data.photoBase64 || null,
        createdById: user.id,
      },
    })

    // Criar movimentação de estoque
    await prisma.stockMovement.create({
      data: {
        productId: params.id,
        type: 'ADJUST',
        quantity: new Decimal(data.quantity),
        referenceType: 'MANUAL',
        referenceId: adjustment.id,
        note: `Ajuste de ${data.type === 'AVARIA' ? 'avaria' : 'inventário'}: ${data.reason}`,
        createdById: user.id,
      },
    })

    // Atualizar saldo de estoque
    const currentBalance = product.stockBalance?.quantity || new Decimal(0)
    const newQuantity = currentBalance.plus(data.quantity)

    await prisma.stockBalance.upsert({
      where: { productId: params.id },
      create: {
        productId: params.id,
        quantity: newQuantity,
      },
      update: {
        quantity: newQuantity,
      },
    })

    // Buscar ajuste com relacionamentos
    const adjustmentWithRelations = await prisma.stockAdjustment.findUnique({
      where: { id: adjustment.id },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        ...adjustmentWithRelations,
        quantity: Number(adjustmentWithRelations.quantity),
      },
      message: 'Ajuste de estoque realizado com sucesso',
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { message: error.errors[0].message, code: 'VALIDATION_ERROR', details: error.errors } },
        { status: 400 }
      )
    }

    console.error('Erro em POST /api/products/[id]/adjustments:', error)
    return NextResponse.json(
      { success: false, error: { message: error.message, code: 'ERROR' } },
      { status: error.statusCode || 500 }
    )
  }
}

export async function GET(request, { params }) {
  try {
    authenticate(request)

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const [adjustments, total] = await Promise.all([
      prisma.stockAdjustment.findMany({
        where: { productId: params.id },
        skip,
        take: limit,
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.stockAdjustment.count({
        where: { productId: params.id },
      }),
    ])

    return NextResponse.json({
      success: true,
      data: adjustments.map(adj => ({
        ...adj,
        quantity: Number(adj.quantity),
        // Não enviar fotoBase64 na lista para economizar bandwidth
        // Mas marcar se existe foto
        hasPhoto: !!adj.photoBase64,
        photoBase64: undefined,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Erro em GET /api/products/[id]/adjustments:', error)
    return NextResponse.json(
      { success: false, error: { message: error.message, code: 'ERROR' } },
      { status: error.statusCode || 500 }
    )
  }
}




