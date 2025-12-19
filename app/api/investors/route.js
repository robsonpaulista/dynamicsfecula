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

    // Buscar investidores
    const investors = await prisma.investor.findMany({
      where,
      skip,
      take: limit,
      orderBy: { name: 'asc' },
    })

    // Calcular estatísticas usando agregação se solicitado
    let investorsWithStats = investors
    if (includeStats && investors.length > 0) {
      const investorIds = investors.map(inv => inv.id)
      
      // Usar agregação do Prisma para calcular estatísticas de uma vez
      const statsResults = await prisma.paymentSource.groupBy({
        by: ['investorId'],
        where: {
          investorId: { in: investorIds },
        },
        _sum: {
          amount: true,
        },
        _count: {
          id: true,
        },
      })

      // Criar mapa de estatísticas
      const statsMap = {}
      statsResults.forEach(stat => {
        statsMap[stat.investorId] = {
          totalInvested: Number(stat._sum.amount || 0),
          totalAccounts: stat._count.id,
        }
      })

      // Adicionar estatísticas aos investidores
      investorsWithStats = investors.map(investor => ({
        ...investor,
        stats: statsMap[investor.id] || { totalInvested: 0, totalAccounts: 0 },
      }))
    }

    // Contar total apenas se necessário (para paginação)
    const total = await prisma.investor.count({ where })

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
