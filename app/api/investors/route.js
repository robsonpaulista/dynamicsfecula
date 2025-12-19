import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { authenticate, authorize } from '@/middleware/auth'

const investorSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  document: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  isActive: z.boolean().optional().default(true),
})

export async function GET(request) {
  try {
    authenticate(request)

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '100')
    const isActive = searchParams.get('isActive')
    const includeStats = searchParams.get('includeStats') === 'true'
    const skip = (page - 1) * limit

    const where = {}
    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true'
    }

    const [investors, total] = await Promise.all([
      prisma.investor.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: includeStats ? {
          paymentSources: {
            select: {
              amount: true,
            },
          },
        } : undefined,
      }),
      prisma.investor.count({ where }),
    ])

    // Calcular estatísticas se solicitado
    const investorsWithStats = includeStats ? investors.map(investor => {
      const totalInvested = investor.paymentSources?.reduce(
        (sum, ps) => sum + Number(ps.amount),
        0
      ) || 0
      const totalAccounts = investor.paymentSources?.length || 0

      return {
        ...investor,
        stats: {
          totalInvested,
          totalAccounts,
        },
        paymentSources: undefined, // Remover do response
      }
    }) : investors

    return NextResponse.json({
      success: true,
      data: investorsWithStats,
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
    const data = investorSchema.parse(body)

    const investor = await prisma.investor.create({
      data: {
        name: data.name,
        document: data.document || null,
        phone: data.phone || null,
        email: data.email || null,
        isActive: data.isActive ?? true,
      },
    })

    return NextResponse.json({
      success: true,
      data: investor,
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
