import { NextResponse } from 'next/server'
import { z } from 'zod'
import { Decimal } from '@prisma/client/runtime/library'
import { prisma } from '@/lib/prisma'
import { authenticate, authorize } from '@/middleware/auth'
import { NotFoundError, BadRequestError } from '@/utils/errors'

const installmentSchema = z.object({
  dueDate: z.string().or(z.date()),
  amount: z.number().min(0.01, 'Valor deve ser maior que zero'),
  description: z.string().optional(),
  paymentMethodId: z.string().optional(),
})

const salesSchema = z.object({
  customerId: z.string().min(1, 'Cliente é obrigatório'),
  saleDate: z.string().or(z.date()),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().min(0.01, 'Quantidade deve ser maior que zero'),
    unitPrice: z.number().min(0, 'Preço deve ser maior ou igual a zero'),
  })).min(1, 'Pelo menos um item é obrigatório'),
  installments: z.array(installmentSchema).min(1, 'Pelo menos uma parcela é obrigatória').optional(),
  categoryId: z.string().optional(),
})

export async function GET(request) {
  try {
    authenticate(request)

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status')
    const customerId = searchParams.get('customerId')
    const skip = (page - 1) * limit

    const where = {}
    if (status) where.status = status
    if (customerId) where.customerId = customerId

    const [orders, total] = await Promise.all([
      prisma.salesOrder.findMany({
        where,
        skip,
        take: limit,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
            },
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  sku: true,
                  name: true,
                  unit: true,
                },
              },
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.salesOrder.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: orders.map(order => ({
        ...order,
        total: Number(order.total),
        items: order.items.map(item => ({
          ...item,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          total: Number(item.total),
        })),
      })),
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
    authorize(user, 'ADMIN', 'VENDAS')

    const body = await request.json()
    const data = salesSchema.parse(body)

    if (!data.items || data.items.length === 0) {
      return NextResponse.json(
        { success: false, error: { message: 'Pelo menos um item é obrigatório', code: 'BAD_REQUEST' } },
        { status: 400 }
      )
    }

    // Calcular total e verificar estoque
    let total = new Decimal(0)
    const salesItems = []

    for (const item of data.items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        include: { stockBalance: true },
      })

      if (!product) {
        return NextResponse.json(
          { success: false, error: { message: `Produto ${item.productId} não encontrado`, code: 'NOT_FOUND' } },
          { status: 404 }
        )
      }

      // Verificar estoque (apenas para produtos físicos)
      if (product.type !== 'SERVICO') {
        const balance = product.stockBalance
        if (!balance || balance.quantity.toNumber() < item.quantity) {
          return NextResponse.json(
            {
              success: false,
              error: {
                message: `Estoque insuficiente para ${product.name}. Disponível: ${balance?.quantity.toNumber() || 0}`,
                code: 'BAD_REQUEST',
              },
            },
            { status: 400 }
          )
        }
      }

      const itemTotal = new Decimal(item.quantity).times(item.unitPrice)
      total = total.plus(itemTotal)

      salesItems.push({
        productId: item.productId,
        quantity: new Decimal(item.quantity),
        unitPrice: new Decimal(item.unitPrice),
        total: itemTotal,
      })
    }

    const order = await prisma.salesOrder.create({
      data: {
        customerId: data.customerId,
        saleDate: new Date(data.saleDate || new Date()),
        total,
        status: 'DRAFT',
        createdById: user.id,
        items: {
          create: salesItems,
        },
      },
      include: {
        customer: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    })

    // Criar contas a receber se parcelas foram informadas
    if (data.installments && data.installments.length > 0) {
      const orderTotal = Number(total)
      const totalInstallments = data.installments.reduce((sum, inst) => sum + inst.amount, 0)

      // Validar se a soma das parcelas não excede o total do pedido
      if (totalInstallments > orderTotal + 0.01) {
        return NextResponse.json(
          { 
            success: false, 
            error: { 
              message: `A soma das parcelas (R$ ${totalInstallments.toFixed(2)}) excede o total do pedido (R$ ${orderTotal.toFixed(2)})`, 
              code: 'BAD_REQUEST' 
            } 
          },
          { status: 400 }
        )
      }

      const baseDescription = `Pedido de venda #${order.id.slice(0, 8)}`

      for (let i = 0; i < data.installments.length; i++) {
        const installment = data.installments[i]
        const installmentNumber = data.installments.length > 1 ? ` - Parcela ${i + 1}/${data.installments.length}` : ''
        
        // Validar paymentMethodId se fornecido
        let paymentMethodId = null
        if (installment.paymentMethodId && installment.paymentMethodId.trim() !== '') {
          const paymentMethod = await prisma.paymentMethod.findUnique({
            where: { id: installment.paymentMethodId },
          })
          if (!paymentMethod) {
            return NextResponse.json(
              { 
                success: false, 
                error: { 
                  message: `Forma de pagamento não encontrada para a parcela ${i + 1}`, 
                  code: 'NOT_FOUND' 
                } 
              },
              { status: 404 }
            )
          }
          paymentMethodId = installment.paymentMethodId
        }

        // Validar categoryId se fornecido
        let categoryId = null
        if (data.categoryId && data.categoryId.trim() !== '') {
          const category = await prisma.category.findUnique({
            where: { id: data.categoryId },
          })
          if (!category) {
            return NextResponse.json(
              { 
                success: false, 
                error: { 
                  message: 'Categoria não encontrada', 
                  code: 'NOT_FOUND' 
                } 
              },
              { status: 404 }
            )
          }
          categoryId = data.categoryId
        }
        
        // Calcular prazo em dias se dueDate e saleDate estiverem disponíveis
        let paymentDays = null
        if (installment.dueDate && data.saleDate) {
          const saleDate = new Date(data.saleDate)
          const dueDate = new Date(installment.dueDate)
          const diffTime = dueDate.getTime() - saleDate.getTime()
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
          if (diffDays > 0) {
            paymentDays = diffDays
          }
        }

        await prisma.accountsReceivable.create({
          data: {
            customerId: data.customerId,
            salesOrderId: order.id,
            description: installment.description || `${baseDescription}${installmentNumber}`,
            dueDate: new Date(installment.dueDate),
            amount: new Decimal(installment.amount),
            categoryId,
            paymentMethodId,
            paymentDays,
            status: 'OPEN',
          },
        })
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        ...order,
        total: Number(order.total),
        items: order.items.map(item => ({
          ...item,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          total: Number(item.total),
        })),
      },
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { message: error.errors[0].message, code: 'VALIDATION_ERROR' } },
        { status: 400 }
      )
    }

    // Tratar erro de foreign key constraint
    if (error.code === 'P2003' || error.message?.includes('Foreign key constraint')) {
      const field = error.meta?.field_name || 'campo'
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            message: `Erro de integridade: ${field} não encontrado. Verifique se todos os dados relacionados existem no banco.`, 
            code: 'FOREIGN_KEY_ERROR',
            details: error.message
          } 
        },
        { status: 400 }
      )
    }

    console.error('Erro ao criar pedido de venda:', error)
    return NextResponse.json(
      { success: false, error: { message: error.message, code: error.code || 'ERROR' } },
      { status: error.statusCode || 500 }
    )
  }
}










