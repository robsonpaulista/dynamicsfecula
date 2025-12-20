'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatCurrency } from '@/lib/utils'
import { Plus, Search, Package } from 'lucide-react'
import Link from 'next/link'

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadProducts()
  }, [search])

  const loadProducts = async () => {
    try {
      const response = await api.get('/products', {
        params: { search, limit: 50 },
      })
      setProducts(response.data.data)
    } catch (error) {
      console.error('Erro ao carregar produtos:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Produtos</h1>
            <p className="text-gray-600 mt-1">Gerencie seu catálogo de produtos</p>
          </div>
          <Button asChild>
            <Link href="/dashboard/products/new">
              <Plus className="h-4 w-4 mr-2" />
              Novo Produto
            </Link>
          </Button>
        </div>

        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar produtos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Carregando produtos...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product) => (
              <Card key={product.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{product.name}</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">SKU: {product.sku}</p>
                    </div>
                    <Package className="h-8 w-8 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Tipo:</span>
                      <span className="text-sm font-medium">{product.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Unidade:</span>
                      <span className="text-sm font-medium">{product.unit}</span>
                    </div>
                    {product.stockBalance && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Estoque:</span>
                        <span className="text-sm font-medium">
                          {product.stockBalance.quantity.toNumber()} {product.unit}
                        </span>
                      </div>
                    )}
                    {product.costPrice && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Custo:</span>
                        <span className="text-sm font-medium">
                          {formatCurrency(product.costPrice.toNumber())}
                        </span>
                      </div>
                    )}
                    <div className="pt-2 border-t">
                      <Button variant="outline" className="w-full" asChild>
                        <Link href={`/dashboard/products/${product.id}`}>
                          Ver Detalhes
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!loading && products.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhum produto encontrado</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}








