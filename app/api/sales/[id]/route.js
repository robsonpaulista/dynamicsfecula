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
        returns: {
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
      returns: salesOrder.returns.map(ret => ({
        ...ret,
        total: Number(ret.total),
        items: ret.items.map(item => ({
          ...item,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          total: Number(item.total),
        })),
        customerCredit: ret.customerCredit ? {
          ...ret.customerCredit,
          amount: Number(ret.customerCredit.amount),
          usedAmount: Number(ret.customerCredit.usedAmount),
        } : null,
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

/** Cancelar pedido de venda (apenas se a entrega ainda não foi realizada). */
export async function PATCH(request, { params }) {
  try {
    const user = authenticate(request)
    authorize(user, 'ADMIN', 'VENDAS', 'ESTOQUE', 'FINANCEIRO')

    const body = await request.json().catch(() => ({}))
    if (body.status !== 'CANCELED') {
      return NextResponse.json(
        { success: false, error: { message: 'Use status: "CANCELED" para cancelar o pedido', code: 'VALIDATION' } },
        { status: 400 }
      )
    }

    const existing = await prisma.salesOrder.findUnique({
      where: { id: params.id },
      select: { id: true, status: true },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: { message: 'Pedido de venda não encontrado', code: 'NOT_FOUND' } },
        { status: 404 }
      )
    }

    if (existing.status === 'DELIVERED') {
      return NextResponse.json(
        { success: false, error: { message: 'Não é possível cancelar pedido já entregue', code: 'VALIDATION' } },
        { status: 400 }
      )
    }

    if (existing.status === 'CANCELED') {
      return NextResponse.json(
        { success: false, error: { message: 'Pedido já está cancelado', code: 'VALIDATION' } },
        { status: 400 }
      )
    }

    const updated = await prisma.salesOrder.update({
      where: { id: params.id },
      data: { status: 'CANCELED' },
      include: {
        customer: { select: { id: true, name: true } },
        items: { include: { product: { select: { id: true, sku: true, name: true, unit: true } } } },
      },
    })

    const serialized = {
      ...updated,
      total: Number(updated.total),
      items: updated.items.map((item) => ({
        ...item,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        total: Number(item.total),
      })),
    }

    return NextResponse.json({
      success: true,
      data: serialized,
      message: 'Pedido cancelado com sucesso',
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













