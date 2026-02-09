import { NextResponse } from 'next/server'
import { Decimal } from '@prisma/client/runtime/library'
import { prisma } from '@/lib/prisma'
import { authenticate, authorize } from '@/middleware/auth'
import { BadRequestError } from '@/utils/errors'

/**
 * Valida inconsistências financeiras. Apenas ADMIN.
 * GET ?tipo=ar_pedidos - retorna AR vinculados a pedidos cancelados ou não entregues
 * GET ?tipo=caixa - retorna conferência do caixa (transações + inconsistências)
 * GET ?tipo=pedidos_sem_ar - retorna pedidos entregues (DELIVERED) sem contas a receber
 * GET ?tipo=pedidos_cancelados_com_ar - retorna pedidos cancelados que têm AR em aberto (para transferir)
 * GET ?tipo=estoque_vendas_canceladas - retorna movimentações de saída de vendas canceladas (para reverter)
 * GET ?tipo=estoque_saidas_duplicadas - retorna saídas duplicadas (mesmo pedido+produto com mais de uma movimentação)
 * GET ?tipo=pedidos_cancelados - retorna todos os pedidos cancelados (para estornar cancelamento)
 */
export async function GET(request) {
  try {
    const user = authenticate(request)
    authorize(user, 'ADMIN')

    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get('tipo') || 'ar_pedidos'

    if (tipo === 'caixa') {
      // Conferência do caixa: todas as transações + flags de inconsistência
      const transactions = await prisma.cashTransaction.findMany({
        orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
        include: {
          category: { select: { id: true, name: true } },
          createdBy: { select: { id: true, name: true } },
        },
      })

      const apIds = [...new Set(transactions.filter((t) => t.origin === 'AP' && t.originId).map((t) => t.originId))]
      const arIds = [...new Set(transactions.filter((t) => t.origin === 'AR' && t.originId).map((t) => t.originId))]

      const [apsComSources, arsComSalesOrder] = await Promise.all([
        apIds.length ? prisma.accountsPayable.findMany({
          where: { id: { in: apIds } },
          include: { paymentSources: { include: { investor: { select: { name: true } } } } },
        }) : [],
        arIds.length ? prisma.accountsReceivable.findMany({
          where: { id: { in: arIds } },
          include: { salesOrder: { select: { status: true } } },
        }) : [],
      ])

      const apMap = Object.fromEntries(apsComSources.map((ap) => [ap.id, ap]))
      const arMap = Object.fromEntries(arsComSalesOrder.map((ar) => [ar.id, ar]))

      let saldo = 0
      const itens = []
      const inconsistencias = []

      for (const t of transactions) {
        const amount = Number(t.amount)
        const valor = t.type === 'IN' ? amount : -amount
        saldo += valor

        let inconsistencia = null

        if (t.origin === 'AP' && t.originId) {
          const ap = apMap[t.originId]
          if (ap?.paymentSources?.length) {
            const totalInvestor = ap.paymentSources
              .filter((ps) => ps.investorId)
              .reduce((s, ps) => s + Number(ps.amount), 0)
            const totalCaixa = ap.paymentSources
              .filter((ps) => !ps.investorId)
              .reduce((s, ps) => s + Number(ps.amount), 0)
            if (totalCaixa < 0.01 && totalInvestor > 0.01) {
              inconsistencia = 'AP pago por investidor, mas debitado do caixa'
              inconsistencias.push({ id: t.id, tipo: 'AP_INVESTIDOR', msg: inconsistencia })
            }
          }
        }

        if (t.origin === 'AR' && t.originId) {
          const ar = arMap[t.originId]
          if (ar?.salesOrder?.status === 'CANCELED') {
            inconsistencia = 'AR de pedido cancelado (recebimento indevido no caixa)'
            inconsistencias.push({ id: t.id, tipo: 'AR_CANCELADO', msg: inconsistencia })
          }
        }

        itens.push({
          id: t.id,
          type: t.type,
          origin: t.origin,
          originId: t.originId,
          date: t.date,
          amount: amount,
          description: t.description,
          saldoAcumulado: saldo,
          categoryName: t.category?.name || '-',
          createdByName: t.createdBy?.name || '-',
          inconsistencia,
        })
      }

      const totalIn = transactions.filter((t) => t.type === 'IN').reduce((s, t) => s + Number(t.amount), 0)
      const totalOut = transactions.filter((t) => t.type === 'OUT').reduce((s, t) => s + Number(t.amount), 0)
      const saldoCalculado = totalIn - totalOut

      // Recebimentos por pedido: agrupar transações IN (AR) por salesOrderId para detectar duplicação
      const recebimentosPorPedidoMap = {}
      for (const t of transactions) {
        if (t.origin !== 'AR' || t.type !== 'IN' || !t.originId) continue
        const ar = arMap[t.originId]
        if (!ar?.salesOrderId) continue
        const orderId = ar.salesOrderId
        if (!recebimentosPorPedidoMap[orderId]) {
          recebimentosPorPedidoMap[orderId] = { transacoes: [], arIds: new Set() }
        }
        recebimentosPorPedidoMap[orderId].transacoes.push({
          id: t.id,
          date: t.date,
          amount: Number(t.amount),
          description: t.description,
          arId: t.originId,
        })
      }

      const orderIdsComMultiplos = Object.keys(recebimentosPorPedidoMap).filter(
        (id) => recebimentosPorPedidoMap[id].transacoes.length > 1
      )
      let recebimentosPorPedido = []
      if (orderIdsComMultiplos.length > 0) {
        const pedidos = await prisma.salesOrder.findMany({
          where: { id: { in: orderIdsComMultiplos } },
          select: {
            id: true,
            total: true,
            saleDate: true,
            customer: { select: { name: true } },
          },
        })
        const pedidoMap = Object.fromEntries(pedidos.map((p) => [p.id, p]))
        recebimentosPorPedido = orderIdsComMultiplos.map((salesOrderId) => {
          const { transacoes } = recebimentosPorPedidoMap[salesOrderId]
          const totalRecebido = transacoes.reduce((s, tx) => s + tx.amount, 0)
          const pedido = pedidoMap[salesOrderId]
          const totalPedido = pedido ? Number(pedido.total) : 0
          const possivelDuplicacao = totalRecebido > totalPedido + 0.01 // tolerância centavos
          return {
            salesOrderId,
            totalPedido,
            totalRecebido,
            qtdeRecebimentos: transacoes.length,
            situacao: possivelDuplicacao ? 'possivel_duplicacao' : 'ok',
            customerName: pedido?.customer?.name ?? '-',
            saleDate: pedido?.saleDate ?? null,
            transacoes,
          }
        })
      }

      // AR com múltiplas baixas no caixa: mesma AR com mais de uma transação IN (possível duplicação)
      const arBaixasMap = {}
      for (const t of transactions) {
        if (t.origin !== 'AR' || t.type !== 'IN' || !t.originId) continue
        const arId = t.originId
        if (!arBaixasMap[arId]) arBaixasMap[arId] = { transacoes: [], total: 0 }
        arBaixasMap[arId].transacoes.push({ id: t.id, amount: Number(t.amount), date: t.date, description: t.description })
        arBaixasMap[arId].total += Number(t.amount)
      }
      const arIdsComMultiplasBaixas = Object.keys(arBaixasMap).filter((id) => arBaixasMap[id].transacoes.length > 1)
      let arComMultiplasBaixas = []
      if (arIdsComMultiplasBaixas.length > 0) {
        const ars = await prisma.accountsReceivable.findMany({
          where: { id: { in: arIdsComMultiplasBaixas } },
          include: { customer: { select: { name: true } }, salesOrder: { select: { id: true } } },
        })
        const arInfoMap = Object.fromEntries(ars.map((ar) => [ar.id, ar]))
        arComMultiplasBaixas = arIdsComMultiplasBaixas.map((arId) => {
          const ar = arInfoMap[arId]
          const { transacoes, total: totalBaixadoNoCaixa } = arBaixasMap[arId]
          const valorAtualAR = ar ? Number(ar.amount) : 0
          return {
            arId,
            description: ar?.description ?? '-',
            customerName: ar?.customer?.name ?? '-',
            salesOrderId: ar?.salesOrderId ?? null,
            valorAtualAR,
            status: ar?.status ?? '-',
            qtdeBaixas: transacoes.length,
            totalBaixadoNoCaixa,
            transacoes,
          }
        })
      }

      return NextResponse.json({
        success: true,
        data: {
          totalIn,
          totalOut,
          saldoCalculado,
          quantidadeTransacoes: transactions.length,
          itens,
          inconsistencias,
          recebimentosPorPedido,
          arComMultiplasBaixas,
          resumo: inconsistencias.length > 0
            ? `Encontradas ${inconsistencias.length} transação(ões) com possível inconsistência que podem explicar o saldo incorreto.`
            : 'Conferência concluída. Verifique as transações abaixo.',
        },
      })
    }

    if (tipo === 'estoque_saidas_duplicadas') {
      // Saídas duplicadas: mesmo pedido (referenceId) e mesmo produto gerou mais de uma movimentação OUT
      const movimentos = await prisma.stockMovement.findMany({
        where: {
          type: 'OUT',
          referenceType: 'SALE',
          referenceId: { not: null },
        },
        include: {
          product: { select: { id: true, name: true, sku: true } },
        },
        orderBy: { createdAt: 'asc' },
      })
      const porPedidoProduto = {}
      for (const m of movimentos) {
        const key = `${m.referenceId}|${m.productId}`
        if (!porPedidoProduto[key]) porPedidoProduto[key] = []
        porPedidoProduto[key].push(m)
      }
      const duplicatas = Object.entries(porPedidoProduto)
        .filter(([, arr]) => arr.length > 1)
        .flatMap(([key, arr]) => arr.map((m) => ({
          id: m.id,
          productId: m.productId,
          productName: m.product?.name,
          sku: m.product?.sku,
          quantity: Number(m.quantity),
          referenceId: m.referenceId,
          createdAt: m.createdAt,
          pedidoProduto: key,
          totalMovimentos: arr.length,
        })))
      return NextResponse.json({
        success: true,
        data: {
          total: duplicatas.length,
          itens: duplicatas,
          resumo: duplicatas.length > 0
            ? `Encontradas ${duplicatas.length} movimentação(ões) de saída duplicadas (mesmo pedido+produto). Exclua as duplicatas mantendo uma.`
            : 'Nenhuma saída duplicada encontrada.',
        },
      })
    }

    if (tipo === 'estoque_vendas_canceladas') {
      const movimentos = await prisma.stockMovement.findMany({
        where: {
          type: 'OUT',
          referenceType: 'SALE',
          referenceId: { not: null },
        },
        include: {
          product: { select: { id: true, name: true, sku: true } },
        },
        orderBy: { createdAt: 'desc' },
      })
      const orderIds = [...new Set(movimentos.map((m) => m.referenceId).filter(Boolean))]
      const orders = orderIds.length
        ? await prisma.salesOrder.findMany({
            where: { id: { in: orderIds }, status: 'CANCELED' },
            select: { id: true, status: true, customer: { select: { name: true } } },
          })
        : []
      const canceledOrderIds = new Set(orders.map((o) => o.id))
      const movimentosCancelados = movimentos.filter((m) => m.referenceId && canceledOrderIds.has(m.referenceId))
      const orderMap = Object.fromEntries(orders.map((o) => [o.id, o]))
      const result = movimentosCancelados.map((m) => ({
        id: m.id,
        productId: m.productId,
        productName: m.product?.name,
        sku: m.product?.sku,
        quantity: Number(m.quantity),
        referenceId: m.referenceId,
        createdAt: m.createdAt,
        customerName: orderMap[m.referenceId]?.customer?.name,
      }))
      return NextResponse.json({
        success: true,
        data: {
          total: result.length,
          itens: result,
          resumo: result.length > 0
            ? `${result.length} movimentação(ões) de saída de vendas canceladas. Use "Reverter estoque" para corrigir.`
            : 'Nenhuma movimentação de saída de venda cancelada encontrada.',
        },
      })
    }

    if (tipo === 'pedidos_cancelados') {
      // Todos os pedidos cancelados (para estornar cancelamento: voltar a entregue, recriar AR e estoque)
      const pedidos = await prisma.salesOrder.findMany({
        where: { status: 'CANCELED' },
        include: {
          customer: { select: { name: true } },
          items: {
            include: {
              product: { select: { id: true, name: true, sku: true, type: true } },
            },
          },
        },
        orderBy: { saleDate: 'desc' },
      })
      const result = pedidos.map((p) => ({
        id: p.id,
        saleDate: p.saleDate,
        total: Number(p.total),
        customerName: p.customer?.name ?? '-',
        isBonificacao: p.isBonificacao,
        installmentsJson: p.installmentsJson,
        items: p.items?.map((i) => ({
          productId: i.productId,
          productName: i.product?.name,
          sku: i.product?.sku,
          productType: i.product?.type,
          quantity: Number(i.quantity),
        })) ?? [],
      }))
      return NextResponse.json({
        success: true,
        data: {
          total: result.length,
          itens: result,
          resumo: result.length > 0
            ? `${result.length} pedido(s) cancelado(s). Use "Estornar cancelamento" para restaurar como entregue (AR + estoque).`
            : 'Nenhum pedido cancelado.',
        },
      })
    }

    if (tipo === 'pedidos_cancelados_com_ar') {
      // Pedidos cancelados que têm AR (OPEN ou CANCELED - pois ao cancelar o pedido as AR são marcadas CANCELED)
      const pedidos = await prisma.salesOrder.findMany({
        where: {
          status: 'CANCELED',
          accountsReceivable: { some: {} },
        },
        include: {
          customer: { select: { name: true } },
          accountsReceivable: {
            where: { status: { in: ['OPEN', 'CANCELED'] } },
            select: { id: true, amount: true, dueDate: true, description: true, status: true },
          },
        },
        orderBy: { saleDate: 'desc' },
      })
      const result = pedidos.map((p) => ({
        id: p.id,
        saleDate: p.saleDate,
        total: Number(p.total),
        customerName: p.customer?.name ?? '-',
        qtdeAR: p.accountsReceivable.length,
        totalAR: p.accountsReceivable.reduce((s, ar) => s + Number(ar.amount), 0),
      }))
      return NextResponse.json({
        success: true,
        data: { itens: result },
      })
    }

    if (tipo === 'pedidos_sem_ar') {
      const pedidosEntreguesSemAR = await prisma.salesOrder.findMany({
        where: {
          status: 'DELIVERED',
          isBonificacao: false,
          accountsReceivable: { none: {} },
        },
        include: {
          customer: { select: { id: true, name: true } },
          items: {
            include: {
              product: { select: { id: true, sku: true, name: true, unit: true } },
            },
          },
        },
        orderBy: { saleDate: 'desc' },
      })
      const paymentMethodIds = [...new Set(
        pedidosEntreguesSemAR
          .filter((p) => p.installmentsJson?.installments)
          .flatMap((p) => p.installmentsJson.installments.map((i) => i.paymentMethodId).filter(Boolean))
      )]
      const paymentMethods = paymentMethodIds.length > 0
        ? await prisma.paymentMethod.findMany({
            where: { id: { in: paymentMethodIds } },
            select: { id: true, name: true },
          })
        : []
      const pmMap = Object.fromEntries(paymentMethods.map((pm) => [pm.id, pm.name]))

      const result = pedidosEntreguesSemAR.map((p) => {
        const instData = p.installmentsJson
        const parcelas = instData?.installments && Array.isArray(instData.installments)
          ? instData.installments.map((inst, i) => ({
              parcela: i + 1,
              dueDate: inst.dueDate,
              amount: Number(inst.amount),
              description: inst.description,
              paymentMethodId: inst.paymentMethodId || null,
              paymentMethodName: inst.paymentMethodId ? (pmMap[inst.paymentMethodId] ?? '(não encontrada)') : null,
            }))
          : []
        return {
          id: p.id,
          saleDate: p.saleDate,
          createdAt: p.createdAt,
          total: Number(p.total),
          status: p.status,
          isBonificacao: p.isBonificacao,
          customerName: p.customer?.name ?? '-',
          customerId: p.customerId,
          installmentsJson: p.installmentsJson,
          parcelas,
          temFormaPagamento: parcelas.some((parc) => parc.paymentMethodName),
          items: p.items?.map((item) => ({
            productName: item.product?.name,
            sku: item.product?.sku,
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice),
            total: Number(item.total),
          })) ?? [],
        }
      })
      return NextResponse.json({
        success: true,
        data: {
          total: result.length,
          totalValor: result.reduce((s, r) => s + r.total, 0),
          itens: result,
          resumo: result.length > 0
            ? `${result.length} pedido(s) entregue(s) sem contas a receber. Use "Corrigir" para criar AR.`
            : 'Todos os pedidos entregues possuem contas a receber.',
        },
      })
    }

    if (tipo === 'ar_pedidos') {
      // AR com salesOrderId onde o pedido está CANCELED, DRAFT ou CONFIRMED (não entregue)
      const arInconsistentes = await prisma.accountsReceivable.findMany({
        where: {
          salesOrderId: { not: null },
          salesOrder: {
            status: { in: ['CANCELED', 'DRAFT', 'CONFIRMED'] },
          },
        },
        include: {
          salesOrder: {
            select: {
              id: true,
              status: true,
              saleDate: true,
              total: true,
              customer: { select: { name: true } },
            },
          },
          customer: { select: { id: true, name: true } },
        },
        orderBy: { dueDate: 'asc' },
      })

      const result = arInconsistentes.map((ar) => ({
        id: ar.id,
        description: ar.description,
        amount: Number(ar.amount),
        status: ar.status,
        dueDate: ar.dueDate,
        salesOrderId: ar.salesOrderId,
        salesOrderStatus: ar.salesOrder?.status,
        salesOrderTotal: ar.salesOrder ? Number(ar.salesOrder.total) : null,
        customerName: ar.customer?.name || ar.salesOrder?.customer?.name || '-',
      }))

      const porStatus = {
        CANCELED: result.filter((r) => r.salesOrderStatus === 'CANCELED'),
        DRAFT: result.filter((r) => r.salesOrderStatus === 'DRAFT'),
        CONFIRMED: result.filter((r) => r.salesOrderStatus === 'CONFIRMED'),
      }

      return NextResponse.json({
        success: true,
        data: {
          total: result.length,
          totalValor: result.reduce((s, r) => s + r.amount, 0),
          porStatus: {
            cancelados: porStatus.CANCELED.length,
            digitados: porStatus.DRAFT.length,
            confirmados: porStatus.CONFIRMED.length,
          },
          itens: result,
          resumo: `Encontradas ${result.length} contas a receber vinculadas a pedidos cancelados (${porStatus.CANCELED.length}), digitados (${porStatus.DRAFT.length}) ou confirmados (${porStatus.CONFIRMED.length}) - que ainda não foram entregues.`,
        },
      })
    }

    return NextResponse.json(
      { success: false, error: { message: 'Tipo de validação não reconhecido', code: 'BAD_REQUEST' } },
      { status: 400 }
    )
  } catch (error) {
    console.error('Erro em GET /api/finance/validate:', error)
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Erro na validação', code: 'ERROR' } },
      { status: error.statusCode || 500 }
    )
  }
}

