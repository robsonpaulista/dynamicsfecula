import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticate } from '@/middleware/auth'

export async function GET(request, { params }) {
  try {
    authenticate(request)

    const investor = await prisma.investor.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
      },
    })

    if (!investor) {
      return NextResponse.json(
        { success: false, error: { message: 'Investidor não encontrado', code: 'NOT_FOUND' } },
        { status: 404 }
      )
    }

    // Buscar todas as contas pagas por este investidor
    const paymentSources = await prisma.paymentSource.findMany({
      where: {
        investorId: params.id,
      },
      include: {
        accountsPayable: {
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
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Calcular totais
    const totalInvested = paymentSources.reduce(
      (sum, ps) => sum + Number(ps.amount),
      0
    )

    const totalAccounts = paymentSources.length

    // Agrupar por mês para gráfico/estatísticas
    const byMonth = paymentSources.reduce((acc, ps) => {
      const month = new Date(ps.createdAt).toISOString().slice(0, 7) // YYYY-MM
      if (!acc[month]) {
        acc[month] = { month, total: 0, count: 0 }
      }
      acc[month].total += Number(ps.amount)
      acc[month].count += 1
      return acc
    }, {})

    return NextResponse.json({
      success: true,
      data: {
        investor,
        payments: paymentSources.map(ps => ({
          id: ps.id,
          amount: Number(ps.amount),
          paidAt: ps.accountsPayable.paidAt,
          createdAt: ps.createdAt,
          account: {
            id: ps.accountsPayable.id,
            description: ps.accountsPayable.description,
            dueDate: ps.accountsPayable.dueDate,
            totalAmount: Number(ps.accountsPayable.amount),
            supplier: ps.accountsPayable.supplier,
            category: ps.accountsPayable.category,
          },
        })),
        summary: {
          totalInvested,
          totalAccounts,
          byMonth: Object.values(byMonth).sort((a, b) => b.month.localeCompare(a.month)),
        },
      },
    })
  } catch (error) {
    console.error('Erro ao buscar pagamentos do investidor:', error)
    return NextResponse.json(
      { success: false, error: { message: error.message, code: 'ERROR' } },
      { status: error.statusCode || 500 }
    )
  }
}





