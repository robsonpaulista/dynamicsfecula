import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { authenticate, authorize } from '@/middleware/auth'
import { NotFoundError } from '@/utils/errors'

const updateInvestorSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').optional(),
  document: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  isActive: z.boolean().optional(),
})

export async function GET(request, { params }) {
  try {
    authenticate(request)

    const investor = await prisma.investor.findUnique({
      where: { id: params.id },
    })

    if (!investor) {
      return NextResponse.json(
        { success: false, error: { message: 'Investidor não encontrado', code: 'NOT_FOUND' } },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: investor,
    })
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { success: false, error: { message: error.message, code: 'NOT_FOUND' } },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { success: false, error: { message: error.message, code: 'ERROR' } },
      { status: error.statusCode || 500 }
    )
  }
}

export async function PUT(request, { params }) {
  try {
    const user = authenticate(request)
    authorize(user, 'ADMIN', 'FINANCEIRO')

    const body = await request.json()
    const data = updateInvestorSchema.parse(body)

    const investor = await prisma.investor.findUnique({
      where: { id: params.id },
    })

    if (!investor) {
      return NextResponse.json(
        { success: false, error: { message: 'Investidor não encontrado', code: 'NOT_FOUND' } },
        { status: 404 }
      )
    }

    const updatedInvestor = await prisma.investor.update({
      where: { id: params.id },
      data: {
        name: data.name,
        document: data.document !== undefined ? (data.document || null) : undefined,
        phone: data.phone !== undefined ? (data.phone || null) : undefined,
        email: data.email !== undefined ? (data.email || null) : undefined,
        isActive: data.isActive,
      },
    })

    return NextResponse.json({
      success: true,
      data: updatedInvestor,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { message: error.errors[0].message, code: 'VALIDATION_ERROR' } },
        { status: 400 }
      )
    }

    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { success: false, error: { message: error.message, code: 'NOT_FOUND' } },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { success: false, error: { message: error.message, code: 'ERROR' } },
      { status: error.statusCode || 500 }
    )
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = authenticate(request)
    authorize(user, 'ADMIN', 'FINANCEIRO')

    const investor = await prisma.investor.findUnique({
      where: { id: params.id },
    })

    if (!investor) {
      return NextResponse.json(
        { success: false, error: { message: 'Investidor não encontrado', code: 'NOT_FOUND' } },
        { status: 404 }
      )
    }

    // Verificar se há paymentSources usando este investidor
    const paymentSourcesCount = await prisma.paymentSource.count({
      where: { investorId: params.id },
    })

    if (paymentSourcesCount > 0) {
      // Desativar em vez de deletar
      await prisma.investor.update({
        where: { id: params.id },
        data: { isActive: false },
      })

      return NextResponse.json({
        success: true,
        message: 'Investidor desativado (possui pagamentos registrados)',
      })
    }

    await prisma.investor.delete({
      where: { id: params.id },
    })

    return NextResponse.json({
      success: true,
      message: 'Investidor removido com sucesso',
    })
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { success: false, error: { message: error.message, code: 'NOT_FOUND' } },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { success: false, error: { message: error.message, code: 'ERROR' } },
      { status: error.statusCode || 500 }
    )
  }
}
