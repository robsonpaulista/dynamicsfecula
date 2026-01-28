import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticate } from '@/middleware/auth'

/** Início do dia atual (UTC) para comparar vencimento */
function startOfToday() {
  const d = new Date()
  d.setUTCHours(0, 0, 0, 0)
  return d
}

export async function GET(request) {
  try {
    authenticate(request)

    const today = startOfToday()

    const [
      apOpen,
      apOpenOverdue,
      apOpenUpcoming,
      apPaid,
      arOpen,
      arOpenOverdue,
      arOpenUpcoming,
      arReceived,
    ] = await Promise.all([
      prisma.accountsPayable.aggregate({
        where: { status: 'OPEN' },
        _sum: { amount: true },
        _count: { id: true },
      }),
      prisma.accountsPayable.aggregate({
        where: { status: 'OPEN', dueDate: { lt: today } },
        _sum: { amount: true },
      }),
      prisma.accountsPayable.aggregate({
        where: { status: 'OPEN', dueDate: { gte: today } },
        _sum: { amount: true },
      }),
      prisma.accountsPayable.aggregate({
        where: { status: 'PAID' },
        _sum: { amount: true },
      }),
      prisma.accountsReceivable.aggregate({
        where: { status: 'OPEN' },
        _sum: { amount: true },
        _count: { id: true },
      }),
      prisma.accountsReceivable.aggregate({
        where: { status: 'OPEN', dueDate: { lt: today } },
        _sum: { amount: true },
      }),
      prisma.accountsReceivable.aggregate({
        where: { status: 'OPEN', dueDate: { gte: today } },
        _sum: { amount: true },
      }),
      prisma.accountsReceivable.aggregate({
        where: { status: 'RECEIVED' },
        _sum: { amount: true },
      }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        accountsPayable: {
          totalOpen: apOpen._sum.amount?.toNumber() ?? 0,
          countOpen: apOpen._count.id ?? 0,
          totalPaid: apPaid._sum.amount?.toNumber() ?? 0,
          totalOverdue: apOpenOverdue._sum.amount?.toNumber() ?? 0,
          totalUpcoming: apOpenUpcoming._sum.amount?.toNumber() ?? 0,
        },
        accountsReceivable: {
          totalOpen: arOpen._sum.amount?.toNumber() ?? 0,
          countOpen: arOpen._count.id ?? 0,
          totalReceived: arReceived._sum.amount?.toNumber() ?? 0,
          totalOverdue: arOpenOverdue._sum.amount?.toNumber() ?? 0,
          totalUpcoming: arOpenUpcoming._sum.amount?.toNumber() ?? 0,
        },
      },
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { message: error.message, code: 'ERROR' } },
      { status: error.statusCode || 500 }
    )
  }
}
