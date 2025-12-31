import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticate, authorize } from '@/middleware/auth'
import { NotFoundError, BadRequestError } from '@/utils/errors'

import { z } from 'zod'
import { Decimal } from '@prisma/client/runtime/library'

const paymentSourceSchema = z.object({
  investorId: z.string().min(1, 'Investidor é obrigatório'),
  amount: z.number().min(0.01, 'Valor deve ser maior que zero'),
})

const payAccountSchema = z.object({
  paidAt: z.string().or(z.date()).optional(),
  paymentMethodId: z.string().optional(),
  paymentSources: z.array(paymentSourceSchema).optional(),
})

export async function POST(request, { params }) {
  try {
    const user = authenticate(request)
    authorize(user, 'ADMIN', 'FINANCEIRO')

    const body = await request.json()
    const data = payAccountSchema.parse(body)
    const { paidAt, paymentMethodId, paymentSources } = data

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

    // Validar fontes pagadoras se fornecidas
    if (paymentSources && paymentSources.length > 0) {
      const totalSources = paymentSources.reduce((sum, source) => sum + source.amount, 0)
      const accountAmount = Number(account.amount)

      if (Math.abs(totalSources - accountAmount) > 0.01) {
        return NextResponse.json(
          { 
            success: false, 
            error: { 
              message: `A soma das fontes pagadoras (R$ ${totalSources.toFixed(2)}) deve ser igual ao valor da conta (R$ ${accountAmount.toFixed(2)})`, 
              code: 'BAD_REQUEST' 
            } 
          },
          { status: 400 }
        )
      }

      // Validar se todos os investidores existem e estão ativos
      const investorIds = paymentSources.map(ps => ps.investorId)
      const investors = await prisma.investor.findMany({
        where: {
          id: { in: investorIds },
          isActive: true,
        },
      })

      if (investors.length !== investorIds.length) {
        return NextResponse.json(
          { 
            success: false, 
            error: { 
              message: 'Um ou mais investidores não foram encontrados ou estão inativos', 
              code: 'BAD_REQUEST' 
            } 
          },
          { status: 400 }
        )
      }
    }

    // Atualizar conta e criar fontes pagadoras
    const updatedAccount = await prisma.accountsPayable.update({
      where: { id: params.id },
      data: {
        status: 'PAID',
        paidAt: new Date(paidAt || new Date()),
        paymentMethodId: paymentMethodId || null,
        paymentSources: paymentSources && paymentSources.length > 0 ? {
          create: paymentSources.map(source => ({
            investorId: source.investorId,
            amount: new Decimal(source.amount),
          })),
        } : undefined,
      },
      include: {
        paymentSources: {
          include: {
            investor: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
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
        paymentSources: updatedAccount.paymentSources?.map(ps => ({
          ...ps,
          amount: Number(ps.amount),
          investor: ps.investor,
        })) || [],
      },
      message: 'Conta paga e registrada no fluxo de caixa',
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











