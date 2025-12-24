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
      APPROVED: 'bg-blue-100 text-blue-800',
      RECEIVED: 'bg-green-100 text-green-800',
      CANCELED: 'bg-red-100 text-red-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Compras</h1>
            <p className="text-gray-600 mt-1">Gerencie pedidos de compra</p>
          </div>
          <Button asChild>
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
              <Card key={purchase.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">
                        Pedido #{purchase.id.slice(0, 8)}
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        {purchase.supplier?.name}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(purchase.status)}`}>
                      {purchase.status}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-600">
                        Data: {formatDate(purchase.issueDate)}
                      </p>
                      <p className="text-sm text-gray-600">
                        Itens: {purchase.items?.length || 0}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">
                        {formatCurrency(purchase.total.toNumber())}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Button variant="outline" className="w-full" asChild>
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










