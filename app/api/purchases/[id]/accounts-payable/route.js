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
})

const createAccountPayableSchema = z.object({
  installments: z.array(installmentSchema).min(1, 'Pelo menos uma parcela é obrigatória'),
  categoryId: z.string().optional(),
})

export async function POST(request, { params }) {
  try {
    const user = authenticate(request)
    authorize(user, 'ADMIN', 'COMPRAS', 'FINANCEIRO')

    // Buscar o pedido de compra
    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id: params.id },
      include: {
        supplier: true,
      },
    })

    if (!purchaseOrder) {
      return NextResponse.json(
        { success: false, error: { message: 'Pedido de compra não encontrado', code: 'NOT_FOUND' } },
        { status: 404 }
      )
    }

    const body = await request.json()
    const data = createAccountPayableSchema.parse(body)

    // Buscar contas a pagar existentes para este pedido (apenas OPEN)
    const existingAccounts = await prisma.accountsPayable.findMany({
      where: {
        purchaseOrderId: params.id,
        status: 'OPEN',
      },
    })

    // Calcular total das parcelas novas
    const totalNewInstallments = data.installments.reduce((sum, inst) => sum + inst.amount, 0)
    
    // Calcular total das contas a pagar existentes
    const totalExistingAP = existingAccounts.reduce((sum, ap) => sum + Number(ap.amount), 0)
    
    // Total geral (existentes + novas)
    const totalAllAccounts = totalExistingAP + totalNewInstallments
    const orderTotal = Number(purchaseOrder.total)
    
    // Validar se a soma total não excede o total do pedido
    if (totalAllAccounts > orderTotal + 0.01) { // Permitir pequena diferença de arredondamento
      const available = orderTotal - totalExistingAP
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            message: `A soma total das contas a pagar (R$ ${totalAllAccounts.toFixed(2)}) excede o total do pedido (R$ ${orderTotal.toFixed(2)}). Já existem contas a pagar no valor de R$ ${totalExistingAP.toFixed(2)}. Valor disponível: R$ ${available > 0 ? available.toFixed(2) : '0,00'}`, 
            code: 'BAD_REQUEST' 
          } 
        },
        { status: 400 }
      )
    }

    // Criar contas a pagar para cada parcela
    const createdAccounts = []
    const baseDescription = `Pedido de compra #${purchaseOrder.id.slice(0, 8)}`

    for (let i = 0; i < data.installments.length; i++) {
      const installment = data.installments[i]
      const installmentNumber = data.installments.length > 1 ? ` - Parcela ${i + 1}/${data.installments.length}` : ''
      
      const accountPayable = await prisma.accountsPayable.create({
        data: {
          supplierId: purchaseOrder.supplierId,
          purchaseOrderId: purchaseOrder.id,
          description: installment.description || `${baseDescription}${installmentNumber}`,
          dueDate: new Date(installment.dueDate),
          amount: new Decimal(installment.amount),
          categoryId: data.categoryId || null,
          status: 'OPEN',
        },
        include: {
          supplier: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      })

      createdAccounts.push({
        ...accountPayable,
        amount: Number(accountPayable.amount),
      })
    }

    return NextResponse.json({
      success: true,
      data: createdAccounts,
    }, { status: 201 })
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
      { status: error.statusCode || 500 }
    )
  }
}

