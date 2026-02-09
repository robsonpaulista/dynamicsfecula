import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticate, authorize } from '@/middleware/auth'

/**
 * Estorna a baixa de uma conta a pagar:
 * - Volta status para OPEN
 * - Remove paymentSources
 * - Remove cashTransactions vinculadas
 * - Limpa paidAt e paymentMethodId
 * - Reseta isDeliveryCost para false
 */
export async function POST(request, { params }) {
  try {
    const user = authenticate(request)
    authorize(user, 'ADMIN', 'FINANCEIRO')

    const result = await prisma.$transaction(async (tx) => {
      const account = await tx.accountsPayable.findUnique({
        where: { id: params.id },
        include: { paymentSources: true },
      })

      if (!account) {
        throw Object.assign(new Error('Conta a pagar não encontrada'), { statusCode: 404 })
      }

      if (account.status !== 'PAID') {
        throw Object.assign(new Error('Só é possível estornar contas já pagas'), { statusCode: 400 })
      }

      // Remover fontes pagadoras
      await tx.paymentSource.deleteMany({
        where: { accountsPayableId: account.id },
      })

      // Remover transações de caixa vinculadas
      await tx.cashTransaction.deleteMany({
        where: { originId: account.id, origin: 'AP' },
      })

      // Voltar conta para OPEN
      const updated = await tx.accountsPayable.update({
        where: { id: account.id },
        data: {
          status: 'OPEN',
          paidAt: null,
          paymentMethodId: null,
          isDeliveryCost: false,
        },
      })

      return updated
    })

    return NextResponse.json({
      success: true,
      data: { ...result, amount: Number(result.amount) },
      message: 'Baixa estornada. A conta voltou para status Aberta.',
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Erro ao estornar', code: 'ERROR' } },
      { status: error.statusCode || 500 }
    )
  }
}
