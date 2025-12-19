import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticate } from '@/middleware/auth'

export async function GET(request) {
  try {
    authenticate(request)

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status')
    const skip = (page - 1) * limit

    const where = {}
    if (status) where.status = status

    const [accounts, total] = await Promise.all([
      prisma.accountsReceivable.findMany({
        where,
        skip,
        take: limit,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
            },
          },
          paymentMethod: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { dueDate: 'asc' },
      }),
      prisma.accountsReceivable.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: accounts.map(ar => ({
        ...ar,
        amount: Number(ar.amount),
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
      { success: false, error: { message: error.message, code: 'ERROR' } },
      { status: error.statusCode || 500 }
    )
  }
}

export async function POST(request) {
  try {
    const user = authenticate(request)
    authorize(user, 'ADMIN', 'FINANCEIRO')

    const body = await request.json()
    const data = createAccountReceivableSchema.parse(body)

    // Validar cliente se fornecido
    if (data.customerId) {
      const customer = await prisma.customer.findUnique({
        where: { id: data.customerId },
      })
      if (!customer) {
        return NextResponse.json(
          { success: false, error: { message: 'Cliente não encontrado', code: 'NOT_FOUND' } },
          { status: 404 }
        )
      }
    }

    // Validar categoria se fornecida
    if (data.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: data.categoryId },
      })
      if (!category) {
        return NextResponse.json(
          { success: false, error: { message: 'Categoria não encontrada', code: 'NOT_FOUND' } },
          { status: 404 }
        )
      }
    }

    const accountReceivable = await prisma.accountsReceivable.create({
      data: {
        customerId: data.customerId || null,
        salesOrderId: null, // Manual, não vinculado a pedido
        description: data.description,
        categoryId: data.categoryId || null,
        dueDate: new Date(data.dueDate),
        amount: new Decimal(data.amount),
        status: 'OPEN',
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        ...accountReceivable,
        amount: Number(accountReceivable.amount),
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
      { success: false, error: { message: error.message, code: 'ERROR' } },
      { status: error.statusCode || 500 }
    )
  }
}








