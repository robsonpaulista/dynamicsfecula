// Helper para serializar dados do Prisma para JSON
// Converte Decimal para número e trata outros tipos

import { Decimal } from '@prisma/client/runtime/library'

export function serialize(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map(item => serialize(item))
  }

  const newObj = {}
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      if (obj[key] instanceof Decimal) {
        newObj[key] = Number(obj[key])
      } else if (obj[key] instanceof Date) {
        newObj[key] = obj[key].toISOString()
      } else if (typeof obj[key] === 'object') {
        newObj[key] = serialize(obj[key])
      } else {
        newObj[key] = obj[key]
      }
    }
  }
  return newObj
}

export function serializeProduct(product) {
  if (!product) return null
  
  return {
    ...product,
    minStock: product.minStock ? Number(product.minStock) : null,
    costPrice: product.costPrice ? Number(product.costPrice) : null,
    salePrice: product.salePrice ? Number(product.salePrice) : null,
    stockBalance: product.stockBalance ? {
      ...product.stockBalance,
      quantity: Number(product.stockBalance.quantity),
    } : null,
  }
}

export function serializeProducts(products) {
  return products.map(serializeProduct)
}

export function serializeOrder(order) {
  if (!order) return null
  
  return {
    ...order,
    total: Number(order.total),
    items: order.items?.map(item => ({
      ...item,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      total: Number(item.total),
    })) || [],
  }
}

export function serializeAccount(account) {
  if (!account) return null
  
  return {
    ...account,
    amount: Number(account.amount),
  }
}

