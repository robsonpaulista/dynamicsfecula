import { NextResponse } from 'next/server'
import { Decimal } from '@prisma/client/runtime/library'
import { prisma } from '@/lib/prisma'
import { authenticate, authorize } from '@/middleware/auth'
import { NotFoundError, BadRequestError } from '@/utils/errors'

// GET - Listar devoluções de um pedido
export async function GET(request, { params }) {
  try {
    const user = authenticate(request)
    authorize(user, 'ADMIN', 'VENDAS', 'ESTOQUE', 'FINANCEIRO')

    const returns = await prisma.salesReturn.findMany({
      where: { salesOrderId: params.id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                unit: true,
              },
            },
            salesItem: {
              select: {
                id: true,
                quantity: true,
              },
            },
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        customerCredit: {
          select: {
            id: true,
            amount: true,
            usedAmount: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Serializar valores Decimal
    const serializedReturns = returns.map((ret) => ({
      ...ret,
      total: Number(ret.total),
      items: ret.items.map((item) => ({
        ...item,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        total: Number(item.total),
      })),
      customerCredit: ret.customerCredit
        ? {
            ...ret.customerCredit,
            amount: Number(ret.customerCredit.amount),
            usedAmount: Number(ret.customerCredit.usedAmount),
          }
        : null,
    }))

    return NextResponse.json({
      success: true,
      data: serializedReturns,
    })
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof BadRequestError) {
      return NextResponse.json(
        { success: false, error: { message: error.message, code: error.code || 'ERROR' } },
        { status: error.statusCode || 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: { message: error.message, code: 'ERROR' } },
      { status: 500 }
    )
  }
}

// POST - Criar devolução
export async function POST(request, { params }) {
  try {
    const user = authenticate(request)
    authorize(user, 'ADMIN', 'VENDAS', 'ESTOQUE')

    const body = await request.json()
    const { items, reason, refundType = 'CREDIT' } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: { message: 'É necessário informar pelo menos um item para devolução', code: 'BAD_REQUEST' } },
        { status: 400 }
      )
    }

    if (!reason || reason.trim() === '') {
      return NextResponse.json(
        { success: false, error: { message: 'O motivo da devolução é obrigatório', code: 'BAD_REQUEST' } },
        { status: 400 }
      )
    }

    // Buscar o pedido de venda
    const salesOrder = await prisma.salesOrder.findUnique({
      where: { id: params.id },
      include: {
        items: {
          include: {
            product: {
              include: {
                stockBalance: true,
              },
            },
          },
        },
        accountsReceivable: true,
        returns: {
          include: {
            items: true,
          },
        },
      },
    })

    if (!salesOrder) {
      return NextResponse.json(
        { success: false, error: { message: 'Pedido de venda não encontrado', code: 'NOT_FOUND' } },
        { status: 404 }
      )
    }

    if (salesOrder.status !== 'DELIVERED') {
      return NextResponse.json(
        { success: false, error: { message: 'Apenas pedidos entregues podem ter devolução', code: 'BAD_REQUEST' } },
        { status: 400 }
      )
    }

    // Calcular quantidades já devolvidas por item
    const returnedQuantities = {}
    salesOrder.returns
      .filter((ret) => ret.status !== 'CANCELED')
      .forEach((ret) => {
        ret.items.forEach((item) => {
          const key = item.salesItemId
          if (!returnedQuantities[key]) {
            returnedQuantities[key] = 0
          }
          returnedQuantities[key] += Number(item.quantity)
        })
      })

    // Validar itens e calcular total
    let total = new Decimal(0)
    const returnItems = []

    for (const returnItem of items) {
      const { salesItemId, quantity } = returnItem

      if (!salesItemId || !quantity || quantity <= 0) {
        return NextResponse.json(
          { success: false, error: { message: 'Todos os itens devem ter quantidade válida', code: 'BAD_REQUEST' } },
          { status: 400 }
        )
      }

      // Encontrar o item original do pedido
      const originalItem = salesOrder.items.find((item) => item.id === salesItemId)
      if (!originalItem) {
        return NextResponse.json(
          { success: false, error: { message: `Item ${salesItemId} não encontrado no pedido`, code: 'BAD_REQUEST' } },
          { status: 400 }
        )
      }

      // Verificar quantidade disponível para devolução
      const originalQuantity = Number(originalItem.quantity)
      const alreadyReturned = returnedQuantities[salesItemId] || 0
      const availableToReturn = originalQuantity - alreadyReturned

      if (quantity > availableToReturn) {
        return NextResponse.json(
          {
            success: false,
            error: {
              message: `Quantidade solicitada (${quantity}) excede a disponível para devolução (${availableToReturn}) do item ${originalItem.product.name}`,
              code: 'BAD_REQUEST',
            },
          },
          { status: 400 }
        )
      }

      const unitPrice = originalItem.unitPrice
      const itemTotal = new Decimal(quantity).times(unitPrice)
      total = total.plus(itemTotal)

      returnItems.push({
        salesItemId,
        productId: originalItem.productId,
        quantity: new Decimal(quantity),
        unitPrice,
        total: itemTotal,
      })
    }

    if (total.equals(0)) {
      return NextResponse.json(
        { success: false, error: { message: 'O valor total da devolução deve ser maior que zero', code: 'BAD_REQUEST' } },
        { status: 400 }
      )
    }

    // Criar a devolução
    const salesReturn = await prisma.salesReturn.create({
      data: {
        salesOrderId: params.id,
        returnDate: new Date(),
        reason: reason.trim(),
        total,
        status: 'PENDING',
        refundType,
        createdById: user.id,
        items: {
          create: returnItems,
        },
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                unit: true,
              },
            },
          },
        },
      },
    })

    // Processar a devolução
    await processReturn(salesReturn.id, params.id, refundType, user.id)

    // Buscar a devolução atualizada
    const updatedReturn = await prisma.salesReturn.findUnique({
      where: { id: salesReturn.id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                unit: true,
              },
            },
          },
        },
        customerCredit: true,
      },
    })

    // Serializar valores Decimal
    const serializedReturn = {
      ...updatedReturn,
      total: Number(updatedReturn.total),
      items: updatedReturn.items.map((item) => ({
        ...item,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        total: Number(item.total),
      })),
      customerCredit: updatedReturn.customerCredit
        ? {
            ...updatedReturn.customerCredit,
            amount: Number(updatedReturn.customerCredit.amount),
            usedAmount: Number(updatedReturn.customerCredit.usedAmount),
          }
        : null,
    }

    return NextResponse.json({
      success: true,
      data: serializedReturn,
      message: 'Devolução criada e processada com sucesso',
    })
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof BadRequestError) {
      return NextResponse.json(
        { success: false, error: { message: error.message, code: error.code || 'ERROR' } },
        { status: error.statusCode || 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: { message: error.message, code: 'ERROR' } },
      { status: 500 }
    )
  }
}

