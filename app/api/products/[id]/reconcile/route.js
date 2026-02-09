import { NextResponse } from 'next/server'
import { Decimal } from '@prisma/client/runtime/library'
import { prisma } from '@/lib/prisma'
import { authenticate, authorize } from '@/middleware/auth'

/**
 * Recalcula o saldo do produto com base na soma de TODAS as movimentações
 * e atualiza a tabela stock_balances. Corrige divergências entre o saldo
 * armazenado e a soma real das operações.
 */
export async function POST(request, { params }) {
  try {
    const user = authenticate(request)
    authorize(user, 'ADMIN', 'ESTOQUE')

    const productId = params.id

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, unit: true },
    })

    if (!product) {
      return NextResponse.json(
        { success: false, error: { message: 'Produto não encontrado', code: 'NOT_FOUND' } },
        { status: 404 }
      )
    }

    const movements = await prisma.stockMovement.findMany({
      where: { productId },
      select: { type: true, quantity: true },
    })

    const soma = movements.reduce((acc, m) => {
      const q = Number(m.quantity)
      if (m.type === 'IN' || (m.type === 'ADJUST' && q > 0)) return acc + q
      if (m.type === 'OUT' || (m.type === 'ADJUST' && q < 0)) return acc - Math.abs(q)
      return acc
    }, 0)

    await prisma.stockBalance.upsert({
      where: { productId },
      create: {
        productId,
        quantity: new Decimal(Math.max(0, soma)),
      },
      update: {
        quantity: new Decimal(Math.max(0, soma)),
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        quantity: Math.max(0, soma),
        unit: product.unit,
      },
      message: 'Saldo recalculado com base em todas as movimentações.',
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Erro ao reconciliar saldo', code: 'ERROR' } },
      { status: error.statusCode || 500 }
    )
  }
}
