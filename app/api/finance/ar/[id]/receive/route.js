import { NextResponse } from 'next/server'
import { Decimal } from '@prisma/client/runtime/library'
import { prisma } from '@/lib/prisma'
import { authenticate, authorize } from '@/middleware/auth'
import { NotFoundError, BadRequestError } from '@/utils/errors'
import { z } from 'zod'

const receiveSchema = z.object({
  receivedAt: z.string().optional(),
  paymentMethodId: z.string().optional().nullable(),
  receivedAmount: z.number().positive().optional(),
})

export async function POST(request, { params }) {
  try {
    const user = authenticate(request)
    authorize(user, 'ADMIN', 'FINANCEIRO')

    const body = await request.json()
    const validatedData = receiveSchema.parse(body)
    const { receivedAt, paymentMethodId, receivedAmount } = validatedData

    const account = await prisma.accountsReceivable.findUnique({
      where: { id: params.id },
    })

    if (!account) {
      return NextResponse.json(
        { success: false, error: { message: 'Conta a receber não encontrada', code: 'NOT_FOUND' } },
        { status: 404 }
      )
    }

    if (account.status === 'RECEIVED') {
      return NextResponse.json(
        { success: false, error: { message: 'Conta já foi totalmente recebida', code: 'BAD_REQUEST' } },
        { status: 400 }
      )
    }

    const accountAmount = account.amount
    const receivedValue = receivedAmount 
      ? new Decimal(receivedAmount) 
      : accountAmount
    const remainingAmount = accountAmount.minus(receivedValue)

    // Validar valor recebido
    if (receivedValue.lessThanOrEqualTo(0)) {
      return NextResponse.json(
        { success: false, error: { message: 'Valor recebido deve ser maior que zero', code: 'BAD_REQUEST' } },
        { status: 400 }
      )
    }

    if (receivedValue.greaterThan(accountAmount)) {
      return NextResponse.json(
        { success: false, error: { message: 'Valor recebido não pode ser maior que o valor da conta', code: 'BAD_REQUEST' } },
        { status: 400 }
      )
    }

    // Se o valor recebido for menor que o total (tolerância de 0.01 para arredondamentos)
    const isPartialPayment = remainingAmount.greaterThan(new Decimal(0.01))

    // Atualizar conta
    const updateData = {
      paymentMethodId: paymentMethodId || null,
    }

    if (isPartialPayment) {
      // Baixa parcial: reduzir o amount e manter status OPEN
      updateData.amount = remainingAmount
      // Não atualiza receivedAt nem status
    } else {
      // Baixa total: marcar como recebida
      updateData.status = 'RECEIVED'
      updateData.receivedAt = new Date(receivedAt || new Date())
    }

    const updatedAccount = await prisma.accountsReceivable.update({
      where: { id: params.id },
      data: updateData,
    })

    // Criar transação de caixa com o valor recebido
    await prisma.cashTransaction.create({
      data: {
        type: 'IN',
        origin: 'AR',
        originId: account.id,
        date: new Date(receivedAt || new Date()),
        amount: receivedValue,
        description: isPartialPayment 
          ? `${account.description} (Baixa parcial: ${receivedValue.toFixed(2)} de ${accountAmount.toFixed(2)})`
          : account.description,
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
      message: isPartialPayment 
        ? `Baixa parcial de ${receivedValue.toFixed(2)} realizada. Saldo pendente: ${remainingAmount.toFixed(2)}`
        : 'Conta totalmente recebida e registrada no fluxo de caixa',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { message: error.errors[0]?.message || 'Dados inválidos', code: 'VALIDATION_ERROR' } },
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














