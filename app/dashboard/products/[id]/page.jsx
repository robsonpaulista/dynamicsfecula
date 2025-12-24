'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ArrowLeft, Save, Edit, Package, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'

const productSchema = z.object({
  sku: z.string().min(1, 'SKU é obrigatório'),
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  type: z.enum(['MP', 'PA', 'SERVICO']),
  unit: z.string().min(1, 'Unidade é obrigatória'),
  minStock: z.number().min(0).optional().nullable(),
  costPrice: z.number().min(0).optional().nullable(),
  salePrice: z.number().min(0).optional().nullable(),
  isActive: z.boolean(),
})

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(productSchema),
  })

  const loadProduct = useCallback(async () => {
    try {
      const response = await api.get(`/products/${params.id}`)
      const productData = response.data.data
      setProduct(productData)
      
      // Preencher formulário com dados do produto
      reset({
        sku: productData.sku,
        name: productData.name,
        type: productData.type,
        unit: productData.unit,
        minStock: productData.minStock ?? null,
        costPrice: productData.costPrice ?? null,
        salePrice: productData.salePrice ?? null,
        isActive: productData.isActive ?? true,
      })
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
  }, [params.id, router, toast, reset])

  useEffect(() => {
    loadProduct()
  }, [loadProduct])

  const onSubmit = async (data) => {
    setSaving(true)
    try {
      await api.put(`/products/${params.id}`, data)
      toast({
        title: 'Sucesso!',
        description: 'Produto atualizado com sucesso',
      })
      setEditing(false)
      loadProduct()
    } catch (error) {
      toast({
        title: 'Erro',
        description: error.response?.data?.error?.message || 'Erro ao atualizar produto',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const getTypeLabel = (type) => {
    const labels = {
      MP: 'Matéria-prima',
      PA: 'Produto acabado',
      SERVICO: 'Serviço',
    }
    return labels[type] || type
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
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <Button variant="ghost" asChild className="hover:bg-[#00B299]/10">
            <Link href="/dashboard/products">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Link>
          </Button>
          {!editing && (
            <Button
              variant="outline"
              onClick={() => setEditing(true)}
              className="ml-auto hover:bg-[#00B299]/10 hover:border-[#00B299]"
            >
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          )}
        </div>

        {editing ? (
          <Card className="gradient-card border-[#00B299]/20 shadow-glow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-[#00B299]">
                Editar Produto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sku">SKU *</Label>
                    <Input
                      id="sku"
                      {...register('sku')}
                      placeholder="SKU-001"
                    />
                    {errors.sku && (
                      <p className="text-sm text-red-600">{errors.sku.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type">Tipo *</Label>
                    <select
                      id="type"
                      {...register('type')}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="MP">Matéria-prima</option>
                      <option value="PA">Produto acabado</option>
                      <option value="SERVICO">Serviço</option>
                    </select>
                    {errors.type && (
                      <p className="text-sm text-red-600">{errors.type.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    {...register('name')}
                    placeholder="Nome do produto"
                  />
                  {errors.name && (
                    <p className="text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="unit">Unidade *</Label>
                    <Input
                      id="unit"
                      {...register('unit')}
                      placeholder="kg, un, cx..."
                    />
                    {errors.unit && (
                      <p className="text-sm text-red-600">{errors.unit.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="minStock">Estoque Mínimo</Label>
                    <Input
                      id="minStock"
                      type="number"
                      step="0.01"
                      {...register('minStock', { valueAsNumber: true })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="costPrice">Preço de Custo</Label>
                    <Input
                      id="costPrice"
                      type="number"
                      step="0.01"
                      {...register('costPrice', { valueAsNumber: true })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="salePrice">Preço de Venda</Label>
                  <Input
                    id="salePrice"
                    type="number"
                    step="0.01"
                    {...register('salePrice', { valueAsNumber: true })}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    {...register('isActive')}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="isActive" className="text-sm font-normal">
                    Produto ativo
                  </Label>
                </div>

                <div className="flex justify-end gap-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setEditing(false)
                      loadProduct()
                    }}
                    className="hover:bg-gray-50"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={saving}
                    className="gradient-primary hover:shadow-glow-lg transition-all"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Salvar
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
            <div className="lg:col-span-2 space-y-4 md:space-y-6">
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
                      <p className="text-base font-semibold text-[#00B299]">
                        {getTypeLabel(product.type)}
                      </p>
                    </div>
                    <div className="space-y-2 p-4 bg-[#00B299]/5 rounded-xl">
                      <p className="text-sm text-gray-600">Unidade</p>
                      <p className="text-base font-semibold text-[#00B299]">
                        {product.unit}
                      </p>
                    </div>
                    {product.minStock !== null && (
                      <div className="space-y-2 p-4 bg-[#00B299]/5 rounded-xl">
                        <p className="text-sm text-gray-600">Estoque Mínimo</p>
                        <p className="text-base font-semibold text-[#00B299]">
                          {product.minStock} {product.unit}
                        </p>
                      </div>
                    )}
                    {product.costPrice !== null && (
                      <div className="space-y-2 p-4 bg-[#00B299]/5 rounded-xl">
                        <p className="text-sm text-gray-600">Preço de Custo</p>
                        <p className="text-base font-semibold text-[#00B299]">
                          {formatCurrency(product.costPrice)}
                        </p>
                      </div>
                    )}
                    {product.salePrice !== null && (
                      <div className="space-y-2 p-4 bg-[#00B299]/5 rounded-xl">
                        <p className="text-sm text-gray-600">Preço de Venda</p>
                        <p className="text-base font-semibold text-[#00B299]">
                          {formatCurrency(product.salePrice)}
                        </p>
                      </div>
                    )}
                    <div className="space-y-2 p-4 bg-[#00B299]/5 rounded-xl">
                      <p className="text-sm text-gray-600">Status</p>
                      <p className="text-base font-semibold text-[#00B299]">
                        {product.isActive ? 'Ativo' : 'Inativo'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {product.stockBalance && (
                <Card className="gradient-card border-purple-100/50">
                  <CardHeader>
                    <CardTitle>Estoque Atual</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center p-6">
                      <p className="text-4xl font-bold text-[#00B299]">
                        {Number(product.stockBalance.quantity)} {product.unit}
                      </p>
                      {product.minStock !== null && (
                        <p className="text-sm text-gray-600 mt-2">
                          Estoque mínimo: {product.minStock} {product.unit}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {product.stockMovements && product.stockMovements.length > 0 && (
                <Card className="gradient-card border-gray-100/50">
                  <CardHeader>
                    <CardTitle>Últimas Movimentações</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {product.stockMovements.slice(0, 10).map((movement) => (
                        <div
                          key={movement.id}
                          className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                        >
                          <div>
                            <p className="text-sm font-medium">
                              {movement.type === 'IN' ? 'Entrada' : movement.type === 'OUT' ? 'Saída' : 'Ajuste'}
                            </p>
                            <p className="text-xs text-gray-600">
                              {formatDate(movement.createdAt)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-bold ${movement.type === 'IN' ? 'text-green-600' : movement.type === 'OUT' ? 'text-red-600' : 'text-blue-600'}`}>
                              {movement.type === 'IN' ? '+' : '-'}{Number(movement.quantity)} {product.unit}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="space-y-4 md:space-y-6">
              <Card className="gradient-card border-gray-100/50">
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">Informações</CardTitle>
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
        )}
      </div>
    </div>
  )
}
