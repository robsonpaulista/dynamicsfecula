import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { authenticate, authorize } from '@/middleware/auth'

const bodySchema = z.object({
  ids: z.array(z.string().uuid()).min(1, 'Selecione pelo menos uma despesa'),
  isDeliveryCost: z.boolean(),
})

export async function POST(request) {
  try {
    const user = authenticate(request)
    authorize(user, 'ADMIN', 'FINANCEIRO', 'COMPRAS')

    const body = await request.json()
    const { ids, isDeliveryCost } = bodySchema.parse(body)

    // Buscar despesas e validar status
    const accounts = await prisma.accountsPayable.findMany({
      where: { id: { in: ids } },
      select: { id: true, status: true },
    })

    if (accounts.length !== ids.length) {
      return NextResponse.json(
        { success: false, error: { message: 'Uma ou mais despesas não foram encontradas', code: 'NOT_FOUND' } },
        { status: 404 }
      )
    }

    const invalid = accounts.filter((ap) => ap.status !== 'PAID')
    if (invalid.length) {
      return NextResponse.json(
        {
          success: false,
          error: { message: 'Só é possível incluir no rateio despesas já pagas', code: 'BAD_REQUEST' },
        },
        { status: 400 }
      )
    }

    await prisma.accountsPayable.updateMany({
      where: { id: { in: ids } },
      data: { isDeliveryCost },
    })

    return NextResponse.json({
      success: true,
      data: { updatedCount: ids.length, isDeliveryCost },
      message: isDeliveryCost
        ? 'Despesas incluídas no rateio de entregas.'
        : 'Despesas removidas do rateio de entregas.',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { message: error.errors[0]?.message || 'Dados inválidos', code: 'VALIDATION_ERROR' } },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: { message: error.message || 'Erro ao atualizar o rateio', code: 'ERROR' } },
      { status: error.statusCode || 500 }
    )
  }
}
