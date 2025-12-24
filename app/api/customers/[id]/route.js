import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { authenticate, authorize } from '@/middleware/auth'
import { NotFoundError } from '@/utils/errors'

const customerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  document: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  addressJson: z.any().optional(),
  isActive: z.boolean().optional(),
})

export async function GET(request, { params }) {
  try {
    authenticate(request)

    const customer = await prisma.customer.findUnique({
      where: { id: params.id },
    })

    if (!customer) {
      return NextResponse.json(
        { success: false, error: { message: 'Cliente não encontrado', code: 'NOT_FOUND' } },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: customer,
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
    authorize(user, 'ADMIN', 'VENDAS')

    const body = await request.json()
    const data = customerSchema.parse(body)

    const customer = await prisma.customer.update({
      where: { id: params.id },
      data: {
        name: data.name,
        document: data.document,
        phone: data.phone,
        email: data.email || null,
        addressJson: data.addressJson,
        isActive: data.isActive,
      },
    })

    return NextResponse.json({
      success: true,
      data: customer,
      message: 'Cliente atualizado com sucesso',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { message: error.errors[0].message, code: 'VALIDATION_ERROR' } },
        { status: 400 }
      )
    }

    if (error.code === 'P2025') {
      return NextResponse.json(
        { success: false, error: { message: 'Cliente não encontrado', code: 'NOT_FOUND' } },
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
    authorize(user, 'ADMIN', 'VENDAS')

    await prisma.customer.update({
      where: { id: params.id },
      data: { isActive: false },
    })

    return NextResponse.json({
      success: true,
      message: 'Cliente desativado com sucesso',
    })
  } catch (error) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { success: false, error: { message: 'Cliente não encontrado', code: 'NOT_FOUND' } },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { success: false, error: { message: error.message, code: 'ERROR' } },
      { status: error.statusCode || 500 }
    )
  }
}








