import { NextResponse } from 'next/server'
import { Decimal } from '@prisma/client/runtime/library'
import { prisma } from '@/lib/prisma'
import { authenticate } from '@/middleware/auth'

export async function GET(request) {
  try {
    authenticate(request)

    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const startDate = from ? new Date(from) : new Date(new Date().setDate(1))
    const endDate = to ? new Date(to) : new Date()

    // Saldo de caixa
    const cashTransactions = await prisma.cashTransaction.findMany({
      where: {
        date: {
          lte: endDate,
        },
      },
    })

    const totalCashIn = cashTransactions
      .filter((t) => t.type === 'IN')
      .reduce((sum, t) => sum.plus(t.amount), new Decimal(0))

    const totalCashOut = cashTransactions
      .filter((t) => t.type === 'OUT')
      .reduce((sum, t) => sum.plus(t.amount), new Decimal(0))

    const cashBalance = totalCashIn.minus(totalCashOut)

    // Contas a pagar (abertas)
    const totalAccountsPayable = await prisma.accountsPayable.aggregate({
      where: {
        status: 'OPEN',
      },
      _sum: {
        amount: true,
      },
    })

    // Contas a receber (abertas)
    const totalAccountsReceivable = await prisma.accountsReceivable.aggregate({
      where: {
        status: 'OPEN',
      },
      _sum: {
        amount: true,
      },
    })

    // Produtos com estoque baixo
    const allProducts = await prisma.product.findMany({
      where: {
        isActive: true,
        minStock: { not: null },
        stockBalance: { isNot: null },
      },
      include: {
        stockBalance: true,
      },
    })

    const lowStockProducts = allProducts
      .filter((p) => {
        if (!p.stockBalance || !p.minStock) return false
        return p.stockBalance.quantity.toNumber() <= p.minStock.toNumber()
      })
      .slice(0, 10)

    // Vendas do período
    const salesInPeriod = await prisma.salesOrder.aggregate({
      where: {
        saleDate: {
          gte: startDate,
          lte: endDate,
        },
        status: {
          not: 'CANCELED',
        },
      },
      _sum: {
        total: true,
      },
      _count: {
        id: true,
      },
    })

    // Compras do período
    const purchasesInPeriod = await prisma.purchaseOrder.aggregate({
      where: {
        issueDate: {
          gte: startDate,
          lte: endDate,
        },
        status: {
          not: 'CANCELED',
        },
      },
      _sum: {
        total: true,
      },
      _count: {
        id: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        cashBalance: cashBalance.toNumber(),
        accountsPayable: totalAccountsPayable._sum.amount?.toNumber() || 0,
        accountsReceivable: totalAccountsReceivable._sum.amount?.toNumber() || 0,
        lowStockCount: lowStockProducts.length,
        lowStockProducts: lowStockProducts.map((p) => ({
          id: p.id,
          sku: p.sku,
          name: p.name,
          currentStock: p.stockBalance?.quantity.toNumber() || 0,
          minStock: p.minStock?.toNumber() || 0,
        })),
        sales: {
          total: salesInPeriod._sum.total?.toNumber() || 0,
          count: salesInPeriod._count.id || 0,
        },
        purchases: {
          total: purchasesInPeriod._sum.total?.toNumber() || 0,
          count: purchasesInPeriod._count.id || 0,
        },
      },
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { message: error.message, code: error.code || 'ERROR' } },
      { status: error.statusCode || 500 }
    )
  }
}








