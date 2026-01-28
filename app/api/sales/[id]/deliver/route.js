import { NextResponse } from 'next/server'
import { Decimal } from '@prisma/client/runtime/library'
import { prisma } from '@/lib/prisma'
import { authenticate, authorize } from '@/middleware/auth'
import { NotFoundError, BadRequestError } from '@/utils/errors'

export async function POST(request, { params }) {
  try {
    const user = authenticate(request)
    authorize(user, 'ADMIN', 'VENDAS', 'ESTOQUE')

    const order = await prisma.salesOrder.findUnique({
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
      return NextResponse.json(
        { success: false, error: { message: 'Pedido de venda não encontrado', code: 'NOT_FOUND' } },
        { status: 404 }
      )
    }

    if (order.status === 'DELIVERED') {
      return NextResponse.json(
        { success: false, error: { message: 'Pedido já foi confirmado/entregue', code: 'BAD_REQUEST' } },
        { status: 400 }
      )
    }

    if (order.status === 'CANCELED') {
      return NextResponse.json(
        { success: false, error: { message: 'Pedido cancelado não pode ser confirmado', code: 'BAD_REQUEST' } },
        { status: 400 }
      )
    }

    // Baixar estoque para cada item
    for (const item of order.items) {
      const product = item.product

      // Apenas produtos físicos baixam estoque
      if (product.type !== 'SERVICO') {
        // Verificar estoque novamente antes de baixar
        const balance = product.stockBalance
        if (!balance) {
          return NextResponse.json(
            { success: false, error: { message: `Produto ${product.name} não possui saldo de estoque`, code: 'BAD_REQUEST' } },
            { status: 400 }
          )
        }

        const currentQuantity = Number(balance.quantity)
        const requestedQuantity = Number(item.quantity)

        if (currentQuantity < requestedQuantity) {
          return NextResponse.json(
            { success: false, error: { message: `Estoque insuficiente para ${product.name}. Disponível: ${currentQuantity}`, code: 'BAD_REQUEST' } },
            { status: 400 }
          )
        }

        // Criar movimentação de saída
        await prisma.stockMovement.create({
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

        await prisma.stockBalance.update({
          where: { productId: item.productId },
          data: { quantity: new Decimal(newQuantity) },
        })
      }
    }

    // Atualizar status do pedido
    await prisma.salesOrder.update({
      where: { id: order.id },
      data: { status: 'DELIVERED' },
    })

    return NextResponse.json({
      success: true,
      message: 'Pedido confirmado e estoque atualizado com sucesso',
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















