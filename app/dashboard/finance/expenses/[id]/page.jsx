'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, Save, Trash2, FileImage, X } from 'lucide-react'
import Link from 'next/link'

const MAX_RECEIPT_SIZE_MB = 2
const MAX_RECEIPT_BYTES = MAX_RECEIPT_SIZE_MB * 1024 * 1024
const ACCEPT_IMAGES = 'image/jpeg,image/png,image/webp,image/gif'
const MAX_IMAGE_DIMENSION = 1200
const JPEG_QUALITY = 0.82

function compressImageAsBase64(file) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const w = img.width
      const h = img.height
      let targetW = w
      let targetH = h
      if (w > MAX_IMAGE_DIMENSION || h > MAX_IMAGE_DIMENSION) {
        if (w > h) {
          targetW = MAX_IMAGE_DIMENSION
          targetH = Math.round((h * MAX_IMAGE_DIMENSION) / w)
        } else {
          targetH = MAX_IMAGE_DIMENSION
          targetW = Math.round((w * MAX_IMAGE_DIMENSION) / h)
        }
      }
      const canvas = document.createElement('canvas')
      canvas.width = targetW
      canvas.height = targetH
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, targetW, targetH)
      try {
        resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY))
      } catch (e) {
        reject(e)
      }
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Falha ao carregar imagem'))
    }
    img.src = url
  })
}

const expenseSchema = z.object({
  description: z.string().min(1, 'Descrição é obrigatória'),
  supplierId: z.string().optional().nullable(),
  salesOrderId: z.string().optional().nullable(),
  categoryId: z.string().min(1, 'Categoria é obrigatória'),
  dueDate: z.string().min(1, 'Data de vencimento é obrigatória'),
  amount: z.number().min(0.01, 'Valor deve ser maior que zero'),
})

