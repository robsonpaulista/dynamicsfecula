import { NextResponse } from 'next/server'
import { z } from 'zod'
import { Decimal } from '@prisma/client/runtime/library'
import { prisma } from '@/lib/prisma'
import { authenticate, authorize } from '@/middleware/auth'

const createAccountReceivableSchema = z.object({
  description: z.string().min(1, 'Descrição é obrigatória'),
  customerId: z.string().optional(),
  categoryId: z.string().optional(),
  dueDate: z.string().or(z.date()),
  amount: z.number().min(0.01, 'Valor deve ser maior que zero'),
  paymentDays: z.number().int().positive().optional(),
})

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
    console.error('Erro em GET /api/finance/ar:', error)
    
    // Tratamento específico para erros do Prisma
    if (error.code === 'P1001' || error.message?.includes('Can\'t reach database')) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            message: 'Erro de conexão com o banco de dados. Verifique a configuração.', 
            code: 'DATABASE_CONNECTION_ERROR' 
          } 
        },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { 
        success: false, 
        error: { 
          message: process.env.NODE_ENV === 'development' ? error.message : 'Erro ao buscar contas a receber', 
          code: 'ERROR',
          details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        } 
      },
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
        paymentDays: data.paymentDays || null,
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
    console.error('Erro em POST /api/finance/ar:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { message: error.errors[0].message, code: 'VALIDATION_ERROR' } },
        { status: 400 }
      )
    }

    // Tratamento específico para erros do Prisma
    if (error.code === 'P1001' || error.message?.includes('Can\'t reach database')) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            message: 'Erro de conexão com o banco de dados. Verifique a configuração.', 
            code: 'DATABASE_CONNECTION_ERROR' 
          } 
        },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { 
        success: false, 
        error: { 
          message: process.env.NODE_ENV === 'development' ? error.message : 'Erro ao criar conta a receber', 
          code: 'ERROR',
          details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        } 
      },
      { status: error.statusCode || 500 }
    )
  }
}












