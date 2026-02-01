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

    const arId = params.id

    const updatedAccount = await prisma.$transaction(async (tx) => {
      // Lock da linha para evitar baixa duplicada (race condition: dois cliques ou duas requisições simultâneas)
      const locked = await tx.$queryRaw`
        SELECT id FROM accounts_receivable WHERE id = ${arId} FOR UPDATE
      `
      if (!locked || locked.length === 0) {
        throw new NotFoundError('Conta a receber não encontrada')
      }

      const account = await tx.accountsReceivable.findUnique({
        where: { id: arId },
      })

      if (!account) {
        throw new NotFoundError('Conta a receber não encontrada')
      }

      if (account.status === 'RECEIVED') {
        throw new BadRequestError('Conta já foi totalmente recebida')
      }

      const accountAmount = account.amount
      const receivedValue = receivedAmount 
        ? new Decimal(receivedAmount) 
        : accountAmount
      const remainingAmount = accountAmount.minus(receivedValue)

      if (receivedValue.lessThanOrEqualTo(0)) {
        throw new BadRequestError('Valor recebido deve ser maior que zero')
      }

      if (receivedValue.greaterThan(accountAmount)) {
        throw new BadRequestError('Valor recebido não pode ser maior que o valor da conta')
      }

      const isPartialPayment = remainingAmount.greaterThan(new Decimal(0.01))

      const updateData = {
        paymentMethodId: paymentMethodId || null,
      }
      if (isPartialPayment) {
        updateData.amount = remainingAmount
      } else {
        updateData.status = 'RECEIVED'
        updateData.receivedAt = new Date(receivedAt || new Date())
      }

      const updated = await tx.accountsReceivable.update({
        where: { id: arId },
        data: updateData,
      })

      await tx.cashTransaction.create({
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

      return { updated, isPartialPayment, receivedValue, remainingAmount, account }
    })

    const { updated, isPartialPayment, receivedValue, remainingAmount } = updatedAccount

    return NextResponse.json({
      success: true,
      data: {
        ...updated,
        amount: Number(updated.amount),
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















