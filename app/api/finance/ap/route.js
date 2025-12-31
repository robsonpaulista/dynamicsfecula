import { NextResponse } from 'next/server'
import { z } from 'zod'
import { Decimal } from '@prisma/client/runtime/library'
import { prisma } from '@/lib/prisma'
import { authenticate, authorize } from '@/middleware/auth'

const createAccountPayableSchema = z.object({
  description: z.string().min(1, 'Descrição é obrigatória'),
  supplierId: z.string().optional(),
  categoryId: z.string().optional(),
  dueDate: z.string().or(z.date()),
  amount: z.number().min(0.01, 'Valor deve ser maior que zero'),
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
      prisma.accountsPayable.findMany({
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
          paymentSources: {
            include: {
              investor: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { dueDate: 'asc' },
      }),
      prisma.accountsPayable.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: accounts.map(ap => ({
        ...ap,
        amount: Number(ap.amount),
        paymentSources: ap.paymentSources?.map(ps => ({
          ...ps,
          amount: Number(ps.amount),
          investor: ps.investor,
        })) || [],
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Erro em GET /api/finance/ap:', error)
    
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
          message: process.env.NODE_ENV === 'development' ? error.message : 'Erro ao buscar contas a pagar', 
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
    const data = createAccountPayableSchema.parse(body)

    // Validar fornecedor se fornecido
    if (data.supplierId) {
      const supplier = await prisma.supplier.findUnique({
        where: { id: data.supplierId },
      })
      if (!supplier) {
        return NextResponse.json(
          { success: false, error: { message: 'Fornecedor não encontrado', code: 'NOT_FOUND' } },
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

    const accountPayable = await prisma.accountsPayable.create({
      data: {
        supplierId: data.supplierId || null,
        purchaseOrderId: null, // Manual, não vinculado a pedido
        description: data.description,
        categoryId: data.categoryId || null,
        dueDate: new Date(data.dueDate),
        amount: new Decimal(data.amount),
        status: 'OPEN',
      },
      include: {
        supplier: {
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
        ...accountPayable,
        amount: Number(accountPayable.amount),
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




