'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Plus, ShoppingCart } from 'lucide-react'
import Link from 'next/link'

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPurchases()
  }, [])

  const loadPurchases = async () => {
    try {
      const response = await api.get('/purchases')
      setPurchases(response.data.data)
    } catch (error) {
      console.error('Erro ao carregar compras:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      DRAFT: 'bg-gray-100 text-gray-800',
      APPROVED: 'bg-[#00B299]/10 text-[#00B299]',
      RECEIVED: 'bg-green-100 text-green-800',
      CANCELED: 'bg-red-100 text-red-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#00B299]">
              Compras
            </h1>
            <p className="text-gray-600 mt-1 text-sm md:text-base">Gerencie pedidos de compra</p>
          </div>
          <Button asChild className="gradient-primary hover:shadow-glow-lg transition-all w-full sm:w-auto">
            <Link href="/dashboard/purchases/new">
              <Plus className="h-4 w-4 mr-2" />
              Nova Compra
            </Link>
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Carregando compras...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {purchases.map((purchase) => (
              <Card 
                key={purchase.id} 
                className="gradient-card border-[#00B299]/20 hover:shadow-glow-lg transition-all duration-300 hover:scale-[1.02]"
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold text-gray-900">
                        Pedido #{purchase.id.slice(0, 8)}
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                        <ShoppingCart className="h-4 w-4 text-[#00B299]" />
                        {purchase.supplier?.name}
                      </p>
                    </div>
                    <span className={`px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm ${getStatusColor(purchase.status)}`}>
                      {purchase.status}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                    <div className="space-y-1">
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        <span className="font-medium">Data:</span> {formatDate(purchase.issueDate)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl md:text-3xl font-bold text-[#00B299]">
                        {formatCurrency(Number(purchase.total))}
                      </p>
                    </div>
                  </div>
                  
                  {purchase.items && purchase.items.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Itens do Pedido:</p>
                      <div className="space-y-2">
                        {purchase.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex justify-between items-center p-3 bg-[#00B299]/5 rounded-lg border border-[#00B299]/20"
                          >
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900 text-sm">{item.product?.name || 'Produto não encontrado'}</p>
                              {item.product?.sku && (
                                <p className="text-xs text-gray-600">SKU: {item.product.sku}</p>
                              )}
                              <p className="text-xs text-gray-600 mt-1">
                                {Number(item.quantity)} {item.product?.unit || 'un'} × {formatCurrency(Number(item.unitPrice))}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-[#00B299]">{formatCurrency(Number(item.total))}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-4">
                    <Button variant="outline" className="w-full hover:bg-[#00B299]/10 hover:border-[#00B299] transition-all" asChild>
                      <Link href={`/dashboard/purchases/${purchase.id}`}>
                        Ver Detalhes
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!loading && purchases.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhuma compra encontrada</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

