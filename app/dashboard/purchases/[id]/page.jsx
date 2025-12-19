'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ArrowLeft, ShoppingCart, Calendar, User, Package, DollarSign, Plus, Loader2, Trash2, CheckCircle, Edit, X } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'

export default function PurchaseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [purchaseOrder, setPurchaseOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [creatingAccount, setCreatingAccount] = useState(false)
  const [receivingOrder, setReceivingOrder] = useState(false)
  const [installments, setInstallments] = useState([
    { dueDate: '', amount: '', description: '' }
  ])
  const [editingOrder, setEditingOrder] = useState(false)
  const [editingAccountPayable, setEditingAccountPayable] = useState(null)
  const [editingAccountData, setEditingAccountData] = useState({ description: '', dueDate: '', amount: '' })
  const [savingOrder, setSavingOrder] = useState(false)
  const [savingAccount, setSavingAccount] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState(null)
  const [suppliers, setSuppliers] = useState([])
  const [products, setProducts] = useState([])
  const [orderFormData, setOrderFormData] = useState({
    supplierId: '',
    issueDate: '',
    notes: '',
    items: []
  })

  const loadPurchaseOrder = useCallback(async () => {
    try {
      const response = await api.get(`/purchases/${params.id}`)
      setPurchaseOrder(response.data.data)
    } catch (error) {
      toast({
        title: 'Erro',
        description: error.response?.data?.error?.message || 'Erro ao carregar pedido',
        variant: 'destructive',
      })
      router.push('/dashboard/purchases')
    } finally {
      setLoading(false)
    }
  }, [params.id, router, toast])

  const loadSuppliersAndProducts = useCallback(async () => {
    try {
      const [suppliersRes, productsRes] = await Promise.all([
        api.get('/suppliers', { params: { limit: 100, isActive: 'true' } }),
        api.get('/products', { params: { limit: 100, isActive: 'true' } }),
      ])
      setSuppliers(suppliersRes.data.data)
      setProducts(productsRes.data.data)
    } catch (error) {
      console.error('Erro ao carregar fornecedores e produtos:', error)
    }
  }, [])

  useEffect(() => {
    loadPurchaseOrder()
    loadSuppliersAndProducts()
  }, [loadPurchaseOrder, loadSuppliersAndProducts])

  useEffect(() => {
    if (purchaseOrder) {
      // Inicializar com uma parcela com valor total e data padrão (30 dias)
      const defaultDueDate = new Date()
      defaultDueDate.setDate(defaultDueDate.getDate() + 30)
      setInstallments([{
        dueDate: defaultDueDate.toISOString().split('T')[0],
        amount: purchaseOrder.total.toString(),
        description: `Pedido de compra #${purchaseOrder.id.slice(0, 8)}`
      }])
    }
  }, [purchaseOrder])


  const getStatusColor = (status) => {
    const colors = {
      DRAFT: 'bg-gray-100 text-gray-800',
      APPROVED: 'bg-[#00B299]/10 text-[#00B299]',
      RECEIVED: 'bg-[#00B299]/10 text-[#00B299]',
      CANCELED: 'bg-red-100 text-red-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusLabel = (status) => {
    const labels = {
      DRAFT: 'Rascunho',
      APPROVED: 'Aprovado',
      RECEIVED: 'Recebido',
      CANCELED: 'Cancelado',
    }
    return labels[status] || status
  }

  const addInstallment = () => {
    const defaultDueDate = new Date()
    defaultDueDate.setDate(defaultDueDate.getDate() + 30)
    setInstallments([...installments, {
      dueDate: defaultDueDate.toISOString().split('T')[0],
      amount: '',
      description: ''
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

  const handleCreateAccountPayable = async () => {
    // Validar parcelas
    const validInstallments = installments.filter(inst => inst.dueDate && inst.amount)
    
    if (validInstallments.length === 0) {
      toast({
        title: 'Erro',
        description: 'Adicione pelo menos uma parcela com data e valor',
        variant: 'destructive',
      })
      return
    }

    // Converter valores para número
    const installmentsData = validInstallments.map(inst => ({
      dueDate: inst.dueDate,
      amount: parseFloat(inst.amount) || 0,
      description: inst.description || undefined,
    }))

    // Validar valores
    const totalAmount = installmentsData.reduce((sum, inst) => sum + inst.amount, 0)
    if (totalAmount <= 0) {
      toast({
        title: 'Erro',
        description: 'O valor total das parcelas deve ser maior que zero',
        variant: 'destructive',
      })
      return
    }

    // Validar se não excede o total do pedido (considerando contas existentes)
    if (!purchaseOrder) return
    
    const totalOrder = Number(purchaseOrder.total)
    const totalExistingAP = purchaseOrder.accountsPayable
      ?.filter(ap => ap.status === 'OPEN')
      .reduce((sum, ap) => sum + Number(ap.amount), 0) || 0
    const totalNewInstallments = installmentsData.reduce((sum, inst) => sum + inst.amount, 0)
    const totalAllAccounts = totalExistingAP + totalNewInstallments

    if (totalAllAccounts > totalOrder + 0.01) {
      const available = totalOrder - totalExistingAP
      toast({
        title: 'Erro',
        description: `A soma total das contas a pagar (R$ ${totalAllAccounts.toFixed(2)}) excede o total do pedido (R$ ${totalOrder.toFixed(2)}). Já existem contas a pagar no valor de R$ ${totalExistingAP.toFixed(2)}. Valor disponível: R$ ${available > 0 ? available.toFixed(2) : '0,00'}`,
        variant: 'destructive',
      })
      return
    }

    setCreatingAccount(true)
    try {
      await api.post(`/purchases/${params.id}/accounts-payable`, {
        installments: installmentsData,
      })
      toast({
        title: 'Sucesso!',
        description: `${validInstallments.length} conta(s) a pagar criada(s) com sucesso`,
      })
      loadPurchaseOrder() // Recarregar dados
      // Resetar formulário
      const defaultDueDate = new Date()
      defaultDueDate.setDate(defaultDueDate.getDate() + 30)
      const remainingAmount = totalOrder - (totalExistingAP + totalNewInstallments)
      setInstallments([{
        dueDate: defaultDueDate.toISOString().split('T')[0],
        amount: remainingAmount > 0 ? remainingAmount.toString() : '',
        description: `Pedido de compra #${purchaseOrder.id.slice(0, 8)}`
      }])
    } catch (error) {
      toast({
        title: 'Erro',
        description: error.response?.data?.error?.message || 'Erro ao criar contas a pagar',
        variant: 'destructive',
      })
    } finally {
      setCreatingAccount(false)
    }
  }

  const calculateRemainingAmount = () => {
    if (!purchaseOrder) return 0
    const totalOrder = Number(purchaseOrder.total)
    const totalExistingAP = purchaseOrder.accountsPayable
      ?.filter(ap => ap.status === 'OPEN')
      .reduce((sum, ap) => sum + Number(ap.amount), 0) || 0
    const totalNewInstallments = installments.reduce((sum, inst) => sum + (parseFloat(inst.amount) || 0), 0)
    return totalOrder - totalExistingAP - totalNewInstallments
  }

  const handleReceiveOrder = async () => {
    if (!confirm('Deseja receber este pedido? O estoque será atualizado automaticamente.')) {
      return
    }

    setReceivingOrder(true)
    try {
      await api.post(`/purchases/${params.id}/receive`, {
        receiptDate: new Date().toISOString(),
      })
      toast({
        title: 'Sucesso!',
        description: 'Pedido recebido e estoque atualizado com sucesso',
      })
      loadPurchaseOrder() // Recarregar dados
    } catch (error) {
      toast({
        title: 'Erro',
        description: error.response?.data?.error?.message || 'Erro ao receber pedido',
        variant: 'destructive',
      })
    } finally {
      setReceivingOrder(false)
    }
  }

  const openEditOrderModal = () => {
    if (purchaseOrder) {
      setOrderFormData({
        supplierId: purchaseOrder.supplierId,
        issueDate: purchaseOrder.issueDate ? new Date(purchaseOrder.issueDate).toISOString().split('T')[0] : '',
        notes: purchaseOrder.notes || '',
        items: purchaseOrder.items.map(item => ({
          id: item.id,
          productId: item.productId,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
        }))
      })
      setEditingOrder(true)
    }
  }

  const closeEditOrderModal = () => {
    setEditingOrder(false)
    setOrderFormData({ supplierId: '', issueDate: '', notes: '', items: [] })
  }

  const handleUpdateOrder = async () => {
    setSavingOrder(true)
    try {
      const updateData = {
        supplierId: orderFormData.supplierId,
        issueDate: orderFormData.issueDate,
        notes: orderFormData.notes,
        items: orderFormData.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      }

      await api.put(`/purchases/${params.id}`, updateData)
      toast({
        title: 'Sucesso!',
        description: 'Pedido atualizado com sucesso',
      })
      loadPurchaseOrder()
      closeEditOrderModal()
    } catch (error) {
      toast({
        title: 'Erro',
        description: error.response?.data?.error?.message || 'Erro ao atualizar pedido',
        variant: 'destructive',
      })
    } finally {
      setSavingOrder(false)
    }
  }

  const addOrderItem = () => {
    setOrderFormData({
      ...orderFormData,
      items: [...orderFormData.items, { productId: '', quantity: 1, unitPrice: 0 }]
    })
  }

  const removeOrderItem = (index) => {
    if (orderFormData.items.length > 1) {
      setOrderFormData({
        ...orderFormData,
        items: orderFormData.items.filter((_, i) => i !== index)
      })
    }
  }

  const updateOrderItem = (index, field, value) => {
    const updated = [...orderFormData.items]
    updated[index] = { ...updated[index], [field]: field === 'quantity' || field === 'unitPrice' ? parseFloat(value) || 0 : value }
    setOrderFormData({ ...orderFormData, items: updated })
  }

  const openEditAccountPayableModal = (account) => {
    setEditingAccountPayable(account.id)
    setEditingAccountData({
      description: account.description,
      dueDate: account.dueDate ? new Date(account.dueDate).toISOString().split('T')[0] : '',
      amount: Number(account.amount).toString(),
    })
  }

  const closeEditAccountPayableModal = () => {
    setEditingAccountPayable(null)
    setEditingAccountData({ description: '', dueDate: '', amount: '' })
  }

  const handleUpdateAccountPayable = async () => {
    if (!editingAccountPayable || !purchaseOrder) return

    const newAmount = parseFloat(editingAccountData.amount)
    if (!newAmount || newAmount <= 0) {
      toast({
        title: 'Erro',
        description: 'O valor deve ser maior que zero',
        variant: 'destructive',
      })
      return
    }

    // Validar se não excede o total do pedido (considerando outras contas existentes)
    const totalOrder = Number(purchaseOrder.total)
    const currentAccount = purchaseOrder.accountsPayable?.find(ap => ap.id === editingAccountPayable)
    const otherAccountsTotal = purchaseOrder.accountsPayable
      ?.filter(ap => ap.status === 'OPEN' && ap.id !== editingAccountPayable)
      .reduce((sum, ap) => sum + Number(ap.amount), 0) || 0
    const totalAllAccounts = otherAccountsTotal + newAmount

    if (totalAllAccounts > totalOrder + 0.01) {
      const available = totalOrder - otherAccountsTotal
      toast({
        title: 'Erro',
        description: `O valor total das contas a pagar (R$ ${totalAllAccounts.toFixed(2)}) excede o total do pedido (R$ ${totalOrder.toFixed(2)}). Já existem outras contas a pagar no valor de R$ ${otherAccountsTotal.toFixed(2)}. Valor disponível: R$ ${available > 0 ? available.toFixed(2) : '0,00'}`,
        variant: 'destructive',
      })
      return
    }

    setSavingAccount(true)
    try {
      await api.put(`/finance/ap/${editingAccountPayable}`, {
        description: editingAccountData.description,
        dueDate: editingAccountData.dueDate,
        amount: newAmount,
      })
      toast({
        title: 'Sucesso!',
        description: 'Conta a pagar atualizada com sucesso',
      })
      loadPurchaseOrder()
      closeEditAccountPayableModal()
    } catch (error) {
      toast({
        title: 'Erro',
        description: error.response?.data?.error?.message || 'Erro ao atualizar conta a pagar',
        variant: 'destructive',
      })
    } finally {
      setSavingAccount(false)
    }
  }

  const handleDeleteAccountPayable = async (accountId) => {
    if (!confirm('Deseja realmente excluir esta conta a pagar?')) {
      return
    }

    setDeletingAccount(accountId)
    try {
      await api.delete(`/finance/ap/${accountId}`)
      toast({
        title: 'Sucesso!',
        description: 'Conta a pagar excluída com sucesso',
      })
      loadPurchaseOrder()
    } catch (error) {
      toast({
        title: 'Erro',
        description: error.response?.data?.error?.message || 'Erro ao excluir conta a pagar',
        variant: 'destructive',
      })
    } finally {
      setDeletingAccount(null)
    }
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

  if (!purchaseOrder) {
    return null
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Informações Principais */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="gradient-card border-[#00B299]/20 shadow-glow-lg">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                      Pedido #{purchaseOrder.id.slice(0, 8)}
                    </CardTitle>
                    <p className="text-gray-600">{purchaseOrder.supplier?.name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {purchaseOrder.status !== 'RECEIVED' && purchaseOrder.status !== 'CANCELED' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={openEditOrderModal}
                        className="hover:bg-[#00B299]/10"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                    )}
                    <span className={`px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm ${getStatusColor(purchaseOrder.status)}`}>
                      {getStatusLabel(purchaseOrder.status)}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 p-4 bg-[#00B299]/5 rounded-xl">
                    <p className="text-sm text-gray-600 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Data de Emissão
                    </p>
                    <p className="text-lg font-semibold text-[#00B299]">{formatDate(purchaseOrder.issueDate)}</p>
                  </div>
                  <div className="space-y-2 p-4 bg-[#00B299]/5 rounded-xl">
                    <p className="text-sm text-gray-600 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Criado por
                    </p>
                    <p className="text-lg font-semibold text-[#00B299]">{purchaseOrder.createdBy?.name}</p>
                  </div>
                </div>
                {purchaseOrder.notes && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-600 mb-1">Observações</p>
                    <p className="text-sm text-gray-900">{purchaseOrder.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Itens do Pedido */}
            <Card className="gradient-card border-purple-100/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#00B299] flex items-center justify-center">
                    <Package className="h-4 w-4 text-white" />
                  </div>
                  Itens do Pedido
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {purchaseOrder.items?.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-center p-4 bg-[#00B299]/5 rounded-xl border border-[#00B299]/20"
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{item.product?.name}</p>
                        <p className="text-xs text-gray-600">SKU: {item.product?.sku}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          {Number(item.quantity)} {item.product?.unit} × {formatCurrency(Number(item.unitPrice))}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-[#00B299]">{formatCurrency(Number(item.total))}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                  <span className="text-xl font-bold text-gray-900">Total:</span>
                  <span className="text-2xl md:text-3xl font-bold text-[#00B299]">
                    {formatCurrency(purchaseOrder.total)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Contas a Pagar */}
            {purchaseOrder.accountsPayable && purchaseOrder.accountsPayable.length > 0 && (
              <Card className="gradient-card border-red-100/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#FF8C00] flex items-center justify-center">
                      <DollarSign className="h-4 w-4 text-white" />
                    </div>
                    Contas a Pagar
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {purchaseOrder.accountsPayable.map((ap) => (
                      <div
                        key={ap.id}
                        className="flex justify-between items-center p-4 bg-[#FF8C00]/5 rounded-xl border border-[#FF8C00]/20"
                      >
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{ap.description}</p>
                          <p className="text-xs text-gray-600 mt-1">
                            Vencimento: {formatDate(ap.dueDate)} • Status: {ap.status}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-lg font-bold text-red-700">{formatCurrency(Number(ap.amount))}</p>
                          </div>
                          {ap.status === 'OPEN' && (
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditAccountPayableModal(ap)}
                                className="h-8 w-8 p-0 hover:bg-red-100"
                                title="Editar conta a pagar"
                              >
                                <Edit className="h-4 w-4 text-red-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteAccountPayable(ap.id)}
                                disabled={deletingAccount === ap.id}
                                className="h-8 w-8 p-0 hover:bg-red-200 text-red-600 hover:text-red-700"
                                title="Excluir conta a pagar"
                              >
                                {deletingAccount === ap.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Receber Pedido */}
            {purchaseOrder.status !== 'RECEIVED' && purchaseOrder.status !== 'CANCELED' && (
              <Card className="gradient-card border-green-100/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#00B299] flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                    Receber Pedido
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    Ao receber o pedido, o estoque será atualizado automaticamente com os produtos comprados.
                  </p>
                  <Button
                    onClick={handleReceiveOrder}
                    disabled={receivingOrder}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:shadow-glow-lg transition-all"
                  >
                    {receivingOrder ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Recebendo...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Receber Pedido
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Criar Contas a Pagar */}
            <Card className="gradient-card border-green-100/50 shadow-glow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-[#00B299] flex items-center justify-center">
                    <Plus className="h-5 w-5 text-white" />
                  </div>
                  Criar Contas a Pagar
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {installments.map((installment, index) => (
                    <Card key={index} className="p-4 bg-white border-green-200">
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
                        <div className="space-y-2">
                          <Label htmlFor={`dueDate-${index}`} className="text-xs">Data de Vencimento *</Label>
                          <Input
                            id={`dueDate-${index}`}
                            type="date"
                            value={installment.dueDate}
                            onChange={(e) => updateInstallment(index, 'dueDate', e.target.value)}
                            className="bg-white text-sm"
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
                            className="bg-white text-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`description-${index}`} className="text-xs">Descrição</Label>
                          <Input
                            id={`description-${index}`}
                            type="text"
                            value={installment.description}
                            onChange={(e) => updateInstallment(index, 'description', e.target.value)}
                            placeholder={`Parcela ${index + 1}`}
                            className="bg-white text-sm"
                          />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={addInstallment}
                  className="w-full border-[#00B299] text-[#00B299] hover:bg-[#00B299]/10"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Parcela
                </Button>

                {purchaseOrder && (() => {
                  const totalOrder = Number(purchaseOrder.total)
                  const totalExistingAP = purchaseOrder.accountsPayable
                    ?.filter(ap => ap.status === 'OPEN')
                    .reduce((sum, ap) => sum + Number(ap.amount), 0) || 0
                  const totalNewInstallments = installments.reduce((sum, inst) => sum + (parseFloat(inst.amount) || 0), 0)
                  const totalAllAccounts = totalExistingAP + totalNewInstallments
                  const remaining = totalOrder - totalAllAccounts
                  
                  return (
                    <div className="p-3 bg-[#00B299]/5 rounded-lg border border-[#00B299]/20">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Total do Pedido:</span>
                        <span className="font-semibold">{formatCurrency(totalOrder)}</span>
                      </div>
                      {totalExistingAP > 0 && (
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">Contas a Pagar Existentes:</span>
                          <span className="font-semibold text-[#FF8C00]">
                            {formatCurrency(totalExistingAP)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Total das Novas Parcelas:</span>
                        <span className="font-semibold">
                          {formatCurrency(totalNewInstallments)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600 font-medium">Total Geral das Contas:</span>
                        <span className="font-semibold">
                          {formatCurrency(totalAllAccounts)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm font-semibold pt-2 border-t border-[#00B299]/20">
                        <span className={remaining >= 0 ? 'text-[#00B299]' : 'text-red-700'}>
                          {remaining >= 0 ? 'Restante:' : 'Excedente:'}
                        </span>
                        <span className={remaining >= 0 ? 'text-[#00B299]' : 'text-red-700'}>
                          {formatCurrency(Math.abs(remaining))}
                        </span>
                      </div>
                    </div>
                  )
                })()}

                <Button
                  onClick={handleCreateAccountPayable}
                  disabled={creatingAccount || installments.length === 0}
                  className="w-full gradient-primary hover:shadow-glow-lg transition-all"
                >
                  {creatingAccount ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    <>
                      <DollarSign className="mr-2 h-4 w-4" />
                      Criar {installments.length > 1 ? `${installments.length} Contas` : 'Conta'} a Pagar
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Informações */}
            <Card className="gradient-card border-gray-100/50">
              <CardHeader>
                <CardTitle className="text-lg">Informações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs text-gray-600">Criado em</p>
                  <p className="text-sm font-medium text-gray-900">
                    {formatDate(purchaseOrder.createdAt)}
                  </p>
                </div>
                {purchaseOrder.updatedAt && (
                  <div>
                    <p className="text-xs text-gray-600">Atualizado em</p>
                    <p className="text-sm font-medium text-gray-900">
                      {formatDate(purchaseOrder.updatedAt)}
                    </p>
                  </div>
                )}
                {purchaseOrder.supplier?.email && (
                  <div>
                    <p className="text-xs text-gray-600">Email do Fornecedor</p>
                    <p className="text-sm font-medium text-gray-900">{purchaseOrder.supplier.email}</p>
                  </div>
                )}
                {purchaseOrder.supplier?.phone && (
                  <div>
                    <p className="text-xs text-gray-600">Telefone do Fornecedor</p>
                    <p className="text-sm font-medium text-gray-900">{purchaseOrder.supplier.phone}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Modal de Edição do Pedido */}
      {editingOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl">Editar Pedido</CardTitle>
                <Button variant="ghost" size="icon" onClick={closeEditOrderModal}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-supplierId">Fornecedor *</Label>
                  <select
                    id="edit-supplierId"
                    value={orderFormData.supplierId}
                    onChange={(e) => setOrderFormData({ ...orderFormData, supplierId: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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
                  <Label htmlFor="edit-issueDate">Data da Compra *</Label>
                  <Input
                    id="edit-issueDate"
                    type="date"
                    value={orderFormData.issueDate}
                    onChange={(e) => setOrderFormData({ ...orderFormData, issueDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>Itens da Compra *</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addOrderItem}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Item
                  </Button>
                </div>

                {orderFormData.items.map((item, index) => (
                  <Card key={index} className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="md:col-span-2 space-y-2">
                        <Label>Produto *</Label>
                        <select
                          value={item.productId}
                          onChange={(e) => updateOrderItem(index, 'productId', e.target.value)}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                          <option value="">Selecione um produto</option>
                          {products.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.name} ({product.sku})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label>Quantidade *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={item.quantity}
                          onChange={(e) => updateOrderItem(index, 'quantity', e.target.value)}
                          placeholder="0"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Preço Unit. *</Label>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) => updateOrderItem(index, 'unitPrice', e.target.value)}
                            placeholder="0.00"
                            className="flex-1"
                          />
                          {orderFormData.items.length > 1 && (
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              onClick={() => removeOrderItem(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                      Subtotal: {formatCurrency((item.quantity || 0) * (item.unitPrice || 0))}
                    </div>
                  </Card>
                ))}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-notes">Observações</Label>
                <textarea
                  id="edit-notes"
                  value={orderFormData.notes}
                  onChange={(e) => setOrderFormData({ ...orderFormData, notes: e.target.value })}
                  rows={3}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Observações sobre o pedido..."
                />
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t">
                <Button variant="outline" onClick={closeEditOrderModal}>
                  Cancelar
                </Button>
                <Button onClick={handleUpdateOrder} disabled={savingOrder} className="gradient-primary">
                  {savingOrder ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Salvar
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de Edição de Conta a Pagar */}
      {editingAccountPayable && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Editar Conta a Pagar</CardTitle>
                <Button variant="ghost" size="icon" onClick={closeEditAccountPayableModal}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-ap-description">Descrição *</Label>
                <Input
                  id="edit-ap-description"
                  type="text"
                  value={editingAccountData.description}
                  onChange={(e) => setEditingAccountData({ ...editingAccountData, description: e.target.value })}
                  placeholder="Descrição da conta"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-ap-dueDate">Data de Vencimento *</Label>
                <Input
                  id="edit-ap-dueDate"
                  type="date"
                  value={editingAccountData.dueDate}
                  onChange={(e) => setEditingAccountData({ ...editingAccountData, dueDate: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-ap-amount">Valor *</Label>
                <Input
                  id="edit-ap-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={editingAccountData.amount}
                  onChange={(e) => setEditingAccountData({ ...editingAccountData, amount: e.target.value })}
                  placeholder="0.00"
                />
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t">
                <Button variant="outline" onClick={closeEditAccountPayableModal}>
                  Cancelar
                </Button>
                <Button onClick={handleUpdateAccountPayable} disabled={savingAccount} className="gradient-primary">
                  {savingAccount ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Salvar
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

