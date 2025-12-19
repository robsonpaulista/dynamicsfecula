'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Plus, ShoppingCart } from 'lucide-react'
import Link from 'next/link'

export default function SalesPage() {
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSales()
  }, [])

  const loadSales = async () => {
    try {
      const response = await api.get('/sales')
      setSales(response.data.data)
    } catch (error) {
      console.error('Erro ao carregar vendas:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      DRAFT: 'bg-gray-100 text-gray-800',
      CONFIRMED: 'bg-[#00B299]/10 text-[#00B299]',
      DELIVERED: 'bg-[#00B299]/10 text-[#00B299]',
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
              Vendas
            </h1>
            <p className="text-gray-600 mt-1 text-sm md:text-base">Gerencie pedidos de venda</p>
          </div>
          <Button asChild className="bg-[#00B299] hover:shadow-glow-lg transition-all w-full sm:w-auto">
            <Link href="/dashboard/sales/new">
              <Plus className="h-4 w-4 mr-2" />
              Nova Venda
            </Link>
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Carregando vendas...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sales.map((sale) => (
              <Card 
                key={sale.id} 
                className="gradient-card border-green-100/50 hover:shadow-glow-lg transition-all duration-300 hover:scale-[1.02]"
              >
                <CardHeader>
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base sm:text-lg font-semibold text-gray-900 break-words">
                        Pedido #{sale.id.slice(0, 8)}
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1 flex items-center gap-2 break-words">
                        <ShoppingCart className="h-4 w-4 text-[#00B299] flex-shrink-0" />
                        {sale.customer?.name}
                      </p>
                    </div>
                    <span className={`px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm whitespace-nowrap flex-shrink-0 ${getStatusColor(sale.status)}`}>
                      {sale.status}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                    <div className="space-y-1 min-w-0 flex-1">
                      <p className="text-sm text-gray-600 flex items-center gap-2 break-words">
                        <span className="font-medium">Data:</span> {formatDate(sale.saleDate)}
                      </p>
                    </div>
                    <div className="text-left sm:text-right w-full sm:w-auto flex-shrink-0">
                      <p className="text-xl sm:text-2xl md:text-3xl font-bold text-[#00B299] whitespace-nowrap">
                        {formatCurrency(Number(sale.total))}
                      </p>
                    </div>
                  </div>
                  
                  {sale.items && sale.items.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Itens do Pedido:</p>
                      <div className="space-y-2">
                        {sale.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4 p-3 bg-[#00B299]/5 rounded-lg border border-[#00B299]/20"
                          >
                            <div className="flex-1 min-w-0 w-full sm:w-auto">
                              <p className="font-semibold text-gray-900 text-sm break-words">{item.product?.name || 'Produto não encontrado'}</p>
                              {item.product?.sku && (
                                <p className="text-xs text-gray-600">SKU: {item.product.sku}</p>
                              )}
                              <p className="text-xs text-gray-600 mt-1 break-words">
                                {Number(item.quantity)} {item.product?.unit || 'un'} × {formatCurrency(Number(item.unitPrice))}
                              </p>
                            </div>
                            <div className="text-left sm:text-right w-full sm:w-auto flex-shrink-0">
                              <p className="text-sm sm:text-base font-bold text-green-700 whitespace-nowrap">{formatCurrency(Number(item.total))}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-4">
                    <Button variant="outline" className="w-full hover:bg-[#00B299]/10 hover:border-[#00B299] transition-all" asChild>
                      <Link href={`/dashboard/sales/${sale.id}`}>
                        Ver Detalhes
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!loading && sales.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhuma venda encontrada</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

