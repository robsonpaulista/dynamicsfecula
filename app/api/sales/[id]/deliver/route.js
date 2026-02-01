import { NextResponse } from 'next/server'
import { Decimal } from '@prisma/client/runtime/library'
import { prisma } from '@/lib/prisma'
import { authenticate, authorize } from '@/middleware/auth'
import { NotFoundError, BadRequestError } from '@/utils/errors'

export async function POST(request, { params }) {
  try {
    const user = authenticate(request)
    authorize(user, 'ADMIN', 'VENDAS', 'ESTOQUE')

    await prisma.$transaction(async (tx) => {
      // Lock da linha para evitar confirmação duplicada (race condition: dois cliques ou duas requisições simultâneas)
      const locked = await tx.$queryRaw`
        SELECT id, status FROM sales_orders WHERE id = ${params.id} FOR UPDATE
      `
      if (!locked || locked.length === 0) {
        throw new NotFoundError('Pedido de venda não encontrado')
      }

      const order = await tx.salesOrder.findUnique({
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
        },
      })

      if (!order) {
        throw new NotFoundError('Pedido de venda não encontrado')
      }

      if (order.status === 'DELIVERED') {
        throw new BadRequestError('Pedido já foi confirmado/entregue')
      }

      if (order.status === 'CANCELED') {
        throw new BadRequestError('Pedido cancelado não pode ser confirmado')
      }

      // Verificar se já existe saída de estoque para este pedido (defesa extra contra duplicação)
      const existingOut = await tx.stockMovement.count({
        where: {
          referenceType: 'SALE',
          referenceId: order.id,
          type: 'OUT',
        },
      })
      if (existingOut > 0) {
        throw new BadRequestError('Este pedido já possui saída de estoque registrada. Possível duplicação anterior.')
      }

      // Baixar estoque para cada item
      for (const item of order.items) {
      const product = item.product

      // Apenas produtos físicos baixam estoque
      if (product.type !== 'SERVICO') {
        // Verificar estoque novamente antes de baixar
        const balance = product.stockBalance
        if (!balance) {
          throw new BadRequestError(`Produto ${product.name} não possui saldo de estoque`)
        }

        const currentQuantity = Number(balance.quantity)
        const requestedQuantity = Number(item.quantity)

        if (currentQuantity < requestedQuantity) {
          throw new BadRequestError(`Estoque insuficiente para ${product.name}. Disponível: ${currentQuantity}`)
        }

        // Criar movimentação de saída
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            type: 'OUT',
            quantity: item.quantity,
            referenceType: 'SALE',
            referenceId: order.id,
            note: `Saída - Pedido de venda #${order.id.slice(0, 8)}`,
            createdById: user.id,
          },
        })

        // Atualizar saldo de estoque
        const newQuantity = currentQuantity - requestedQuantity

        await tx.stockBalance.update({
          where: { productId: item.productId },
          data: { quantity: new Decimal(newQuantity) },
        })
      }
    }

      // Atualizar status do pedido
      await tx.salesOrder.update({
        where: { id: order.id },
        data: { status: 'DELIVERED' },
      })

      // Criar contas a receber na confirmação de entrega
    // Caso 1: parcelas gravadas na digitação (installmentsJson)
    // Caso 2: sem parcelas (pedido antigo ou API direta) -> criar uma AR única com o total
      const installmentsData = order.installmentsJson
      const hasInstallments = installmentsData && installmentsData.installments && Array.isArray(installmentsData.installments) && installmentsData.installments.length > 0

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
            const paymentMethod = await tx.paymentMethod.findUnique({ where: { id: paymentMethodId } })
            if (!paymentMethod) paymentMethodId = null
          }
          let paymentDays = null
          if (inst.dueDate && saleDate) {
            const dueDate = new Date(inst.dueDate)
            const diffTime = dueDate.getTime() - new Date(saleDate).getTime()
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
            if (diffDays > 0) paymentDays = diffDays
          }

          await tx.accountsReceivable.create({
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
        }
      } else {
        // Sem parcelas gravadas: pedido antigo (antes da migração installmentsJson) ou API direta
        // Criar uma AR única com o total do pedido, vencimento em 30 dias
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
    })

    return NextResponse.json({
      success: true,
      message: 'Pedido confirmado, estoque atualizado e contas a receber geradas com sucesso',
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
      { status: error.statusCode || 500 }
    )
  }
}















