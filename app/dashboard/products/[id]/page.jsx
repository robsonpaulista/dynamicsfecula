'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { ArrowLeft, Package, TrendingUp, TrendingDown, Calendar, User, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProduct()
  }, [params.id])

  const loadProduct = async () => {
    try {
      const response = await api.get(`/products/${params.id}`)
      setProduct(response.data.data)
    } catch (error) {
      toast({
        title: 'Erro',
        description: error.response?.data?.error?.message || 'Erro ao carregar produto',
        variant: 'destructive',
      })
      router.push('/dashboard/products')
    } finally {
      setLoading(false)
    }
  }

  const getTypeLabel = (type) => {
    const types = {
      MP: 'Matéria-Prima',
      PA: 'Produto Acabado',
      SERVICO: 'Serviço',
    }
    return types[type] || type
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getMovementTypeLabel = (type) => {
    const types = {
      IN: 'Entrada',
      OUT: 'Saída',
      ADJUST: 'Ajuste',
    }
    return types[type] || type
  }

  if (loading) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-[#00B299]" />
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return null
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button variant="ghost" asChild className="hover:bg-[#00B299]/10">
            <Link href="/dashboard/products">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Informações Principais */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="gradient-card border-[#00B299]/20 shadow-glow-lg">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                      {product.name}
                    </CardTitle>
                    <p className="text-gray-600">SKU: {product.sku}</p>
                  </div>
                  <div className="w-16 h-16 rounded-xl bg-[#00B299] flex items-center justify-center shadow-md">
                    <Package className="h-8 w-8 text-white" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 p-4 bg-[#00B299]/5 rounded-xl">
                    <p className="text-sm text-gray-600">Tipo</p>
                    <p className="text-lg font-semibold text-[#00B299]">{getTypeLabel(product.type)}</p>
                  </div>
                  <div className="space-y-2 p-4 bg-[#00B299]/5 rounded-xl">
                    <p className="text-sm text-gray-600">Unidade</p>
                    <p className="text-lg font-semibold text-[#00B299]">{product.unit}</p>
                  </div>
                  {product.minStock !== null && (
                    <div className="space-y-2 p-4 bg-[#FF8C00]/5 rounded-xl">
                      <p className="text-sm text-gray-600">Estoque Mínimo</p>
                      <p className="text-lg font-semibold text-[#FF8C00]">
                        {Number(product.minStock)} {product.unit}
                      </p>
                    </div>
                  )}
                  <div className="space-y-2 p-4 bg-[#00B299]/5 rounded-xl">
                    <p className="text-sm text-gray-600">Status</p>
                    <p className={`text-lg font-semibold ${product.isActive ? 'text-[#00B299]' : 'text-red-700'}`}>
                      {product.isActive ? 'Ativo' : 'Inativo'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Preços */}
            {(product.costPrice !== null || product.salePrice !== null) && (
              <Card className="gradient-card border-[#00B299]/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#00B299] flex items-center justify-center">
                      <TrendingUp className="h-4 w-4 text-white" />
                    </div>
                    Preços
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {product.costPrice !== null && (
                      <div className="p-4 bg-[#00B299]/5 rounded-xl">
                        <p className="text-sm text-gray-600 mb-1">Preço de Custo</p>
                        <p className="text-2xl font-bold text-[#00B299]">
                          {formatCurrency(Number(product.costPrice))}
                        </p>
                      </div>
                    )}
                    {product.salePrice !== null && (
                      <div className="p-4 bg-[#00B299]/5 rounded-xl">
                        <p className="text-sm text-gray-600 mb-1">Preço de Venda</p>
                        <p className="text-2xl font-bold text-[#00B299]">
                          {formatCurrency(Number(product.salePrice))}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Movimentações de Estoque */}
            {product.stockMovements && product.stockMovements.length > 0 && (
              <Card className="gradient-card border-green-100/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
                      <TrendingDown className="h-4 w-4 text-white" />
                    </div>
                    Últimas Movimentações
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {product.stockMovements.map((movement) => (
                      <div
                        key={movement.id}
                        className="flex justify-between items-center p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100/50"
                      >
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{getMovementTypeLabel(movement.type)}</p>
                          <p className="text-xs text-gray-600 flex items-center gap-2 mt-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(movement.createdAt)}
                            {movement.createdBy && (
                              <>
                                <span className="mx-1">•</span>
                                <User className="h-3 w-3" />
                                {movement.createdBy.name}
                              </>
                            )}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold text-lg ${
                            movement.type === 'IN' ? 'text-green-600' : movement.type === 'OUT' ? 'text-red-600' : 'text-orange-600'
                          }`}>
                            {movement.type === 'IN' ? '+' : movement.type === 'OUT' ? '-' : '±'}
                            {Number(movement.quantity)} {product.unit}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar - Estoque e Informações */}
          <div className="space-y-6">
            <Card className="gradient-card border-green-100/50 shadow-glow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
                    <Package className="h-5 w-5 text-white" />
                  </div>
                  Estoque Atual
                </CardTitle>
              </CardHeader>
              <CardContent>
                {product.stockBalance ? (
                  <div className="text-center">
                    <p className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
                      {Number(product.stockBalance.quantity)}
                    </p>
                    <p className="text-gray-600 font-medium">{product.unit}</p>
                    {product.minStock !== null && Number(product.stockBalance.quantity) < Number(product.minStock) && (
                      <p className="text-sm text-orange-600 font-semibold mt-2">
                        ⚠ Estoque abaixo do mínimo
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-center text-gray-600">Sem estoque cadastrado</p>
                )}
              </CardContent>
            </Card>

            <Card className="gradient-card border-gray-100/50">
              <CardHeader>
                <CardTitle className="text-lg">Informações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs text-gray-600">Criado em</p>
                  <p className="text-sm font-medium text-gray-900">
                    {formatDate(product.createdAt)}
                  </p>
                </div>
                {product.updatedAt && (
                  <div>
                    <p className="text-xs text-gray-600">Atualizado em</p>
                    <p className="text-sm font-medium text-gray-900">
                      {formatDate(product.updatedAt)}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

