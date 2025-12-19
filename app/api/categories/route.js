import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticate } from '@/middleware/auth'

export async function GET(request) {
  try {
    authenticate(request)

    const { searchParams } = new URL(request.url)
    const kind = searchParams.get('kind') // 'INCOME' ou 'EXPENSE'

    const where = {}
    if (kind) {
      where.kind = kind
    }

    const categories = await prisma.category.findMany({
      where,
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({
      success: true,
      data: categories,
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { message: error.message, code: 'ERROR' } },
      { status: error.statusCode || 500 }
    )
  }
}
