import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticate, authorize } from '@/middleware/auth'
import { NotFoundError, BadRequestError } from '@/utils/errors'

export async function POST(request, { params }) {
  try {
    const user = authenticate(request)
    authorize(user, 'ADMIN', 'FINANCEIRO')

    const body = await request.json()
    const { paidAt, paymentMethodId } = body

    const account = await prisma.accountsPayable.findUnique({
      where: { id: params.id },
    })

    if (!account) {
      return NextResponse.json(
        { success: false, error: { message: 'Conta a pagar não encontrada', code: 'NOT_FOUND' } },
        { status: 404 }
      )
    }

    if (account.status === 'PAID') {
      return NextResponse.json(
        { success: false, error: { message: 'Conta já foi paga', code: 'BAD_REQUEST' } },
        { status: 400 }
      )
    }

    // Atualizar conta
    const updatedAccount = await prisma.accountsPayable.update({
      where: { id: params.id },
      data: {
        status: 'PAID',
        paidAt: new Date(paidAt || new Date()),
        paymentMethodId: paymentMethodId || null,
      },
    })

    // Criar transação de caixa
    await prisma.cashTransaction.create({
      data: {
        type: 'OUT',
        origin: 'AP',
        originId: account.id,
        date: new Date(paidAt || new Date()),
        amount: account.amount,
        description: account.description,
        categoryId: account.categoryId,
        createdById: user.id,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        ...updatedAccount,
        amount: Number(updatedAccount.amount),
      },
      message: 'Conta paga e registrada no fluxo de caixa',
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





