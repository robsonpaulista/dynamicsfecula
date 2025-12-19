'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'

const purchaseSchema = z.object({
  supplierId: z.string().min(1, 'Fornecedor é obrigatório'),
  issueDate: z.string().min(1, 'Data é obrigatória'),
  items: z.array(z.object({
    productId: z.string().min(1, 'Produto é obrigatório'),
    quantity: z.number().min(0.01, 'Quantidade deve ser maior que zero'),
    unitPrice: z.number().min(0, 'Preço deve ser maior ou igual a zero'),
  })).min(1, 'Adicione pelo menos um item'),
  notes: z.string().optional(),
})

export default function NewPurchasePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [suppliers, setSuppliers] = useState([])
  const [products, setProducts] = useState([])
  const [loadingData, setLoadingData] = useState(true)

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      supplierId: '',
      issueDate: new Date().toISOString().split('T')[0],
      items: [{ productId: '', quantity: 1, unitPrice: 0 }],
      notes: '',
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  })

  const watchedItems = watch('items')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [suppliersRes, productsRes] = await Promise.all([
        api.get('/suppliers', { params: { limit: 100, isActive: 'true' } }),
        api.get('/products', { params: { limit: 100, isActive: 'true' } }),
      ])
      setSuppliers(suppliersRes.data.data)
      setProducts(productsRes.data.data)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao carregar fornecedores e produtos',
        variant: 'destructive',
      })
    } finally {
      setLoadingData(false)
    }
  }

  const calculateTotal = () => {
    return watchedItems.reduce((sum, item) => {
      const qty = Number(item.quantity) || 0
      const price = Number(item.unitPrice) || 0
      return sum + (qty * price)
    }, 0)
  }

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      await api.post('/purchases', data)
      toast({
        title: 'Sucesso!',
        description: 'Pedido de compra criado com sucesso',
      })
      router.push('/dashboard/purchases')
    } catch (error) {
      toast({
        title: 'Erro',
        description: error.response?.data?.error?.message || 'Erro ao criar pedido de compra',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  if (loadingData) {
    return (
      <div className="p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <p className="text-gray-600">Carregando...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button variant="ghost" asChild className="hover:bg-[#00B299]/10">
            <Link href="/dashboard/purchases">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Link>
          </Button>
        </div>

        <Card className="gradient-card border-[#00B299]/20 shadow-glow-lg">
          <CardHeader>
            <CardTitle className="text-2xl text-[#00B299]">
              Novo Pedido de Compra
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="supplierId">Fornecedor *</Label>
                  <select
                    id="supplierId"
                    {...register('supplierId')}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Selecione um fornecedor</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                  {errors.supplierId && (
                    <p className="text-sm text-red-600">{errors.supplierId.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="issueDate">Data da Compra *</Label>
                  <Input
                    id="issueDate"
                    type="date"
                    {...register('issueDate')}
                  />
                  {errors.issueDate && (
                    <p className="text-sm text-red-600">{errors.issueDate.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>Itens da Compra *</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ productId: '', quantity: 1, unitPrice: 0 })}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Item
                  </Button>
                </div>

                {fields.map((field, index) => (
                  <Card key={field.id} className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="md:col-span-2 space-y-2">
                        <Label>Produto *</Label>
                        <select
                          {...register(`items.${index}.productId`)}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                          <option value="">Selecione um produto</option>
                          {products.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.name} ({product.sku})
                            </option>
                          ))}
                        </select>
                        {errors.items?.[index]?.productId && (
                          <p className="text-sm text-red-600">
                            {errors.items[index].productId.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>Quantidade *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                          placeholder="0"
                        />
                        {errors.items?.[index]?.quantity && (
                          <p className="text-sm text-red-600">
                            {errors.items[index].quantity.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>Preço Unit. *</Label>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            step="0.01"
                            {...register(`items.${index}.unitPrice`, { valueAsNumber: true })}
                            placeholder="0.00"
                            className="flex-1"
                          />
                          {fields.length > 1 && (
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              onClick={() => remove(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        {errors.items?.[index]?.unitPrice && (
                          <p className="text-sm text-red-600">
                            {errors.items[index].unitPrice.message}
                          </p>
                        )}
                      </div>
                    </div>
                    {watchedItems[index] && (
                      <div className="mt-2 text-sm text-gray-600">
                        Subtotal: {formatCurrency(
                          (Number(watchedItems[index].quantity) || 0) *
                          (Number(watchedItems[index].unitPrice) || 0)
                        )}
                      </div>
                    )}
                  </Card>
                ))}

                {errors.items && (
                  <p className="text-sm text-red-600">{errors.items.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Observações</Label>
                <textarea
                  id="notes"
                  {...register('notes')}
                  rows={3}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Observações sobre o pedido..."
                />
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-semibold">Total:</span>
                  <span className="text-2xl font-bold text-primary">
                    {formatCurrency(calculateTotal())}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  className="hover:bg-gray-50"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="gradient-primary hover:shadow-glow-lg transition-all"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Salvando...' : 'Salvar Pedido'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