// Função auxiliar para processar a devolução
async function processReturn(returnId, salesOrderId, refundType, userId) {
  // Buscar a devolução com itens
  const salesReturn = await prisma.salesReturn.findUnique({
    where: { id: returnId },
    include: {
      items: {
        include: {
          product: {
            include: {
              stockBalance: true,
            },
          },
        },
      },
    },
  })

  // Buscar o pedido novamente para ter acesso às contas a receber
  const salesOrder = await prisma.salesOrder.findUnique({
    where: { id: salesOrderId },
    select: {
      id: true,
      customerId: true,
    },
  })

  // Atualizar estoque (entrada dos produtos devolvidos)
  for (const item of salesReturn.items) {
    const product = item.product

    // Apenas produtos físicos atualizam estoque
    if (product.type !== 'SERVICO') {
      // Criar movimentação de entrada
      await prisma.stockMovement.create({
        data: {
          productId: item.productId,
          type: 'IN',
          quantity: item.quantity,
          referenceType: 'RETURN',
          referenceId: returnId,
          note: `Entrada - Devolução de venda #${salesOrder.id.slice(0, 8)}`,
          createdById: userId,
        },
      })

      // Atualizar saldo de estoque
      const balance = product.stockBalance
      const currentQuantity = balance ? Number(balance.quantity) : 0
      const newQuantity = currentQuantity + Number(item.quantity)

      await prisma.stockBalance.upsert({
        where: { productId: item.productId },
        create: {
          productId: item.productId,
          quantity: new Decimal(newQuantity),
        },
        update: {
          quantity: new Decimal(newQuantity),
        },
      })
    }
  }

  // Processar reembolso
  if (refundType === 'ACCOUNT_RECEIVABLE') {
    // Buscar contas a receber abertas do pedido
    const openAccountsReceivable = await prisma.accountsReceivable.findMany({
      where: {
        salesOrderId: salesOrder.id,
        status: 'OPEN',
      },
      orderBy: { dueDate: 'asc' },
    })

    // Abater em contas a receber abertas do pedido
    const totalReturn = Number(salesReturn.total)
    let remaining = totalReturn

    for (const ar of openAccountsReceivable) {
      if (remaining <= 0) break

      const arAmount = Number(ar.amount)
      if (arAmount > 0) {
        const deduction = Math.min(remaining, arAmount)
        const newAmount = arAmount - deduction

        if (newAmount <= 0.01) {
          // Se o valor restante é muito pequeno, cancelar a conta
          await prisma.accountsReceivable.update({
            where: { id: ar.id },
            data: {
              status: 'CANCELED',
              amount: new Decimal(0),
            },
          })
        } else {
          // Atualizar o valor da conta
          await prisma.accountsReceivable.update({
            where: { id: ar.id },
            data: {
              amount: new Decimal(newAmount),
              description: `${ar.description} (abatido R$ ${deduction.toFixed(2)} por devolução)`,
            },
          })
        }

        remaining -= deduction
      }
    }

    // Se ainda sobrar valor, criar crédito
    if (remaining > 0.01) {
      await prisma.customerCredit.create({
        data: {
          customerId: salesOrder.customerId,
          salesReturnId: returnId,
          amount: new Decimal(remaining),
          description: `Crédito por devolução parcial - Pedido #${salesOrder.id.slice(0, 8)}`,
          status: 'ACTIVE',
        },
      })
    }
  } else {
    // Criar crédito para o cliente
    await prisma.customerCredit.create({
      data: {
        customerId: salesOrder.customerId,
        salesReturnId: returnId,
        amount: salesReturn.total,
        description: `Crédito por devolução - Pedido #${salesOrder.id.slice(0, 8)}`,
        status: 'ACTIVE',
      },
    })
  }

  // Atualizar status da devolução para PROCESSED
  await prisma.salesReturn.update({
    where: { id: returnId },
    data: { status: 'PROCESSED' },
  })
}


