import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticate } from '@/middleware/auth'

export async function GET(request) {
  try {
    authenticate(request)

    const paymentMethods = await prisma.paymentMethod.findMany({
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({
      success: true,
      data: paymentMethods,
    })
  } catch (error) {
    console.error('Erro ao buscar formas de pagamento:', error)
    return NextResponse.json(
      { success: false, error: { message: error.message, code: 'ERROR' } },
      { status: error.statusCode || 500 }
    )
  }
}
