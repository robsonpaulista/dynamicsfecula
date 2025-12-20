import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticate, authorize } from '@/middleware/auth'
import { NotFoundError } from '@/utils/errors'

export async function GET(request, { params }) {
  try {
    const user = authenticate(request)
    authorize(user, 'ADMIN', 'VENDAS', 'ESTOQUE', 'FINANCEIRO')

    const salesOrder = await prisma.salesOrder.findUnique({
      where: { id: params.id },
      include: {
        customer: {
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
        accountsReceivable: {
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

    if (!salesOrder) {
      return NextResponse.json(
        { success: false, error: { message: 'Pedido de venda não encontrado', code: 'NOT_FOUND' } },
        { status: 404 }
      )
    }

    // Serializar valores Decimal
    const serializedOrder = {
      ...salesOrder,
      total: Number(salesOrder.total),
      items: salesOrder.items.map(item => ({
        ...item,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        total: Number(item.total),
      })),
      accountsReceivable: salesOrder.accountsReceivable.map(ar => ({
        ...ar,
        amount: Number(ar.amount),
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






