'use client'

import { useState, useEffect, useCallback } from 'react'
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

const salesSchema = z.object({
  customerId: z.string().min(1, 'Cliente é obrigatório'),
  saleDate: z.string().min(1, 'Data é obrigatória'),
  isBonificacao: z.boolean().optional().default(false),
  items: z.array(z.object({
    productId: z.string().min(1, 'Produto é obrigatório'),
    quantity: z.number().min(0.01, 'Quantidade deve ser maior que zero'),
    unitPrice: z.number().min(0, 'Preço deve ser maior ou igual a zero'),
  })).min(1, 'Adicione pelo menos um item'),
})

export default function NewSalesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])
  const [paymentMethods, setPaymentMethods] = useState([])
  const [loadingData, setLoadingData] = useState(true)
  const [installments, setInstallments] = useState([
    { dueDate: '', amount: '', description: '', paymentMethodId: '' }
  ])

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(salesSchema),
    defaultValues: {
      customerId: '',
      saleDate: new Date().toISOString().split('T')[0],
      isBonificacao: false,
      items: [{ productId: '', quantity: 1, unitPrice: 0 }],
    },
  })

  const isBonificacao = watch('isBonificacao')

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  })

  const watchedItems = watch('items')

  const loadData = useCallback(async () => {
    try {
      const [customersRes, productsRes, paymentMethodsRes] = await Promise.all([
        api.get('/customers', { params: { limit: 100, isActive: 'true' } }),
        api.get('/products', { params: { limit: 100, isActive: 'true' } }),
        api.get('/payment-methods'),
      ])
      setCustomers(customersRes.data.data)
      setProducts(productsRes.data.data)
      setPaymentMethods(paymentMethodsRes.data.data || [])
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao carregar dados. Verifique se o seed foi executado.',
        variant: 'destructive',
      })
    } finally {
      setLoadingData(false)
    }
  }, [toast])

  useEffect(() => {
    loadData()
  }, [loadData])

  const getProductStock = (productId) => {
    const product = products.find(p => p.id === productId)
    return product?.stockBalance ? Number(product.stockBalance.quantity) : 0
  }

  const calculateTotal = () => {
    return watchedItems.reduce((sum, item) => {
      const qty = Number(item.quantity) || 0
      const price = Number(item.unitPrice) || 0
      return sum + (qty * price)
    }, 0)
  }

  const addInstallment = () => {
    const defaultDueDate = new Date()
    defaultDueDate.setDate(defaultDueDate.getDate() + 30)
    setInstallments([...installments, {
      dueDate: defaultDueDate.toISOString().split('T')[0],
      amount: '',
      description: '',
      paymentMethodId: ''
    }])
  }

  const removeInstallment = (index) => {
    if (installments.length > 1) {
      setInstallments(installments.filter((_, i) => i !== index))
    }
  }

  const updateInstallment = (index, field, value) => {
    const updated = [...installments]
    updated[index] = { ...updated[index], [field]: value }
    setInstallments(updated)
  }

  useEffect(() => {
    const total = calculateTotal()
    if (total > 0 && installments.length === 1 && !installments[0].amount) {
      const defaultDueDate = new Date()
      defaultDueDate.setDate(defaultDueDate.getDate() + 30)
      setInstallments([{
        dueDate: defaultDueDate.toISOString().split('T')[0],
        amount: total.toString(),
        description: '',
        paymentMethodId: ''
      }])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedItems])

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      // Validar parcelas
      const validInstallments = installments.filter(inst => inst.dueDate && inst.amount)
      
      if (validInstallments.length === 0) {
        toast({
          title: 'Erro',
          description: 'Adicione pelo menos uma parcela com data e valor',
          variant: 'destructive',
        })
        setLoading(false)
        return
      }

      // Converter valores para número
      const installmentsData = validInstallments.map(inst => ({
        dueDate: inst.dueDate,
        amount: parseFloat(inst.amount) || 0,
        description: inst.description || undefined,
        // Só incluir paymentMethodId se não for vazio
        paymentMethodId: inst.paymentMethodId && inst.paymentMethodId.trim() !== '' 
          ? inst.paymentMethodId 
          : undefined,
      }))

      // Validar valores
      const totalAmount = installmentsData.reduce((sum, inst) => sum + inst.amount, 0)
      const orderTotal = calculateTotal()
      
      if (totalAmount <= 0) {
        toast({
          title: 'Erro',
          description: 'O valor total das parcelas deve ser maior que zero',
          variant: 'destructive',
        })
        setLoading(false)
        return
      }

      if (totalAmount > orderTotal + 0.01) {
        toast({
          title: 'Erro',
          description: `A soma das parcelas (R$ ${totalAmount.toFixed(2)}) excede o total do pedido (R$ ${orderTotal.toFixed(2)})`,
          variant: 'destructive',
        })
        setLoading(false)
        return
      }

      await api.post('/sales', {
        ...data,
        isBonificacao: data.isBonificacao || false,
        installments: installmentsData,
      })
      toast({
        title: 'Sucesso!',
        description: 'Pedido de venda criado com sucesso',
      })
      router.push('/dashboard/sales')
    } catch (error) {
      toast({
        title: 'Erro',
        description: error.response?.data?.error?.message || 'Erro ao criar pedido de venda',
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
            <Link href="/dashboard/sales">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Link>
          </Button>
        </div>

        <Card className="gradient-card border-green-100/50 shadow-glow-lg">
          <CardHeader>
            <CardTitle className="text-2xl text-[#00B299]">
              Novo Pedido de Venda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit, (errors) => {
              const errorMessages = Object.keys(errors).map(key => {
                const error = errors[key]
                if (error?.message) return error.message
                if (error?.root?.message) return error.root.message
                return `${key}: erro de validação`
              }).filter(Boolean)
              
              toast({
                title: 'Erro de validação',
                description: errorMessages.length > 0 ? errorMessages[0] : 'Por favor, preencha todos os campos obrigatórios',
                variant: 'destructive',
              })
            })} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customerId">Cliente *</Label>
                  <select
                    id="customerId"
                    {...register('customerId')}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Selecione um cliente</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))}
                  </select>
                  {errors.customerId && (
                    <p className="text-sm text-red-600">{errors.customerId.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="saleDate">Data da Venda *</Label>
                  <Input
                    id="saleDate"
                    type="date"
                    {...register('saleDate')}
                  />
                  {errors.saleDate && (
                    <p className="text-sm text-red-600">{errors.saleDate.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isBonificacao"
                    {...register('isBonificacao')}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="isBonificacao" className="text-sm font-normal">
                    Venda tipo Bonificação (gera despesa em vez de conta a receber)
                  </Label>
                </div>
                {isBonificacao && (
                  <p className="text-xs text-orange-600 bg-orange-50 p-2 rounded">
                    ⚠️ Atenção: Vendas tipo Bonificação movimentam estoque, mas geram despesa financeira em vez de conta a receber.
                  </p>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>Itens da Venda *</Label>
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

                {fields.map((field, index) => {
                  const selectedProductId = watchedItems[index]?.productId
                  const stock = getProductStock(selectedProductId)
                  const requestedQty = Number(watchedItems[index]?.quantity) || 0
                  const hasStockIssue = selectedProductId && stock < requestedQty

                  return (
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
                                {product.stockBalance && ` - Estoque: ${Number(product.stockBalance.quantity)}`}
                              </option>
                            ))}
                          </select>
                          {errors.items?.[index]?.productId && (
                            <p className="text-sm text-red-600 break-words">
                              {errors.items[index].productId.message}
                            </p>
                          )}
                          {selectedProductId && stock > 0 && (
                            <p className="text-xs text-gray-500">
                              Estoque disponível: {stock}
                            </p>
                          )}
                          {hasStockIssue && (
                            <p className="text-xs text-red-600 font-medium break-words">
                              ⚠️ Estoque insuficiente! Disponível: {stock}
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
                            className="w-full"
                          />
                          {errors.items?.[index]?.quantity && (
                            <p className="text-sm text-red-600 break-words">
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
                              className="flex-1 min-w-0"
                            />
                            {fields.length > 1 && (
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                onClick={() => remove(index)}
                                className="flex-shrink-0"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                          {errors.items?.[index]?.unitPrice && (
                            <p className="text-sm text-red-600 break-words">
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
                  )
                })}

                {errors.items && (
                  <p className="text-sm text-red-600">{errors.items.message}</p>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>{isBonificacao ? 'Despesas Financeiras *' : 'Contas a Receber *'}</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addInstallment}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Parcela
                  </Button>
                </div>

                {installments.map((installment, index) => (
                  <Card key={index} className={`p-4 bg-white ${isBonificacao ? 'border-orange-200' : 'border-green-200'}`}>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-semibold">
                          Parcela {index + 1}
                        </Label>
                        {installments.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeInstallment(index)}
                            className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor={`dueDate-${index}`} className="text-xs">Data de Vencimento *</Label>
                          <Input
                            id={`dueDate-${index}`}
                            type="date"
                            value={installment.dueDate}
                            onChange={(e) => updateInstallment(index, 'dueDate', e.target.value)}
                            className="bg-white text-sm w-full"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`amount-${index}`} className="text-xs">Valor *</Label>
                          <Input
                            id={`amount-${index}`}
                            type="number"
                            step="0.01"
                            min="0"
                            value={installment.amount}
                            onChange={(e) => updateInstallment(index, 'amount', e.target.value)}
                            placeholder="0.00"
                            className="bg-white text-sm w-full"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor={`paymentMethod-${index}`} className="text-xs">Forma de Pagamento</Label>
                          <select
                            id={`paymentMethod-${index}`}
                            value={installment.paymentMethodId}
                            onChange={(e) => updateInstallment(index, 'paymentMethodId', e.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          >
                            <option value="">Selecione uma forma</option>
                            {paymentMethods.map((method) => (
                              <option key={method.id} value={method.id}>
                                {method.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`description-${index}`} className="text-xs">Descrição</Label>
                          <Input
                            id={`description-${index}`}
                            type="text"
                            value={installment.description}
                            onChange={(e) => updateInstallment(index, 'description', e.target.value)}
                            placeholder={`Parcela ${index + 1}`}
                            className="bg-white text-sm w-full"
                          />
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}

                <div className="p-3 bg-[#00B299]/5 rounded-lg border border-[#00B299]/20">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 text-sm mb-1">
                    <span className="text-gray-600">Total do Pedido:</span>
                    <span className="font-semibold whitespace-nowrap">{formatCurrency(calculateTotal())}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 text-sm mb-1">
                    <span className="text-gray-600">Total das Parcelas:</span>
                    <span className="font-semibold whitespace-nowrap">
                      {formatCurrency(installments.reduce((sum, inst) => sum + (parseFloat(inst.amount) || 0), 0))}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 text-sm font-semibold pt-2 border-t border-[#00B299]/20">
                    <span className={calculateTotal() - installments.reduce((sum, inst) => sum + (parseFloat(inst.amount) || 0), 0) >= 0 ? 'text-[#00B299]' : 'text-red-700'}>
                      {calculateTotal() - installments.reduce((sum, inst) => sum + (parseFloat(inst.amount) || 0), 0) >= 0 ? 'Restante:' : 'Excedente:'}
                    </span>
                    <span className={`whitespace-nowrap ${calculateTotal() - installments.reduce((sum, inst) => sum + (parseFloat(inst.amount) || 0), 0) >= 0 ? 'text-[#00B299]' : 'text-red-700'}`}>
                      {formatCurrency(Math.abs(calculateTotal() - installments.reduce((sum, inst) => sum + (parseFloat(inst.amount) || 0), 0)))}
                    </span>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
                  <span className="text-lg font-semibold">Total:</span>
                  <span className="text-xl sm:text-2xl font-bold text-primary whitespace-nowrap">
                    {formatCurrency(calculateTotal())}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  className="hover:bg-gray-50 w-full sm:w-auto"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="bg-[#00B299] hover:shadow-glow-lg transition-all w-full sm:w-auto"
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

