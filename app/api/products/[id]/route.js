import { NextResponse } from 'next/server'
import { Decimal } from '@prisma/client/runtime/library'
import { prisma } from '@/lib/prisma'
import { authenticate, authorize } from '@/middleware/auth'
import { NotFoundError, BadRequestError } from '@/utils/errors'
import { z } from 'zod'

const updateProductSchema = z.object({
  sku: z.string().min(1, 'SKU é obrigatório').optional(),
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres').optional(),
  type: z.enum(['MP', 'PA', 'SERVICO']).optional(),
  unit: z.string().min(1, 'Unidade é obrigatória').optional(),
  minStock: z.number().min(0).optional().nullable(),
  costPrice: z.number().min(0).optional().nullable(),
  salePrice: z.number().min(0).optional().nullable(),
  isActive: z.boolean().optional(),
})

export async function GET(request, { params }) {
  try {
    const user = authenticate(request)
    authorize(user, 'ADMIN', 'ESTOQUE', 'COMPRAS', 'VENDAS')

    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    const movementsWhere = {}
    if (from || to) {
      movementsWhere.createdAt = {}
      if (from) movementsWhere.createdAt.gte = new Date(from)
      if (to) {
        const toDate = new Date(to)
        toDate.setHours(23, 59, 59, 999)
        movementsWhere.createdAt.lte = toDate
      }
    }

    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        stockBalance: true,
        stockMovements: {
          where: Object.keys(movementsWhere).length ? movementsWhere : undefined,
          take: 500,
          orderBy: { createdAt: 'asc' },
          include: {
            createdBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    })

    if (!product) {
      return NextResponse.json(
        { success: false, error: { message: 'Produto não encontrado', code: 'NOT_FOUND' } },
        { status: 404 }
      )
    }

    // Buscar informações de cliente/fornecedor para cada movimentação
    const movementsWithReferences = await Promise.all(
      product.stockMovements.map(async (movement) => {
        let reference = null
        
        if (movement.referenceType === 'PURCHASE' && movement.referenceId) {
          const purchaseOrder = await prisma.purchaseOrder.findUnique({
            where: { id: movement.referenceId },
            include: {
              supplier: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          })
          if (purchaseOrder) {
            reference = {
              type: 'PURCHASE',
              supplier: purchaseOrder.supplier,
            }
          }
        } else if (movement.referenceType === 'SALE' && movement.referenceId) {
          const salesOrder = await prisma.salesOrder.findUnique({
            where: { id: movement.referenceId },
            include: {
              customer: {
                select: {
                  id: true,
                  name: true,
                },
              },
              items: {
                where: { productId: movement.productId },
                select: { unitPrice: true },
              },
            },
          })
          if (salesOrder) {
            const saleItem = salesOrder.items?.[0]
            reference = {
              type: 'SALE',
              customer: salesOrder.customer,
              unitPrice: saleItem ? Number(saleItem.unitPrice) : null,
              salesOrderStatus: salesOrder.status,
              isCanceled: salesOrder.status === 'CANCELED',
            }
          }
        } else if (movement.referenceType === 'RETURN' && movement.referenceId) {
          const returnItem = await prisma.salesReturnItem.findFirst({
            where: {
              salesReturnId: movement.referenceId,
              productId: movement.productId,
            },
          })
          if (returnItem) {
            reference = { type: 'RETURN', unitPrice: Number(returnItem.unitPrice) }
          }
        }
        
        let displayUnitPrice = movement.unitCost ? Number(movement.unitCost) : null
        if (reference?.type === 'SALE' && reference.unitPrice != null) {
          displayUnitPrice = reference.unitPrice
        } else if (reference?.type === 'RETURN' && reference.unitPrice != null) {
          displayUnitPrice = reference.unitPrice
        } else if ((movement.referenceType === 'MANUAL' || movement.referenceType === 'INVENTORY') && !displayUnitPrice && product.costPrice) {
          displayUnitPrice = Number(product.costPrice)
        }
        
        return {
          ...movement,
          reference,
          displayUnitPrice,
        }
      })
    )

    // Mostrar todas as movimentações (incluindo vendas canceladas e seus estornos) para o extrato bater com o saldo
    const serializedProduct = {
      ...product,
      minStock: product.minStock ? Number(product.minStock) : null,
      costPrice: product.costPrice ? Number(product.costPrice) : null,
      salePrice: product.salePrice ? Number(product.salePrice) : null,
      stockBalance: product.stockBalance ? {
        ...product.stockBalance,
        quantity: Number(product.stockBalance.quantity),
      } : null,
      stockMovements: movementsWithReferences.map(movement => ({
        ...movement,
        quantity: Number(movement.quantity),
        unitCost: movement.unitCost ? Number(movement.unitCost) : null,
        displayUnitPrice: movement.displayUnitPrice ?? (movement.unitCost ? Number(movement.unitCost) : null),
      })),
    }

    return NextResponse.json({
      success: true,
      data: serializedProduct,
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
    authorize(user, 'ADMIN', 'ESTOQUE', 'COMPRAS')

    const body = await request.json()
    const data = updateProductSchema.parse(body)

    // Verificar se o produto existe
    const existingProduct = await prisma.product.findUnique({
      where: { id: params.id },
    })

    if (!existingProduct) {
      return NextResponse.json(
        { success: false, error: { message: 'Produto não encontrado', code: 'NOT_FOUND' } },
        { status: 404 }
      )
    }

    // Se o SKU está sendo alterado, verificar se já existe
    if (data.sku && data.sku !== existingProduct.sku) {
      const skuExists = await prisma.product.findUnique({
        where: { sku: data.sku },
      })

      if (skuExists) {
        return NextResponse.json(
          { success: false, error: { message: 'SKU já cadastrado', code: 'BAD_REQUEST' } },
          { status: 400 }
        )
      }
    }

    // Preparar dados de atualização
    const updateData = {}
    if (data.sku !== undefined) updateData.sku = data.sku
    if (data.name !== undefined) updateData.name = data.name
    if (data.type !== undefined) updateData.type = data.type
    if (data.unit !== undefined) updateData.unit = data.unit
    if (data.isActive !== undefined) updateData.isActive = data.isActive

    // Campos Decimal
    if (data.minStock !== undefined) {
      updateData.minStock = data.minStock !== null ? new Decimal(data.minStock) : null
    }
    if (data.costPrice !== undefined) {
      updateData.costPrice = data.costPrice !== null ? new Decimal(data.costPrice) : null
    }
    if (data.salePrice !== undefined) {
      updateData.salePrice = data.salePrice !== null ? new Decimal(data.salePrice) : null
    }

    // Atualizar produto
    const updatedProduct = await prisma.product.update({
      where: { id: params.id },
      data: updateData,
      include: {
        stockBalance: true,
      },
    })

    // Serializar valores Decimal
    const serializedProduct = {
      ...updatedProduct,
      minStock: updatedProduct.minStock ? Number(updatedProduct.minStock) : null,
      costPrice: updatedProduct.costPrice ? Number(updatedProduct.costPrice) : null,
      salePrice: updatedProduct.salePrice ? Number(updatedProduct.salePrice) : null,
      stockBalance: updatedProduct.stockBalance ? {
        ...updatedProduct.stockBalance,
        quantity: Number(updatedProduct.stockBalance.quantity),
      } : null,
    }

    return NextResponse.json({
      success: true,
      data: serializedProduct,
      message: 'Produto atualizado com sucesso',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { message: error.errors[0].message, code: 'VALIDATION_ERROR' } },
        { status: 400 }
      )
    }

    if (error instanceof NotFoundError || error instanceof BadRequestError) {
      return NextResponse.json(
        { success: false, error: { message: error.message, code: error.code || 'ERROR' } },
        { status: error.statusCode || 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: { message: error.message, code: 'ERROR' } },
      { status: 500 }
    )
  }
}