export default function EditExpensePage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [expense, setExpense] = useState(null)
  const [suppliers, setSuppliers] = useState([])
  const [salesOrders, setSalesOrders] = useState([])
  const [categories, setCategories] = useState([])
  const [loadingData, setLoadingData] = useState(true)
  const [receiptBase64, setReceiptBase64] = useState(null)
  const [receiptFileName, setReceiptFileName] = useState(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(expenseSchema),
  })

  useEffect(() => {
    if (!id) return
    loadData()
  }, [id])

  const loadData = async () => {
    try {
      setLoadingData(true)
      const [expenseRes, suppliersRes, salesOrdersRes, categoriesRes] = await Promise.all([
        api.get(`/finance/ap/${id}`),
        api.get('/suppliers', { params: { isActive: 'true', limit: 100 } }),
        api.get('/sales', { params: { limit: 100 } }),
        api.get('/categories', { params: { kind: 'EXPENSE', limit: 100 } }),
      ])
      const ap = expenseRes.data.data
      setExpense(ap)
      setReceiptBase64(ap.receiptBase64 || null)
      setReceiptFileName(ap.receiptBase64 ? 'Comprovante anexado' : null)
      setSuppliers(suppliersRes.data.data || [])
      setSalesOrders(salesOrdersRes.data.data || [])
      setCategories(categoriesRes.data.data || [])

      const dueDate = ap.dueDate ? new Date(ap.dueDate).toISOString().split('T')[0] : ''
      reset({
        description: ap.description || '',
        supplierId: ap.supplierId || '',
        salesOrderId: ap.salesOrderId || '',
        categoryId: ap.categoryId || '',
        dueDate,
        amount: Number(ap.amount) || 0,
      })
    } catch (error) {
      if (error.response?.status === 404) {
        toast({ title: 'Despesa não encontrada', variant: 'destructive' })
        router.push('/dashboard/finance')
        return
      }
      console.error('Erro ao carregar despesa:', error)
      toast({
        title: 'Erro',
        description: error.response?.data?.error?.message || 'Erro ao carregar despesa',
        variant: 'destructive',
      })
    } finally {
      setLoadingData(false)
    }
  }

  const handleReceiptChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > MAX_RECEIPT_BYTES) {
      toast({
        title: 'Arquivo grande',
        description: `O comprovante deve ter no máximo ${MAX_RECEIPT_SIZE_MB} MB.`,
        variant: 'destructive',
      })
      e.target.value = ''
      return
    }
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Formato inválido', description: 'Envie uma imagem (JPG, PNG, WebP ou GIF).', variant: 'destructive' })
      e.target.value = ''
      return
    }
    compressImageAsBase64(file)
      .then((dataUrl) => {
        setReceiptBase64(dataUrl)
        setReceiptFileName(file.name)
      })
      .catch(() => {
        toast({ title: 'Erro', description: 'Não foi possível processar a imagem.', variant: 'destructive' })
      })
    e.target.value = ''
  }

  const removeReceipt = () => {
    setReceiptBase64(null)
    setReceiptFileName(null)
  }

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      await api.put(`/finance/ap/${id}`, {
        description: data.description,
        supplierId: data.supplierId || null,
        salesOrderId: data.salesOrderId || null,
        categoryId: data.categoryId,
        dueDate: data.dueDate,
        amount: data.amount,
        receiptBase64: receiptBase64 || null,
      })
      toast({
        title: 'Sucesso!',
        description: 'Despesa atualizada com sucesso',
      })
      router.push('/dashboard/finance')
    } catch (error) {
      toast({
        title: 'Erro',
        description: error.response?.data?.error?.message || 'Erro ao atualizar despesa',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Deseja realmente excluir esta despesa? Esta ação não pode ser desfeita.')) return
    if (expense?.status === 'PAID') {
      toast({
        title: 'Não permitido',
        description: 'Não é possível excluir uma despesa já paga.',
        variant: 'destructive',
      })
      return
    }
    setDeleting(true)
    try {
      await api.delete(`/finance/ap/${id}`)
      toast({
        title: 'Despesa excluída',
        description: 'A despesa foi excluída com sucesso.',
      })
      router.push('/dashboard/finance')
    } catch (error) {
      toast({
        title: 'Erro',
        description: error.response?.data?.error?.message || 'Erro ao excluir despesa',
        variant: 'destructive',
      })
    } finally {
      setDeleting(false)
    }
  }

  if (loadingData || !expense) {
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

  const canEdit = expense.status === 'OPEN'
  const canDelete = expense.status === 'OPEN'

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

        <Card className="gradient-card border-red-100/50 shadow-glow-lg">
          <CardHeader>
            <CardTitle className="text-2xl text-[#FF8C00]">
              Editar Despesa
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Status: <span className={expense.status === 'PAID' ? 'text-green-600 font-medium' : 'text-amber-600'}>{expense.status === 'PAID' ? 'Paga' : 'Aberta'}</span>
              {!canEdit && ' — Despesas pagas não podem ser editadas.'}
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="description">Descrição *</Label>
                <Input
                  id="description"
                  {...register('description')}
                  placeholder="Ex: Aluguel, Energia, Salários..."
                  disabled={!canEdit}
                />
                {errors.description && (
                  <p className="text-sm text-red-600">{errors.description.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="supplierId">Fornecedor (opcional)</Label>
                  <select
                    id="supplierId"
                    {...register('supplierId')}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    disabled={!canEdit}
                  >
                    <option value="">Selecione um fornecedor</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
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
                    disabled={!canEdit}
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

              <div className="space-y-2">
                <Label htmlFor="salesOrderId">Venda relacionada (opcional)</Label>
                <select
                  id="salesOrderId"
                  {...register('salesOrderId')}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  disabled={!canEdit}
                >
                  <option value="">Selecione uma venda</option>
                  {salesOrders.map((sale) => {
                    const saleDate = sale.saleDate ? new Date(sale.saleDate).toLocaleDateString('pt-BR') : ''
                    const customerName = sale.customer?.name || ''
                    return (
                      <option key={sale.id} value={sale.id}>
                        Pedido #{sale.id.slice(0, 8)} - {customerName} - {saleDate}
                      </option>
                    )
                  })}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Data de Vencimento *</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    {...register('dueDate')}
                    disabled={!canEdit}
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
                    disabled={!canEdit}
                  />
                  {errors.amount && (
                    <p className="text-sm text-red-600">{errors.amount.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Comprovante de pagamento (opcional)</Label>
                <p className="text-xs text-gray-600">
                  Anexe uma foto ou imagem do comprovante. Máx. {MAX_RECEIPT_SIZE_MB} MB. Será salvo em base64.
                </p>
                {!receiptBase64 ? (
                  <label className={`flex items-center justify-center gap-2 h-24 rounded-lg border-2 border-dashed border-gray-300 transition-colors ${canEdit ? 'hover:border-[#FF8C00]/50 hover:bg-gray-50/50 cursor-pointer' : 'bg-gray-50'}`}>
                    <input
                      type="file"
                      accept={ACCEPT_IMAGES}
                      className="sr-only"
                      onChange={handleReceiptChange}
                      disabled={!canEdit}
                    />
                    <FileImage className="h-8 w-8 text-gray-400" />
                    <span className="text-sm text-gray-600">Clique para selecionar imagem</span>
                  </label>
                ) : (
                  <div className="flex flex-col sm:flex-row items-start gap-3 p-3 rounded-lg border border-gray-200 bg-gray-50">
                    <img
                      src={receiptBase64}
                      alt="Comprovante"
                      className="max-h-32 w-auto rounded object-contain border border-gray-200"
                    />
                    <div className="flex flex-col gap-2 flex-1 min-w-0">
                      <p className="text-sm text-gray-700 truncate" title={receiptFileName}>{receiptFileName}</p>
                      {canEdit && (
                        <Button type="button" variant="outline" size="sm" onClick={removeReceipt} className="text-red-600 border-red-200 hover:bg-red-50 w-fit">
                          <X className="h-4 w-4 mr-1" />
                          Remover comprovante
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row justify-between gap-2 sm:gap-4 pt-4 border-t">
                <div className="flex flex-col sm:flex-row gap-2">
                  {canEdit && (
                    <Button
                      type="submit"
                      disabled={loading}
                      className="bg-[#FF8C00] hover:bg-[#FF8C00]/90 text-white"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {loading ? 'Salvando...' : 'Salvar alterações'}
                    </Button>
                  )}
                  {canDelete && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleDelete}
                      disabled={deleting}
                      className="text-red-600 border-red-300 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {deleting ? 'Excluindo...' : 'Excluir despesa'}
                    </Button>
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/dashboard/finance')}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
