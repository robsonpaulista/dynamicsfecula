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
    
    // Se from/to forem strings vazias explícitas, não filtrar (todos os dados)
    // Se não fornecidos, usar período padrão (mês atual)
    const hasFromParam = searchParams.has('from')
    const hasToParam = searchParams.has('to')
    
    let startDate = null
    let endDate = null
    
    if (hasFromParam && from === '') {
      // Parâmetro explícito vazio = não filtrar
      startDate = null
    } else if (from && from !== '') {
      startDate = new Date(from)
    } else {
      // Padrão: primeiro dia do mês atual
      startDate = new Date(new Date().setDate(1))
    }
    
    if (hasToParam && to === '') {
      // Parâmetro explícito vazio = não filtrar
      endDate = null
    } else if (to && to !== '') {
      endDate = new Date(to)
    } else {
      // Padrão: hoje
      endDate = new Date()
    }

    // Saldo de caixa (sempre considera todas as transações até a data final, se especificada)
    const cashTransactionsWhere = {}
    if (endDate) {
      cashTransactionsWhere.date = {
        lte: endDate,
      }
    }
    
    const cashTransactions = await prisma.cashTransaction.findMany({
      where: cashTransactionsWhere,
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

    // Buscar todos os produtos ativos com estoque
    const allProducts = await prisma.product.findMany({
      where: {
        isActive: true,
      },
      include: {
        stockBalance: true,
      },
      orderBy: {
        name: 'asc',
      },
    })

    // Buscar movimentações de estoque para calcular entradas e saídas
    const productIds = allProducts.map((p) => p.id)
    const stockMovements = await prisma.stockMovement.findMany({
      where: {
        productId: { in: productIds },
      },
      select: {
        productId: true,
        type: true,
        quantity: true,
      },
    })

    // Agrupar movimentações por produto
    const movementsByProduct = {}
    stockMovements.forEach((movement) => {
      if (!movementsByProduct[movement.productId]) {
        movementsByProduct[movement.productId] = {
          entries: new Decimal(0),
          exits: new Decimal(0),
        }
      }
      if (movement.type === 'IN') {
        movementsByProduct[movement.productId].entries = movementsByProduct[movement.productId].entries.plus(movement.quantity)
      } else if (movement.type === 'OUT') {
        movementsByProduct[movement.productId].exits = movementsByProduct[movement.productId].exits.plus(movement.quantity)
      }
    })

    // Mapear produtos com informações de estoque e indicador de estoque baixo
    const productsWithStock = allProducts.map((p) => {
      const currentStock = p.stockBalance?.quantity.toNumber() || 0
      const minStock = p.minStock?.toNumber() || null
      const isLowStock = minStock !== null && currentStock <= minStock
      const movements = movementsByProduct[p.id] || { entries: new Decimal(0), exits: new Decimal(0) }
      const totalEntries = movements.entries.toNumber()
      const totalExits = movements.exits.toNumber()

      return {
        id: p.id,
        sku: p.sku,
        name: p.name,
        currentStock,
        minStock,
        unit: p.unit,
        isLowStock,
        totalEntries,
        totalExits,
      }
    })

    // Contar produtos com estoque baixo
    const lowStockCount = productsWithStock.filter((p) => p.isLowStock).length

    // Vendas do período
    const salesWhere = {
      status: {
        not: 'CANCELED',
      },
    }
    if (startDate || endDate) {
      salesWhere.saleDate = {}
      if (startDate) salesWhere.saleDate.gte = startDate
      if (endDate) salesWhere.saleDate.lte = endDate
    }
    
    const salesInPeriod = await prisma.salesOrder.aggregate({
      where: salesWhere,
      _sum: {
        total: true,
      },
      _count: {
        id: true,
      },
    })

    // Compras do período
    const purchasesWhere = {
      status: {
        not: 'CANCELED',
      },
    }
    if (startDate || endDate) {
      purchasesWhere.issueDate = {}
      if (startDate) purchasesWhere.issueDate.gte = startDate
      if (endDate) purchasesWhere.issueDate.lte = endDate
    }
    
    const purchasesInPeriod = await prisma.purchaseOrder.aggregate({
      where: purchasesWhere,
      _sum: {
        total: true,
      },
      _count: {
        id: true,
      },
    })

    // Despesas pagas no período
    const expensesWhere = {
      status: 'PAID',
    }
    if (startDate || endDate) {
      expensesWhere.paidAt = {}
      if (startDate) expensesWhere.paidAt.gte = startDate
      if (endDate) expensesWhere.paidAt.lte = endDate
    }
    
    const expensesPaid = await prisma.accountsPayable.aggregate({
      where: expensesWhere,
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
    })

    // Receitas recebidas no período
    const incomeWhere = {
      status: 'RECEIVED',
    }
    if (startDate || endDate) {
      incomeWhere.receivedAt = {}
      if (startDate) incomeWhere.receivedAt.gte = startDate
      if (endDate) incomeWhere.receivedAt.lte = endDate
    }
    
    const incomeReceived = await prisma.accountsReceivable.aggregate({
      where: incomeWhere,
      _sum: {
        amount: true,
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
        lowStockCount,
        productsWithStock: productsWithStock.slice(0, 20), // Limitar a 20 produtos para não sobrecarregar
        sales: {
          total: salesInPeriod._sum.total?.toNumber() || 0,
          count: salesInPeriod._count.id || 0,
        },
        purchases: {
          total: purchasesInPeriod._sum.total?.toNumber() || 0,
          count: purchasesInPeriod._count.id || 0,
        },
        expenses: {
          paid: expensesPaid._sum.amount?.toNumber() || 0,
          count: expensesPaid._count.id || 0,
        },
        income: {
          received: incomeReceived._sum.amount?.toNumber() || 0,
          count: incomeReceived._count.id || 0,
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















