import { NextResponse } from 'next/server'
import { z } from 'zod'
import { Decimal } from '@prisma/client/runtime/library'
import { prisma } from '@/lib/prisma'
import { authenticate, authorize } from '@/middleware/auth'
import { NotFoundError, BadRequestError } from '@/utils/errors'

const purchaseSchema = z.object({
  supplierId: z.string().min(1, 'Fornecedor é obrigatório'),
  issueDate: z.string().or(z.date()),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().min(0.01),
    unitPrice: z.number().min(0),
  })).min(1, 'Pelo menos um item é obrigatório'),
  notes: z.string().optional(),
})

export async function GET(request) {
  try {
    authenticate(request)

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status')
    const supplierId = searchParams.get('supplierId')
    const skip = (page - 1) * limit

    const where = {}
    if (status) where.status = status
    if (supplierId) where.supplierId = supplierId

    const [orders, total] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where,
        skip,
        take: limit,
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
    ])

    return NextResponse.json({
      success: true,
      data: orders.map(order => ({
        ...order,
        total: Number(order.total),
        items: order.items.map(item => ({
          ...item,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          total: Number(item.total),
        })),
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { message: error.message, code: error.code || 'ERROR' } },
      { status: error.statusCode || 500 }
    )
  }
}

export async function POST(request) {
  try {
    const user = authenticate(request)
    authorize(user, 'ADMIN', 'COMPRAS')

    const body = await request.json()
    const data = purchaseSchema.parse(body)

    if (!data.items || data.items.length === 0) {
      return NextResponse.json(
        { success: false, error: { message: 'Pelo menos um item é obrigatório', code: 'BAD_REQUEST' } },
        { status: 400 }
      )
    }

    // Calcular total
    let total = new Decimal(0)
    const purchaseItems = []

    for (const item of data.items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      })

      if (!product) {
        return NextResponse.json(
          { success: false, error: { message: `Produto ${item.productId} não encontrado`, code: 'NOT_FOUND' } },
          { status: 404 }
        )
      }

      const itemTotal = new Decimal(item.quantity).times(item.unitPrice)
      total = total.plus(itemTotal)

      purchaseItems.push({
        productId: item.productId,
        quantity: new Decimal(item.quantity),
        unitPrice: new Decimal(item.unitPrice),
        total: itemTotal,
      })
    }

    const order = await prisma.purchaseOrder.create({
      data: {
        supplierId: data.supplierId,
        issueDate: new Date(data.issueDate),
        total,
        notes: data.notes,
        status: 'DRAFT',
        createdById: user.id,
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
    })

    return NextResponse.json({
      success: true,
      data: {
        ...order,
        total: Number(order.total),
        items: order.items.map(item => ({
          ...item,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          total: Number(item.total),
        })),
      },
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { message: error.errors[0].message, code: 'VALIDATION_ERROR' } },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: { message: error.message, code: error.code || 'ERROR' } },
      { status: error.statusCode || 500 }
    )
  }
}










