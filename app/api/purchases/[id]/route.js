import { NextResponse } from 'next/server'
import { z } from 'zod'
import { Decimal } from '@prisma/client/runtime/library'
import { prisma } from '@/lib/prisma'
import { authenticate, authorize } from '@/middleware/auth'
import { NotFoundError, BadRequestError } from '@/utils/errors'

export async function GET(request, { params }) {
  try {
    const user = authenticate(request)
    authorize(user, 'ADMIN', 'COMPRAS', 'ESTOQUE', 'FINANCEIRO')

    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id: params.id },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            document: true,
            phone: true,
            email: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                sku: true,
                name: true,
                unit: true,
              },
            },
          },
        },
        receipts: {
          include: {
            createdBy: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        accountsPayable: {
          include: {
            paymentMethod: { select: { id: true, name: true } },
          },
          orderBy: { dueDate: 'asc' },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    if (!purchaseOrder) {
      return NextResponse.json(
        { success: false, error: { message: 'Pedido de compra não encontrado', code: 'NOT_FOUND' } },
        { status: 404 }
      )
    }

    // Serializar valores Decimal
    const serializedOrder = {
      ...purchaseOrder,
      total: Number(purchaseOrder.total),
      items: purchaseOrder.items.map(item => ({
        ...item,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        total: Number(item.total),
      })),
      receipts: purchaseOrder.receipts.map(receipt => ({
        ...receipt,
        total: Number(receipt.total),
      })),
      accountsPayable: purchaseOrder.accountsPayable.map(ap => ({
        ...ap,
        amount: Number(ap.amount),
        paymentMethod: ap.paymentMethod ? { id: ap.paymentMethod.id, name: ap.paymentMethod.name } : null,
      })),
    }

    return NextResponse.json({
      success: true,
      data: serializedOrder,
    })
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { success: false, error: { message: error.message, code: 'NOT_FOUND' } },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { success: false, error: { message: error.message, code: 'ERROR' } },
      { status: error.statusCode || 500 }
    )
  }
}

const updatePurchaseSchema = z.object({
  supplierId: z.string().min(1, 'Fornecedor é obrigatório').optional(),
  issueDate: z.string().or(z.date()).optional(),
  items: z.array(z.object({
    productId: z.string().min(1, 'Produto é obrigatório'),
    quantity: z.number().min(0.01, 'Quantidade deve ser maior que zero'),
    unitPrice: z.number().min(0, 'Preço deve ser maior ou igual a zero'),
  })).min(1, 'Pelo menos um item é obrigatório').optional(),
  notes: z.string().optional(),
})

export async function PUT(request, { params }) {
  try {
    const user = authenticate(request)
    authorize(user, 'ADMIN', 'COMPRAS')

    // Buscar o pedido existente
    const existingOrder = await prisma.purchaseOrder.findUnique({
      where: { id: params.id },
      include: {
        items: true,
        receipts: true,
        accountsPayable: true,
      },
    })

    if (!existingOrder) {
      return NextResponse.json(
        { success: false, error: { message: 'Pedido de compra não encontrado', code: 'NOT_FOUND' } },
        { status: 404 }
      )
    }

    // Não permitir edição se o pedido já foi recebido ou cancelado
    if (existingOrder.status === 'RECEIVED') {
      return NextResponse.json(
        { success: false, error: { message: 'Não é possível editar um pedido já recebido', code: 'BAD_REQUEST' } },
        { status: 400 }
      )
    }

    if (existingOrder.status === 'CANCELED') {
      return NextResponse.json(
        { success: false, error: { message: 'Não é possível editar um pedido cancelado', code: 'BAD_REQUEST' } },
        { status: 400 }
      )
    }

    const body = await request.json()
    const data = updatePurchaseSchema.parse(body)

    // Preparar dados de atualização
    const updateData = {}
    if (data.supplierId) updateData.supplierId = data.supplierId
    if (data.issueDate) updateData.issueDate = new Date(data.issueDate)
    if (data.notes !== undefined) updateData.notes = data.notes

    // Se houver itens, recalcular total e atualizar itens
    if (data.items && data.items.length > 0) {
      let total = new Decimal(0)
      const purchaseItems = []

      for (const item of data.items) {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
        })

        if (!product) {
          return NextResponse.json(
            { success: false, error: { message: `Produto ${item.productId} não encontrado`, code: 'NOT_FOUND' } },
            { status: 404 }
          )
        }

        const itemTotal = new Decimal(item.quantity).times(item.unitPrice)
        total = total.plus(itemTotal)

        purchaseItems.push({
          productId: item.productId,
          quantity: new Decimal(item.quantity),
          unitPrice: new Decimal(item.unitPrice),
          total: itemTotal,
        })
      }

      updateData.total = total

      // Deletar itens antigos e criar novos
      await prisma.purchaseItem.deleteMany({
        where: { purchaseOrderId: params.id },
      })

      await prisma.purchaseItem.createMany({
        data: purchaseItems.map(item => ({
          purchaseOrderId: params.id,
          ...item,
        })),
      })
    }

    // Atualizar pedido
    const updatedOrder = await prisma.purchaseOrder.update({
      where: { id: params.id },
      data: updateData,
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            document: true,
            phone: true,
            email: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                sku: true,
                name: true,
                unit: true,
              },
            },
          },
        },
        receipts: {
          include: {
            createdBy: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        accountsPayable: {
          orderBy: { dueDate: 'asc' },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Serializar valores Decimal
    const serializedOrder = {
      ...updatedOrder,
      total: Number(updatedOrder.total),
      items: updatedOrder.items.map(item => ({
        ...item,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        total: Number(item.total),
      })),
      receipts: updatedOrder.receipts.map(receipt => ({
        ...receipt,
        total: Number(receipt.total),
      })),
      accountsPayable: updatedOrder.accountsPayable.map(ap => ({
        ...ap,
        amount: Number(ap.amount),
      })),
    }

    return NextResponse.json({
      success: true,
      data: serializedOrder,
      message: 'Pedido atualizado com sucesso',
    })
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

















