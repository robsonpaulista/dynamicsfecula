import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { authenticate, authorize } from '@/middleware/auth'
import { NotFoundError } from '@/utils/errors'

const supplierSchema = z.object({
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

    const supplier = await prisma.supplier.findUnique({
      where: { id: params.id },
    })

    if (!supplier) {
      return NextResponse.json(
        { success: false, error: { message: 'Fornecedor não encontrado', code: 'NOT_FOUND' } },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: supplier,
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
    authorize(user, 'ADMIN', 'COMPRAS')

    const body = await request.json()
    const data = supplierSchema.parse(body)

    const supplier = await prisma.supplier.update({
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
      data: supplier,
      message: 'Fornecedor atualizado com sucesso',
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
        { success: false, error: { message: 'Fornecedor não encontrado', code: 'NOT_FOUND' } },
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
    authorize(user, 'ADMIN', 'COMPRAS')

    await prisma.supplier.update({
      where: { id: params.id },
      data: { isActive: false },
    })

    return NextResponse.json({
      success: true,
      message: 'Fornecedor desativado com sucesso',
    })
  } catch (error) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { success: false, error: { message: 'Fornecedor não encontrado', code: 'NOT_FOUND' } },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { success: false, error: { message: error.message, code: 'ERROR' } },
      { status: error.statusCode || 500 }
    )
  }
}