/** Corrigir AR inconsistentes: cancela AR OPEN vinculados a pedidos cancelados ou não entregues. Apenas ADMIN. */
export async function POST(request) {
  try {
    const user = authenticate(request)
    authorize(user, 'ADMIN')

    const body = await request.json().catch(() => ({}))
    const acao = body.acao || 'ar_pedidos'

    if (acao === 'ar_pedidos') {
      const atualizados = await prisma.accountsReceivable.updateMany({
        where: {
          salesOrderId: { not: null },
          status: 'OPEN',
          salesOrder: {
            status: { in: ['CANCELED', 'DRAFT', 'CONFIRMED'] },
          },
        },
        data: { status: 'CANCELED' },
      })

      return NextResponse.json({
        success: true,
        data: {
          corrigidos: atualizados.count,
          message: `${atualizados.count} contas a receber canceladas (vinculadas a pedidos cancelados ou não entregues)`,
        },
      })
    }

    if (acao === 'caixa_reverter') {
      const transactionId = body.transactionId
      if (!transactionId || typeof transactionId !== 'string') {
        return NextResponse.json(
          { success: false, error: { message: 'transactionId é obrigatório', code: 'BAD_REQUEST' } },
          { status: 400 }
        )
      }

      const original = await prisma.cashTransaction.findUnique({
        where: { id: transactionId },
      })
      if (!original) {
        return NextResponse.json(
          { success: false, error: { message: 'Transação de caixa não encontrada', code: 'NOT_FOUND' } },
          { status: 404 }
        )
      }

      const tipoEstorno = original.type === 'IN' ? 'OUT' : 'IN'
      const descEstorno = `Estorno: ${original.description}`.slice(0, 255)

      await prisma.cashTransaction.create({
        data: {
          type: tipoEstorno,
          origin: 'MANUAL',
          originId: original.id,
          date: new Date(),
          amount: original.amount,
          description: descEstorno,
          categoryId: original.categoryId,
          createdById: user.id,
        },
      })

      return NextResponse.json({
        success: true,
        data: {
          message: 'Transação revertida (estorno lançado no caixa).',
        },
      })
    }

    if (acao === 'estoque_excluir_duplicata') {
      const { movementId } = body
      if (!movementId || typeof movementId !== 'string') {
        return NextResponse.json(
          { success: false, error: { message: 'movementId é obrigatório', code: 'VALIDATION' } },
          { status: 400 }
        )
      }
      const mov = await prisma.stockMovement.findUnique({
        where: { id: movementId },
        include: { product: { include: { stockBalance: true } } },
      })
      if (!mov || mov.type !== 'OUT' || mov.referenceType !== 'SALE' || !mov.referenceId) {
        return NextResponse.json(
          { success: false, error: { message: 'Movimentação não encontrada ou inválida', code: 'NOT_FOUND' } },
          { status: 404 }
        )
      }
      const qty = Number(mov.quantity)
      const balance = mov.product?.stockBalance
      if (!balance) {
        return NextResponse.json(
          { success: false, error: { message: 'Produto sem saldo de estoque', code: 'BAD_REQUEST' } },
          { status: 400 }
        )
      }
      await prisma.$transaction(async (tx) => {
        await tx.stockMovement.delete({ where: { id: movementId } })
        const newQty = Number(balance.quantity) + qty
        await tx.stockBalance.update({
          where: { productId: mov.productId },
          data: { quantity: new Decimal(newQty) },
        })
      })
      return NextResponse.json({
        success: true,
        data: {
          message: `Movimentação excluída. Estoque do produto ${mov.product?.name} corrigido (+${qty}).`,
        },
      })
    }

    if (acao === 'reverter_estoque_vendas_canceladas') {
      const movimentos = await prisma.stockMovement.findMany({
        where: {
          type: 'OUT',
          referenceType: 'SALE',
          referenceId: { not: null },
        },
      })
      const orderIds = [...new Set(movimentos.map((m) => m.referenceId).filter(Boolean))]
      const canceledOrders = orderIds.length
        ? await prisma.salesOrder.findMany({
            where: { id: { in: orderIds }, status: 'CANCELED' },
            select: { id: true },
          })
        : []
      const canceledIds = new Set(canceledOrders.map((o) => o.id))
      const movimentosParaReverter = movimentos.filter((m) => m.referenceId && canceledIds.has(m.referenceId))

      let revertidos = 0
      for (const mov of movimentosParaReverter) {
        const orderId = mov.referenceId
        const qty = Number(mov.quantity)

        await prisma.$transaction(async (tx) => {
          await tx.stockMovement.create({
            data: {
              productId: mov.productId,
              type: 'IN',
              quantity: mov.quantity,
              referenceType: 'MANUAL',
              referenceId: mov.id,
              note: `Estorno - Venda cancelada #${orderId.slice(0, 8)}`,
              createdById: user.id,
            },
          })
          const balance = await tx.stockBalance.findUnique({ where: { productId: mov.productId } })
          if (balance) {
            const newQty = Number(balance.quantity) + qty
            await tx.stockBalance.update({
              where: { productId: mov.productId },
              data: { quantity: new Decimal(newQty) },
            })
          }
        })
        revertidos++
      }

      return NextResponse.json({
        success: true,
        data: {
          revertidos,
          message: `${revertidos} movimentação(ões) revertida(s). Estoque corrigido.`,
        },
      })
    }

    if (acao === 'transferir_ar') {
      const dePedidoId = body.dePedidoId
      const paraPedidoId = body.paraPedidoId
      if (!dePedidoId || !paraPedidoId || typeof dePedidoId !== 'string' || typeof paraPedidoId !== 'string') {
        return NextResponse.json(
          { success: false, error: { message: 'dePedidoId e paraPedidoId são obrigatórios', code: 'BAD_REQUEST' } },
          { status: 400 }
        )
      }
      if (dePedidoId === paraPedidoId) {
        return NextResponse.json(
          { success: false, error: { message: 'Pedidos devem ser diferentes', code: 'BAD_REQUEST' } },
          { status: 400 }
        )
      }

      const [pedidoOrigem, pedidoDestino] = await Promise.all([
        prisma.salesOrder.findUnique({
          where: { id: dePedidoId },
          include: { accountsReceivable: true },
        }),
        prisma.salesOrder.findUnique({
          where: { id: paraPedidoId },
          include: { accountsReceivable: true },
        }),
      ])

      if (!pedidoOrigem) {
        return NextResponse.json(
          { success: false, error: { message: 'Pedido de origem não encontrado', code: 'NOT_FOUND' } },
          { status: 404 }
        )
      }
      if (!pedidoDestino) {
        return NextResponse.json(
          { success: false, error: { message: 'Pedido de destino não encontrado', code: 'NOT_FOUND' } },
          { status: 404 }
        )
      }
      if (pedidoOrigem.status !== 'CANCELED') {
        return NextResponse.json(
          { success: false, error: { message: 'Pedido de origem deve estar cancelado', code: 'BAD_REQUEST' } },
          { status: 400 }
        )
      }
      if (pedidoDestino.status !== 'DELIVERED') {
        return NextResponse.json(
          { success: false, error: { message: 'Pedido de destino deve estar entregue', code: 'BAD_REQUEST' } },
          { status: 400 }
        )
      }

      const arParaTransferir = pedidoOrigem.accountsReceivable.filter((ar) => ar.status === 'OPEN' || ar.status === 'CANCELED')
      if (arParaTransferir.length === 0) {
        return NextResponse.json(
          { success: false, error: { message: 'Pedido de origem não possui contas a receber para transferir', code: 'BAD_REQUEST' } },
          { status: 400 }
        )
      }

      // Transferir AR (OPEN ou CANCELED) e reativar como OPEN
      const atualizados = await prisma.accountsReceivable.updateMany({
        where: {
          salesOrderId: dePedidoId,
          status: { in: ['OPEN', 'CANCELED'] },
        },
        data: { salesOrderId: paraPedidoId, status: 'OPEN' },
      })

      return NextResponse.json({
        success: true,
        data: {
          transferidos: atualizados.count,
          message: `${atualizados.count} conta(s) a receber transferida(s) do pedido #${dePedidoId.slice(0, 8)} para o pedido #${paraPedidoId.slice(0, 8)}`,
        },
      })
    }

    if (acao === 'pedidos_sem_ar') {
      const pedidos = await prisma.salesOrder.findMany({
        where: {
          status: 'DELIVERED',
          isBonificacao: false,
          accountsReceivable: { none: {} },
        },
      })
      let criados = 0
      for (const order of pedidos) {
        const installmentsData = order.installmentsJson
        const hasInstallments = installmentsData?.installments && Array.isArray(installmentsData.installments) && installmentsData.installments.length > 0

        if (hasInstallments) {
          const baseDescription = `Pedido de venda #${order.id.slice(0, 8)}`
          const categoryId = installmentsData.categoryId || null
          const saleDate = order.saleDate
          for (let i = 0; i < installmentsData.installments.length; i++) {
            const inst = installmentsData.installments[i]
            const installmentNumber = installmentsData.installments.length > 1 ? ` - Parcela ${i + 1}/${installmentsData.installments.length}` : ''
            let paymentMethodId = inst.paymentMethodId && String(inst.paymentMethodId).trim() !== '' ? inst.paymentMethodId : null
            if (paymentMethodId) {
              const pm = await prisma.paymentMethod.findUnique({ where: { id: paymentMethodId } })
              if (!pm) paymentMethodId = null
            }
            let paymentDays = null
            if (inst.dueDate && saleDate) {
              const dueDate = new Date(inst.dueDate)
              const diffDays = Math.ceil((dueDate.getTime() - new Date(saleDate).getTime()) / (1000 * 60 * 60 * 24))
              if (diffDays > 0) paymentDays = diffDays
            }
            await prisma.accountsReceivable.create({
              data: {
                customerId: order.customerId,
                salesOrderId: order.id,
                description: inst.description || `${baseDescription}${installmentNumber}`,
                dueDate: new Date(inst.dueDate),
                amount: new Decimal(Number(inst.amount)),
                categoryId,
                paymentMethodId,
                paymentDays,
                status: 'OPEN',
              },
            })
            criados++
          }
        } else {
          const defaultDueDate = new Date(order.saleDate)
          defaultDueDate.setDate(defaultDueDate.getDate() + 30)
          await prisma.accountsReceivable.create({
            data: {
              customerId: order.customerId,
              salesOrderId: order.id,
              description: `Pedido de venda #${order.id.slice(0, 8)}`,
              dueDate: defaultDueDate,
              amount: order.total,
              categoryId: null,
              paymentMethodId: null,
              paymentDays: 30,
              status: 'OPEN',
            },
          })
          criados++
        }
      }
      return NextResponse.json({
        success: true,
        data: {
          corrigidos: pedidos.length,
          arCriadas: criados,
          message: `${criados} conta(s) a receber criada(s) para ${pedidos.length} pedido(s).`,
        },
      })
    }

    if (acao === 'estornar_cancelamento') {
      const salesOrderId = body.salesOrderId
      if (!salesOrderId || typeof salesOrderId !== 'string') {
        return NextResponse.json(
          { success: false, error: { message: 'salesOrderId é obrigatório', code: 'BAD_REQUEST' } },
          { status: 400 }
        )
      }

      const order = await prisma.salesOrder.findUnique({
        where: { id: salesOrderId },
        include: {
          items: {
            include: {
              product: {
                include: { stockBalance: true },
              },
            },
          },
          accountsReceivable: { select: { id: true, status: true } },
        },
      })

      if (!order) {
        return NextResponse.json(
          { success: false, error: { message: 'Pedido não encontrado', code: 'NOT_FOUND' } },
          { status: 404 }
        )
      }
      if (order.status !== 'CANCELED') {
        return NextResponse.json(
          { success: false, error: { message: 'Apenas pedidos cancelados podem ser estornados', code: 'BAD_REQUEST' } },
          { status: 400 }
        )
      }

      const existingOut = await prisma.stockMovement.count({
        where: {
          referenceType: 'SALE',
          referenceId: order.id,
          type: 'OUT',
        },
      })

      await prisma.$transaction(async (tx) => {
        // 1) Status do pedido para DELIVERED
        await tx.salesOrder.update({
          where: { id: order.id },
          data: { status: 'DELIVERED' },
        })

        // 2) Contas a receber: reabrir AR canceladas; se não houver nenhuma, criar a partir de installmentsJson/total
        const arCanceladas = order.accountsReceivable.filter((ar) => ar.status === 'CANCELED')
        const arAbertas = order.accountsReceivable.filter((ar) => ar.status === 'OPEN')
        if (arCanceladas.length > 0) {
          await tx.accountsReceivable.updateMany({
            where: { salesOrderId: order.id, status: 'CANCELED' },
            data: { status: 'OPEN' },
          })
        } else if (arAbertas.length === 0) {
          const installmentsData = order.installmentsJson
          const hasInstallments = installmentsData?.installments && Array.isArray(installmentsData.installments) && installmentsData.installments.length > 0
          if (!order.isBonificacao) {
            if (hasInstallments) {
              const baseDescription = `Pedido de venda #${order.id.slice(0, 8)}`
              const categoryId = installmentsData.categoryId || null
              const saleDate = order.saleDate
              for (let i = 0; i < installmentsData.installments.length; i++) {
                const inst = installmentsData.installments[i]
                const installmentNumber = installmentsData.installments.length > 1 ? ` - Parcela ${i + 1}/${installmentsData.installments.length}` : ''
                let paymentMethodId = inst.paymentMethodId && String(inst.paymentMethodId).trim() !== '' ? inst.paymentMethodId : null
                if (paymentMethodId) {
                  const pm = await tx.paymentMethod.findUnique({ where: { id: paymentMethodId } })
                  if (!pm) paymentMethodId = null
                }
                let paymentDays = null
                if (inst.dueDate && saleDate) {
                  const dueDate = new Date(inst.dueDate)
                  const diffDays = Math.ceil((dueDate.getTime() - new Date(saleDate).getTime()) / (1000 * 60 * 60 * 24))
                  if (diffDays > 0) paymentDays = diffDays
                }
                await tx.accountsReceivable.create({
                  data: {
                    customerId: order.customerId,
                    salesOrderId: order.id,
                    description: inst.description || `${baseDescription}${installmentNumber}`,
                    dueDate: new Date(inst.dueDate),
                    amount: new Decimal(Number(inst.amount)),
                    categoryId: categoryId || null,
                    paymentMethodId,
                    paymentDays,
                    status: 'OPEN',
                  },
                })
              }
            } else {
              const defaultDueDate = new Date(order.saleDate)
              defaultDueDate.setDate(defaultDueDate.getDate() + 30)
              await tx.accountsReceivable.create({
                data: {
                  customerId: order.customerId,
                  salesOrderId: order.id,
                  description: `Pedido de venda #${order.id.slice(0, 8)}`,
                  dueDate: defaultDueDate,
                  amount: order.total,
                  categoryId: null,
                  paymentMethodId: null,
                  paymentDays: 30,
                  status: 'OPEN',
                },
              })
            }
          }
        }

        // 3) Estoque: criar saídas apenas se ainda não existir (evitar duplicata)
        if (existingOut === 0) {
          for (const item of order.items) {
            const product = item.product
            if (product.type !== 'SERVICO') {
              const balance = product.stockBalance
              if (!balance) continue
              const currentQuantity = Number(balance.quantity)
              const requestedQuantity = Number(item.quantity)
              if (currentQuantity < requestedQuantity) {
                throw new BadRequestError(`Estoque insuficiente para ${product.name}. Disponível: ${currentQuantity}`)
              }
              await tx.stockMovement.create({
                data: {
                  productId: item.productId,
                  type: 'OUT',
                  quantity: item.quantity,
                  referenceType: 'SALE',
                  referenceId: order.id,
                  note: `Saída - Pedido de venda #${order.id.slice(0, 8)} (estorno cancelamento)`,
                  createdById: user.id,
                },
              })
              const newQuantity = currentQuantity - requestedQuantity
              await tx.stockBalance.update({
                where: { productId: item.productId },
                data: { quantity: new Decimal(newQuantity) },
              })
            }
          }
        }
      })

      return NextResponse.json({
        success: true,
        data: {
          message: 'Cancelamento estornado. Pedido restaurado como entregue; contas a receber e movimentação de estoque restauradas.',
        },
      })
    }

    if (acao === 'caixa_excluir') {
      const transactionId = body.transactionId
      if (!transactionId || typeof transactionId !== 'string') {
        return NextResponse.json(
          { success: false, error: { message: 'transactionId é obrigatório', code: 'BAD_REQUEST' } },
          { status: 400 }
        )
      }

      const original = await prisma.cashTransaction.findUnique({
        where: { id: transactionId },
      })
      if (!original) {
        return NextResponse.json(
          { success: false, error: { message: 'Transação de caixa não encontrada', code: 'NOT_FOUND' } },
          { status: 404 }
        )
      }

      await prisma.cashTransaction.delete({
        where: { id: transactionId },
      })

      return NextResponse.json({
        success: true,
        data: {
          message: 'Transação excluída. O outro registro foi mantido.',
        },
      })
    }

    return NextResponse.json(
      { success: false, error: { message: 'Ação não reconhecida', code: 'BAD_REQUEST' } },
      { status: 400 }
    )
  } catch (error) {
    console.error('Erro em POST /api/finance/validate:', error)
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Erro na validação', code: 'ERROR' } },
      { status: error.statusCode || 500 }
    )
  }
}
