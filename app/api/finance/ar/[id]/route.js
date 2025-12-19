import { NextResponse } from 'next/server'
import { z } from 'zod'
import { Decimal } from '@prisma/client/runtime/library'
import { prisma } from '@/lib/prisma'
import { authenticate, authorize } from '@/middleware/auth'
import { NotFoundError, BadRequestError } from '@/utils/errors'

const updateAccountReceivableSchema = z.object({
  description: z.string().min(1, 'Descrição é obrigatória').optional(),
  dueDate: z.string().or(z.date()).optional(),
  amount: z.number().min(0.01, 'Valor deve ser maior que zero').optional(),
  categoryId: z.string().nullable().optional(),
  status: z.enum(['OPEN', 'RECEIVED', 'CANCELED']).optional(),
})

export async function GET(request, { params }) {
  try {
    authenticate(request)

    const account = await prisma.accountsReceivable.findUnique({
      where: { id: params.id },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        paymentMethod: {
          select: {
            id: true,
            name: true,
          },
        },
        salesOrder: {
          select: {
            id: true,
            total: true,
          },
        },
      },
    })

    if (!account) {
      return NextResponse.json(
        { success: false, error: { message: 'Conta a receber não encontrada', code: 'NOT_FOUND' } },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        ...account,
        amount: Number(account.amount),
        salesOrder: account.salesOrder ? {
          ...account.salesOrder,
          total: Number(account.salesOrder.total),
        } : null,
      },
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

export async function PUT(request, { params }) {
  try {
    const user = authenticate(request)
    authorize(user, 'ADMIN', 'VENDAS', 'FINANCEIRO')

    // Buscar a conta existente
    const existingAccount = await prisma.accountsReceivable.findUnique({
      where: { id: params.id },
      include: {
        salesOrder: true,
      },
    })

    if (!existingAccount) {
      return NextResponse.json(
        { success: false, error: { message: 'Conta a receber não encontrada', code: 'NOT_FOUND' } },
        { status: 404 }
      )
    }

    // Não permitir edição se a conta já foi recebida
    if (existingAccount.status === 'RECEIVED') {
      return NextResponse.json(
        { success: false, error: { message: 'Não é possível editar uma conta já recebida', code: 'BAD_REQUEST' } },
        { status: 400 }
      )
    }

    const body = await request.json()
    const data = updateAccountReceivableSchema.parse(body)

    // Preparar dados de atualização
    const updateData = {}
    if (data.description !== undefined) updateData.description = data.description
    if (data.dueDate) updateData.dueDate = new Date(data.dueDate)
    if (data.amount !== undefined) updateData.amount = new Decimal(data.amount)
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId
    if (data.status !== undefined) updateData.status = data.status

    // Se houver pedido relacionado, validar que o valor não excede o total do pedido
    if (existingAccount.salesOrderId && data.amount !== undefined) {
      const orderTotal = Number(existingAccount.salesOrder.total)
      const otherAccountsTotal = await prisma.accountsReceivable.aggregate({
        where: {
          salesOrderId: existingAccount.salesOrderId,
          id: { not: params.id },
          status: 'OPEN',
        },
        _sum: {
          amount: true,
        },
      })

      const otherTotal = Number(otherAccountsTotal._sum.amount || 0)
      const newTotal = otherTotal + data.amount

      if (newTotal > orderTotal + 0.01) {
        const available = orderTotal - otherTotal
        return NextResponse.json(
          { 
            success: false, 
            error: { 
              message: `O valor total das contas a receber (R$ ${newTotal.toFixed(2)}) excede o total do pedido (R$ ${orderTotal.toFixed(2)}). Já existem outras contas a receber no valor de R$ ${otherTotal.toFixed(2)}. Valor disponível: R$ ${available > 0 ? available.toFixed(2) : '0,00'}`, 
              code: 'BAD_REQUEST' 
            } 
          },
          { status: 400 }
        )
      }
    }

    // Atualizar conta
    const updatedAccount = await prisma.accountsReceivable.update({
      where: { id: params.id },
      data: updateData,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        paymentMethod: {
          select: {
            id: true,
            name: true,
          },
        },
        salesOrder: {
          select: {
            id: true,
            total: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        ...updatedAccount,
        amount: Number(updatedAccount.amount),
        salesOrder: updatedAccount.salesOrder ? {
          ...updatedAccount.salesOrder,
          total: Number(updatedAccount.salesOrder.total),
        } : null,
      },
      message: 'Conta a receber atualizada com sucesso',
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

export async function DELETE(request, { params }) {
  try {
    const user = authenticate(request)
    authorize(user, 'ADMIN', 'VENDAS', 'FINANCEIRO')

    // Buscar a conta existente
    const existingAccount = await prisma.accountsReceivable.findUnique({
      where: { id: params.id },
      include: {
        salesOrder: true,
      },
    })

    if (!existingAccount) {
      return NextResponse.json(
        { success: false, error: { message: 'Conta a receber não encontrada', code: 'NOT_FOUND' } },
        { status: 404 }
      )
    }

    // Não permitir exclusão se a conta já foi recebida
    if (existingAccount.status === 'RECEIVED') {
      return NextResponse.json(
        { success: false, error: { message: 'Não é possível excluir uma conta já recebida', code: 'BAD_REQUEST' } },
        { status: 400 }
      )
    }

    // Excluir conta
    await prisma.accountsReceivable.delete({
      where: { id: params.id },
    })

    return NextResponse.json({
      success: true,
      message: 'Conta a receber excluída com sucesso',
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






