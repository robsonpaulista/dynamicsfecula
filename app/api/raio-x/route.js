import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticate } from '@/middleware/auth'

/** API Raio X: visão executiva da operação */
export async function GET(request) {
  try {
    authenticate(request)

    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const hasPeriod = from || to
    const startDate = from ? new Date(from) : null
    const endDate = to ? new Date(to) : null

    const dateFilter = (field) => {
      if (!hasPeriod) return undefined
      const where = {}
      if (startDate) where.gte = startDate
      if (endDate) where.lte = endDate
      return Object.keys(where).length ? where : undefined
    }

    // === COMPRAS ===
    const purchasesWhere = { status: { in: ['RECEIVED', 'APPROVED'] } }
    if (startDate || endDate) {
      purchasesWhere.issueDate = dateFilter('issueDate') || {}
      if (startDate) purchasesWhere.issueDate.gte = startDate
      if (endDate) purchasesWhere.issueDate.lte = endDate
    }

    const purchaseOrders = await prisma.purchaseOrder.findMany({
      where: purchasesWhere,
      include: {
        supplier: { select: { id: true, name: true } },
        accountsPayable: {
          where: { status: 'PAID' },
          include: {
            paymentSources: { include: { investor: { select: { id: true, name: true } } } },
          },
        },
      },
      orderBy: { issueDate: 'desc' },
      take: 200,
    })

    const purchaseStatusLabel = (s) => {
      const map = { DRAFT: 'Rascunho', APPROVED: 'Aprovado', RECEIVED: 'Recebido', CANCELED: 'Cancelado' }
      return map[s] || s
    }

    const pedidosCompra = purchaseOrders.map((po) => {
      const fontes = []
      po.accountsPayable?.forEach((ap) => {
        ap.paymentSources?.forEach((ps) => {
          const label = ps.investor?.name || 'Caixa'
          fontes.push(`${label}: ${Number(ps.amount).toFixed(2)}`)
        })
      })
      return {
        id: po.id,
        fornecedor: po.supplier?.name || '-',
        data: po.issueDate,
        total: Number(po.total),
        status: po.status,
        statusLabel: purchaseStatusLabel(po.status),
        fontePagadora: fontes.length ? fontes.join(', ') : '-',
      }
    })

    // === PRODUTOS ===
    const stockWhere = {}
    if (startDate || endDate) {
      stockWhere.createdAt = {}
      if (startDate) stockWhere.createdAt.gte = startDate
      if (endDate) stockWhere.createdAt.lte = endDate
    }

    const [stockMovements, productsWithBalance] = await Promise.all([
      prisma.stockMovement.findMany({
        where: stockWhere,
        select: { productId: true, type: true, quantity: true, referenceType: true },
      }),
      prisma.product.findMany({
        where: { isActive: true },
        include: { stockBalance: true },
      }),
    ])

    const byProduct = {}
    productsWithBalance.forEach((prod) => {
      byProduct[prod.id] = { sku: prod.sku, name: prod.name, unit: prod.unit || '', comprada: 0, saidas: 0, saldo: Number(prod.stockBalance?.quantity ?? 0) }
    })
    stockMovements.forEach((m) => {
      const q = Number(m.quantity)
      if (!byProduct[m.productId]) byProduct[m.productId] = { sku: '-', name: '-', unit: '', comprada: 0, saidas: 0, saldo: 0 }
      if (m.type === 'IN' && m.referenceType === 'PURCHASE') byProduct[m.productId].comprada += q
      if (m.type === 'OUT' || m.type === 'ADJUST') byProduct[m.productId].saidas += Math.abs(q)
    })

    let qtdComprada = 0
    let qtdSaidas = 0
    stockMovements.forEach((m) => {
      const q = Number(m.quantity)
      if (m.type === 'IN' && m.referenceType === 'PURCHASE') qtdComprada += q
      if (m.type === 'OUT' || m.type === 'ADJUST') qtdSaidas += Math.abs(q)
    })
    const saldoEstoque = Object.values(byProduct).reduce((s, p) => s + p.saldo, 0)

    const detalhesProdutos = Object.entries(byProduct)
      .map(([id, p]) => ({ id, ...p }))
      .filter((p) => p.comprada > 0 || p.saidas > 0 || p.saldo > 0)
      .sort((a, b) => (b.comprada + b.saidas) - (a.comprada + a.saidas))

    // === VENDAS ===
    const salesWhere = { status: { not: 'CANCELED' } }
    if (startDate || endDate) {
      salesWhere.saleDate = {}
      if (startDate) salesWhere.saleDate.gte = startDate
      if (endDate) salesWhere.saleDate.lte = endDate
    }

    const salesOrders = await prisma.salesOrder.findMany({
      where: salesWhere,
      include: {
        customer: { select: { id: true, name: true } },
        items: { include: { product: { select: { costPrice: true } } } },
      },
      orderBy: { saleDate: 'desc' },
      take: 200,
    })

    const delivered = salesOrders.filter((so) => so.status === 'DELIVERED')
    const totalVendido = delivered.reduce((s, so) => s + Number(so.total), 0)
    const qtdePedidos = salesOrders.length
    let custoVendas = 0
    delivered.forEach((so) => {
      so.items.forEach((item) => {
        custoVendas += Number(item.quantity) * Number(item.product?.costPrice ?? 0)
      })
    })

    const statusLabel = (s) => {
      const map = { DRAFT: 'Digitado', CONFIRMED: 'Confirmado', DELIVERED: 'Entregue', CANCELED: 'Cancelado' }
      return map[s] || s
    }

    // Despesas marcadas como custo de entrega (rateio por quantidade total entregue)
    const deliveryExpensesWhere = { status: 'PAID', isDeliveryCost: true }
    if (hasPeriod && (startDate || endDate)) {
      deliveryExpensesWhere.paidAt = {}
      if (startDate) deliveryExpensesWhere.paidAt.gte = startDate
      if (endDate) {
        const endOfDay = new Date(endDate)
        endOfDay.setHours(23, 59, 59, 999)
        deliveryExpensesWhere.paidAt.lte = endOfDay
      }
    }
    const deliveryExpensesList = await prisma.accountsPayable.findMany({
      where: deliveryExpensesWhere,
      select: { amount: true },
    })
    const totalDeliveryExpenses = deliveryExpensesList.reduce((s, ap) => s + Number(ap.amount), 0)

    const totalQuantityDelivered = delivered.reduce((s, so) => {
      return s + so.items.reduce((q, it) => q + Number(it.quantity), 0)
    }, 0)
    const unitCostDelivery = totalQuantityDelivered > 0 ? totalDeliveryExpenses / totalQuantityDelivered : 0
    const custoEntregaAplicado = unitCostDelivery * totalQuantityDelivered
    const lucro = totalVendido - (custoVendas + custoEntregaAplicado)
    const margemPercent = totalVendido > 0 ? (lucro / totalVendido) * 100 : 0

    const pedidosVenda = salesOrders.map((so) => {
      const custoPed = so.items.reduce((s, it) => s + Number(it.quantity) * Number(it.product?.costPrice ?? 0), 0)
      const quantityInOrder = so.items.reduce((q, it) => q + Number(it.quantity), 0)
      const custoEntregas = unitCostDelivery * quantityInOrder
      const totalPed = Number(so.total)
      const custoTotal = custoPed + custoEntregas
      return {
        id: so.id,
        cliente: so.customer?.name || '-',
        data: so.saleDate,
        total: totalPed,
        custo: custoPed,
        custoEntregas,
        lucro: totalPed - custoTotal,
        margem: totalPed > 0 ? ((totalPed - custoTotal) / totalPed) * 100 : 0,
        status: so.status,
        statusLabel: statusLabel(so.status),
      }
    })

    // === FINANCEIRO ===
    const apPaidWhere = { status: 'PAID', ...(hasPeriod && { paidAt: dateFilter('paidAt') }) }
    const arReceivedWhere = { status: 'RECEIVED', ...(hasPeriod && { receivedAt: dateFilter('receivedAt') }) }

    const [apPaid, arReceived, apOpenAgg, arOpenAgg, apPaidList, arReceivedList, apOpenList, arOpenList, cashTx] = await Promise.all([
      prisma.accountsPayable.aggregate({
        where: apPaidWhere,
        _sum: { amount: true },
      }),
      prisma.accountsReceivable.aggregate({
        where: arReceivedWhere,
        _sum: { amount: true },
      }),
      prisma.accountsPayable.aggregate({
        where: { status: 'OPEN' },
        _sum: { amount: true },
      }),
      prisma.accountsReceivable.aggregate({
        where: { status: 'OPEN' },
        _sum: { amount: true },
      }),
      prisma.accountsPayable.findMany({
        where: apPaidWhere,
        include: { supplier: { select: { name: true } }, paymentMethod: { select: { name: true } } },
        orderBy: { paidAt: 'desc' },
        take: 100,
      }),
      prisma.accountsReceivable.findMany({
        where: arReceivedWhere,
        include: { customer: { select: { name: true } }, paymentMethod: { select: { name: true } } },
        orderBy: { receivedAt: 'desc' },
        take: 100,
      }),
      prisma.accountsPayable.findMany({
        where: { status: 'OPEN' },
        include: { supplier: { select: { name: true } }, paymentMethod: { select: { name: true } } },
        orderBy: { dueDate: 'asc' },
        take: 100,
      }),
      prisma.accountsReceivable.findMany({
        where: { status: 'OPEN' },
        include: { customer: { select: { name: true } }, paymentMethod: { select: { name: true } } },
        orderBy: { dueDate: 'asc' },
        take: 100,
      }),
      prisma.cashTransaction.findMany({
        where: hasPeriod && endDate ? { date: { lte: endDate } } : undefined,
      }),
    ])

    const totalCashIn = cashTx.filter((t) => t.type === 'IN').reduce((s, t) => s + Number(t.amount), 0)
    const totalCashOut = cashTx.filter((t) => t.type === 'OUT').reduce((s, t) => s + Number(t.amount), 0)
    const saldoCaixa = totalCashIn - totalCashOut

    const detalhesAPPagas = apPaidList.map((ap) => ({
      id: ap.id,
      descricao: ap.description,
      fornecedor: ap.supplier?.name || '-',
      vencimento: ap.dueDate,
      pagamento: ap.paidAt,
      valor: Number(ap.amount),
      formaPagamento: ap.paymentMethod?.name || '-',
    }))

    const detalhesAP = apOpenList.map((ap) => ({
      id: ap.id,
      descricao: ap.description,
      fornecedor: ap.supplier?.name || '-',
      vencimento: ap.dueDate,
      valor: Number(ap.amount),
      formaPagamento: ap.paymentMethod?.name || '-',
    }))

    const detalhesARRecebidas = arReceivedList.map((ar) => ({
      id: ar.id,
      descricao: ar.description,
      cliente: ar.customer?.name || '-',
      vencimento: ar.dueDate,
      recebimento: ar.receivedAt,
      valor: Number(ar.amount),
      formaPagamento: ar.paymentMethod?.name || '-',
    }))

    const detalhesAR = arOpenList.map((ar) => ({
      id: ar.id,
      descricao: ar.description,
      cliente: ar.customer?.name || '-',
      vencimento: ar.dueDate,
      valor: Number(ar.amount),
      formaPagamento: ar.paymentMethod?.name || '-',
    }))

    return NextResponse.json({
      success: true,
      data: {
        compras: {
          pedidos: pedidosCompra,
        },
        produtos: {
          qtdeComprada: qtdComprada,
          qtdeSaidas: qtdSaidas,
          saldoEstoque: saldoEstoque,
          detalhes: detalhesProdutos,
        },
        vendas: {
          qtdePedidos,
          totalVendido,
          custo: custoVendas,
          custoEntregas: custoEntregaAplicado,
          lucro,
          margemPercent,
          pedidos: pedidosVenda,
        },
        financeiro: {
          contasPagas: Number(apPaid._sum.amount ?? 0),
          contasRecebidas: Number(arReceived._sum.amount ?? 0),
          saldoCaixa,
          contasAPagar: Number(apOpenAgg._sum.amount ?? 0),
          contasAReceber: Number(arOpenAgg._sum.amount ?? 0),
          detalhesAPPagas,
          detalhesAP,
          detalhesARRecebidas,
          detalhesAR,
        },
      },
    })
  } catch (error) {
    console.error('Erro em GET /api/raio-x:', error)
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Erro ao carregar Raio X', code: 'ERROR' } },
      { status: error.statusCode || 500 }
    )
  }
}
