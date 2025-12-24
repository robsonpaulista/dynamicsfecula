'use client'

import { useEffect, useState, useCallback } from 'react'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatCurrency } from '@/lib/utils'
import { Plus, Search, Package, Edit } from 'lucide-react'
import Link from 'next/link'

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const loadProducts = useCallback(async () => {
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
  }, [search])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#00B299]">
              Produtos
            </h1>
            <p className="text-gray-600 mt-1 text-sm md:text-base">Gerencie seu catálogo de produtos</p>
          </div>
          <Button asChild className="gradient-primary hover:shadow-glow-lg transition-all w-full sm:w-auto">
            <Link href="/dashboard/products/new">
              <Plus className="h-4 w-4 mr-2" />
              Novo Produto
            </Link>
          </Button>
        </div>

        <Card className="mb-6 gradient-card border-[#00B299]/20 shadow-md">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#00B299]" />
              <Input
                placeholder="Buscar produtos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 border-[#00B299]/30 focus:border-[#00B299] focus:ring-[#00B299]"
              />
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#00B299]"></div>
            <p className="text-gray-600 mt-4">Carregando produtos...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {products.map((product) => (
              <Card 
                key={product.id} 
                className="gradient-card border-[#00B299]/20 hover:shadow-glow-lg transition-all duration-300 hover:scale-105 cursor-pointer"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold text-gray-900">{product.name}</CardTitle>
                      <p className="text-sm text-gray-500 mt-1">SKU: {product.sku}</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-[#00B299] flex items-center justify-center shadow-md">
                      <Package className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-2 bg-[#00B299]/5 rounded-lg">
                      <span className="text-sm text-gray-600">Tipo:</span>
                      <span className="text-sm font-semibold text-[#00B299]">{product.type}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-[#00B299]/5 rounded-lg">
                      <span className="text-sm text-gray-600">Unidade:</span>
                      <span className="text-sm font-semibold text-[#00B299]">{product.unit}</span>
                    </div>
                    {product.stockBalance && (
                      <div className="flex justify-between items-center p-2 bg-[#00B299]/5 rounded-lg">
                        <span className="text-sm text-gray-600">Estoque:</span>
                        <span className="text-sm font-bold text-[#00B299]">
                          {Number(product.stockBalance.quantity)} {product.unit}
                        </span>
                      </div>
                    )}
                    {product.costPrice && (
                      <div className="flex justify-between items-center p-2 bg-[#00B299]/5 rounded-lg">
                        <span className="text-sm text-gray-600">Custo:</span>
                        <span className="text-sm font-bold text-[#00B299]">
                          {formatCurrency(Number(product.costPrice))}
                        </span>
                      </div>
                    )}
                    <div className="pt-2 border-t border-gray-200 flex gap-2">
                      <Button variant="outline" className="flex-1 hover:bg-[#00B299]/10 hover:border-[#00B299] transition-all" asChild>
                        <Link href={`/dashboard/products/${product.id}`}>
                          Ver Detalhes
                        </Link>
                      </Button>
                      <Button variant="outline" className="hover:bg-[#00B299]/10 hover:border-[#00B299] transition-all" asChild>
                        <Link href={`/dashboard/products/${product.id}`}>
                          <Edit className="h-4 w-4" />
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

