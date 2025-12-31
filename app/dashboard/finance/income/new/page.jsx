'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'

const incomeSchema = z.object({
  description: z.string().min(1, 'Descrição é obrigatória'),
  customerId: z.string().optional(),
  categoryId: z.string().min(1, 'Categoria é obrigatória'),
  dueDate: z.string().min(1, 'Data de vencimento é obrigatória'),
  amount: z.number().min(0.01, 'Valor deve ser maior que zero'),
  paymentDays: z.number().int().positive().optional(),
})

export default function NewIncomePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [customers, setCustomers] = useState([])
  const [categories, setCategories] = useState([])
  const [loadingData, setLoadingData] = useState(true)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(incomeSchema),
    defaultValues: {
      dueDate: new Date().toISOString().split('T')[0],
    },
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [customersRes, categoriesRes] = await Promise.all([
        api.get('/customers', { params: { isActive: 'true', limit: 100 } }),
        api.get('/categories', { params: { kind: 'INCOME', limit: 100 } }),
      ])
      setCustomers(customersRes.data.data || [])
      setCategories(categoriesRes.data.data || [])
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao carregar dados',
        variant: 'destructive',
      })
    } finally {
      setLoadingData(false)
    }
  }

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      await api.post('/finance/ar', {
        description: data.description,
        customerId: data.customerId || null,
        categoryId: data.categoryId,
        dueDate: data.dueDate,
        amount: data.amount,
        paymentDays: data.paymentDays || null,
      })
      toast({
        title: 'Sucesso!',
        description: 'Receita lançada com sucesso',
      })
      router.push('/dashboard/finance')
    } catch (error) {
      toast({
        title: 'Erro',
        description: error.response?.data?.error?.message || 'Erro ao lançar receita',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  if (loadingData) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#00B299]"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Button variant="ghost" asChild className="hover:bg-[#00B299]/10">
            <Link href="/dashboard/finance">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Link>
          </Button>
        </div>

        <Card className="gradient-card border-green-100/50 shadow-glow-lg">
          <CardHeader>
            <CardTitle className="text-2xl text-[#00B299]">
              Nova Receita
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="description">Descrição *</Label>
                <Input
                  id="description"
                  {...register('description')}
                  placeholder="Ex: Venda de serviços, Recebimento de aluguel..."
                />
                {errors.description && (
                  <p className="text-sm text-red-600">{errors.description.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customerId">Cliente (opcional)</Label>
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="categoryId">Categoria *</Label>
                  <select
                    id="categoryId"
                    {...register('categoryId')}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Selecione uma categoria</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  {errors.categoryId && (
                    <p className="text-sm text-red-600">{errors.categoryId.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Data de Vencimento *</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    {...register('dueDate')}
                  />
                  {errors.dueDate && (
                    <p className="text-sm text-red-600">{errors.dueDate.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Valor *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    {...register('amount', { valueAsNumber: true })}
                    placeholder="0.00"
                  />
                  {errors.amount && (
                    <p className="text-sm text-red-600">{errors.amount.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentDays">Prazo em Dias (opcional)</Label>
                <Input
                  id="paymentDays"
                  type="number"
                  step="1"
                  min="1"
                  {...register('paymentDays', { valueAsNumber: true })}
                  placeholder="Ex: 30, 60, 90"
                />
                <p className="text-xs text-gray-600">
                  Número de dias para pagamento a partir da data da venda
                </p>
                {errors.paymentDays && (
                  <p className="text-sm text-red-600">{errors.paymentDays.message}</p>
                )}
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-4 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  className="w-full sm:w-auto"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="bg-[#00B299] hover:bg-[#00B299]/90 text-white w-full sm:w-auto"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Salvando...' : 'Lançar Receita'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}





