import { NextResponse } from 'next/server'
import { z } from 'zod'
import { Decimal } from '@prisma/client/runtime/library'
import { prisma } from '@/lib/prisma'
import { authenticate, authorize } from '@/middleware/auth'
import { NotFoundError, BadRequestError } from '@/utils/errors'
import { serializeProducts } from '@/lib/serialize'

const productSchema = z.object({
  sku: z.string().min(1, 'SKU é obrigatório'),
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  type: z.enum(['MP', 'PA', 'SERVICO']),
  unit: z.string().min(1, 'Unidade é obrigatória'),
  minStock: z.number().min(0).optional(),
  costPrice: z.number().min(0).optional(),
  salePrice: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
})

export async function GET(request) {
  try {
    // Autenticação obrigatória para listar produtos
    authenticate(request)

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search')
    const type = searchParams.get('type')
    const isActive = searchParams.get('isActive')
    const skip = (page - 1) * limit

    const where = {}
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (type) where.type = type
    if (isActive !== null) where.isActive = isActive === 'true'

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        include: {
          stockBalance: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: serializeProducts(products),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { message: error.message, code: 'ERROR' } },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    const user = authenticate(request)
    authorize(user, 'ADMIN', 'ESTOQUE', 'COMPRAS')

    const body = await request.json()
    const data = productSchema.parse(body)

    const existingProduct = await prisma.product.findUnique({
      where: { sku: data.sku },
    })

    if (existingProduct) {
      return NextResponse.json(
        { success: false, error: { message: 'SKU já cadastrado', code: 'BAD_REQUEST' } },
        { status: 400 }
      )
    }

    const product = await prisma.product.create({
      data: {
        sku: data.sku,
        name: data.name,
        type: data.type,
        unit: data.unit,
        minStock: data.minStock ? new Decimal(data.minStock) : null,
        costPrice: data.costPrice ? new Decimal(data.costPrice) : null,
        salePrice: data.salePrice ? new Decimal(data.salePrice) : null,
        isActive: data.isActive ?? true,
      },
    })

    // Criar saldo inicial zerado
    await prisma.stockBalance.create({
      data: {
        productId: product.id,
        quantity: new Decimal(0),
      },
    })

    return NextResponse.json({ success: true, data: product }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { message: error.errors[0].message, code: 'VALIDATION_ERROR' } },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: { message: error.message, code: error.code || 'ERROR' } },
      { status: error.statusCode || 500 }
    )
  }
}

