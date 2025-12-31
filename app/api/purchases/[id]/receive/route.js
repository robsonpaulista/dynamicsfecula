import { NextResponse } from 'next/server'
import { z } from 'zod'
import { Decimal } from '@prisma/client/runtime/library'
import { prisma } from '@/lib/prisma'
import { authenticate, authorize } from '@/middleware/auth'
import { NotFoundError, BadRequestError } from '@/utils/errors'

const receiveSchema = z.object({
  receiptDate: z.string().or(z.date()).optional(),
  invoiceNumber: z.string().optional(),
})

export async function POST(request, { params }) {
  try {
    const user = authenticate(request)
    authorize(user, 'ADMIN', 'COMPRAS', 'ESTOQUE')

    const body = await request.json()
    const data = receiveSchema.parse(body)

    // Buscar o pedido de compra
    const order = await prisma.purchaseOrder.findUnique({
      where: { id: params.id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json(
        { success: false, error: { message: 'Pedido de compra não encontrado', code: 'NOT_FOUND' } },
        { status: 404 }
      )
    }

    if (order.status === 'RECEIVED') {
      return NextResponse.json(
        { success: false, error: { message: 'Pedido já foi recebido', code: 'BAD_REQUEST' } },
        { status: 400 }
      )
    }

    if (order.status === 'CANCELED') {
      return NextResponse.json(
        { success: false, error: { message: 'Pedido cancelado não pode ser recebido', code: 'BAD_REQUEST' } },
        { status: 400 }
      )
    }

    // Criar recebimento
    const receipt = await prisma.purchaseReceipt.create({
      data: {
        purchaseOrderId: order.id,
        receiptDate: new Date(data.receiptDate || new Date()),
        invoiceNumber: data.invoiceNumber || null,
        total: order.total,
        createdById: user.id,
      },
    })

    // Atualizar estoque para cada item
    for (const item of order.items) {
      // Criar movimentação de entrada
      await prisma.stockMovement.create({
        data: {
          productId: item.productId,
          type: 'IN',
          quantity: item.quantity,
          unitCost: item.unitPrice,
          referenceType: 'PURCHASE',
          referenceId: order.id,
          note: `Entrada - Pedido de compra #${order.id.slice(0, 8)}`,
          createdById: user.id,
        },
      })

      // Atualizar saldo de estoque
      const balance = await prisma.stockBalance.findUnique({
        where: { productId: item.productId },
      })

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

      // Atualizar custo do produto
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          costPrice: item.unitPrice,
        },
      })
    }

    // Atualizar status do pedido
    await prisma.purchaseOrder.update({
      where: { id: order.id },
      data: { status: 'RECEIVED' },
    })

    return NextResponse.json({
      success: true,
      data: {
        ...receipt,
        total: Number(receipt.total),
      },
      message: 'Pedido recebido e estoque atualizado com sucesso',
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { message: error.errors[0].message, code: 'VALIDATION_ERROR' } },
        { status: 400 }
      )
    }

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













