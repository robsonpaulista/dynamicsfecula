import { NextResponse } from 'next/server'
import { authenticate } from '@/middleware/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request) {
  try {
    const user = authenticate(request)

    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    })

    if (!userData) {
      return NextResponse.json(
        { success: false, error: { message: 'Usuário não encontrado', code: 'NOT_FOUND' } },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: userData,
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { message: error.message, code: error.code || 'ERROR' } },
      { status: error.statusCode || 500 }
    )
  }
}













