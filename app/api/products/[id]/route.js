import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticate, authorize } from '@/middleware/auth'
import { NotFoundError } from '@/utils/errors'
import { serializeProduct } from '@/lib/serialize'

export async function GET(request, { params }) {
  try {
    const user = authenticate(request)
    authorize(user, 'ADMIN', 'ESTOQUE', 'COMPRAS', 'VENDAS')

    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        stockBalance: true,
        stockMovements: {
          take: 20,
          orderBy: { createdAt: 'desc' },
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
            },
          })
          if (salesOrder) {
            reference = {
              type: 'SALE',
              customer: salesOrder.customer,
            }
          }
        }
        
        return {
          ...movement,
          reference,
        }
      })
    )

    // Serializar movimentações também
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

