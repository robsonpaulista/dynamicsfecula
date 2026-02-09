import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticate, authorize } from '@/middleware/auth'

/**
 * Estorna a baixa de uma conta a receber:
 * - Volta status para OPEN
 * - Remove cashTransactions vinculadas
 * - Limpa receivedAt e paymentMethodId
 * - Restaura valor original se houve baixas parciais (soma transações IN)
 */
export async function POST(request, { params }) {
  try {
    const user = authenticate(request)
    authorize(user, 'ADMIN', 'FINANCEIRO')

    const result = await prisma.$transaction(async (tx) => {
      const account = await tx.accountsReceivable.findUnique({
        where: { id: params.id },
      })

      if (!account) {
        throw Object.assign(new Error('Conta a receber não encontrada'), { statusCode: 404 })
      }

      if (account.status !== 'RECEIVED') {
        throw Object.assign(new Error('Só é possível estornar contas já recebidas'), { statusCode: 400 })
      }

      // Buscar todas as transações IN vinculadas a essa conta
      const cashTransactions = await tx.cashTransaction.findMany({
        where: { originId: account.id, origin: 'AR' },
      })

      // Calcular valor original somando as transações ao valor atual da conta
      // (caso tenha havido baixas parciais que reduziram o amount)
      const totalTransactions = cashTransactions.reduce(
        (sum, ct) => sum + Number(ct.amount),
        0
      )
      const originalAmount = Number(account.amount) + totalTransactions

      // Remover transações de caixa vinculadas
      await tx.cashTransaction.deleteMany({
        where: { originId: account.id, origin: 'AR' },
      })

      // Voltar conta para OPEN com valor original restaurado
      const updated = await tx.accountsReceivable.update({
        where: { id: account.id },
        data: {
          status: 'OPEN',
          receivedAt: null,
          paymentMethodId: null,
          amount: originalAmount,
        },
      })

      return { updated, restoredAmount: originalAmount, transactionsRemoved: cashTransactions.length }
    })

    return NextResponse.json({
      success: true,
      data: {
        ...result.updated,
        amount: Number(result.updated.amount),
        restoredAmount: result.restoredAmount,
        transactionsRemoved: result.transactionsRemoved,
      },
      message: `Baixa estornada. Valor restaurado para R$ ${result.restoredAmount.toFixed(2)}. A conta voltou para status Aberta.`,
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Erro ao estornar', code: 'ERROR' } },
      { status: error.statusCode || 500 }
    )
  }
}
