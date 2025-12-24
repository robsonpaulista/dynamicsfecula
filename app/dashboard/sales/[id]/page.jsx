'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ArrowLeft, ShoppingCart, Calendar, User, Package, DollarSign, Loader2, Edit, X, Trash2, CheckCircle, Truck, FileText, Printer } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'
import { saveSalesOrderPDF, printSalesOrder } from '@/lib/pdf'

export default function SalesDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [salesOrder, setSalesOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editingAccountReceivable, setEditingAccountReceivable] = useState(null)
  const [editingAccountData, setEditingAccountData] = useState({ description: '', dueDate: '', amount: '' })
  const [savingAccount, setSavingAccount] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState(null)
  const [deliveringOrder, setDeliveringOrder] = useState(false)

  const loadSalesOrder = useCallback(async () => {
    try {
      const response = await api.get(`/sales/${params.id}`)
      setSalesOrder(response.data.data)
    } catch (error) {
      toast({
        title: 'Erro',
        description: error.response?.data?.error?.message || 'Erro ao carregar pedido',
        variant: 'destructive',
      })
      router.push('/dashboard/sales')
    } finally {
      setLoading(false)
    }
  }, [params.id, router, toast])

  useEffect(() => {
    loadSalesOrder()
  }, [loadSalesOrder])

  const getStatusColor = (status) => {
    const colors = {
      DRAFT: 'bg-gray-100 text-gray-800',
      CONFIRMED: 'bg-[#00B299]/10 text-[#00B299]',
      DELIVERED: 'bg-[#00B299]/10 text-[#00B299]',
      CANCELED: 'bg-red-100 text-red-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusLabel = (status) => {
    const labels = {
      DRAFT: 'Rascunho',
      CONFIRMED: 'Confirmado',
      DELIVERED: 'Entregue',
      CANCELED: 'Cancelado',
    }
    return labels[status] || status
  }

  const openEditAccountReceivableModal = (account) => {
    setEditingAccountReceivable(account.id)
    setEditingAccountData({
      description: account.description,
      dueDate: account.dueDate ? new Date(account.dueDate).toISOString().split('T')[0] : '',
      amount: Number(account.amount).toString(),
    })
  }

  const closeEditAccountReceivableModal = () => {
    setEditingAccountReceivable(null)
    setEditingAccountData({ description: '', dueDate: '', amount: '' })
  }

  const handleUpdateAccountReceivable = async () => {
    if (!editingAccountReceivable || !salesOrder) return

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
    const totalOrder = Number(salesOrder.total)
    const otherAccountsTotal = salesOrder.accountsReceivable
      ?.filter(ar => ar.status === 'OPEN' && ar.id !== editingAccountReceivable)
      .reduce((sum, ar) => sum + Number(ar.amount), 0) || 0
    const totalAllAccounts = otherAccountsTotal + newAmount

    if (totalAllAccounts > totalOrder + 0.01) {
      const available = totalOrder - otherAccountsTotal
      toast({
        title: 'Erro',
        description: `O valor total das contas a receber (R$ ${totalAllAccounts.toFixed(2)}) excede o total do pedido (R$ ${totalOrder.toFixed(2)}). Já existem outras contas a receber no valor de R$ ${otherAccountsTotal.toFixed(2)}. Valor disponível: R$ ${available > 0 ? available.toFixed(2) : '0,00'}`,
        variant: 'destructive',
      })
      return
    }

    setSavingAccount(true)
    try {
      await api.put(`/finance/ar/${editingAccountReceivable}`, {
        description: editingAccountData.description,
        dueDate: editingAccountData.dueDate,
        amount: newAmount,
      })
      toast({
        title: 'Sucesso!',
        description: 'Conta a receber atualizada com sucesso',
      })
      loadSalesOrder()
      closeEditAccountReceivableModal()
    } catch (error) {
      toast({
        title: 'Erro',
        description: error.response?.data?.error?.message || 'Erro ao atualizar conta a receber',
        variant: 'destructive',
      })
    } finally {
      setSavingAccount(false)
    }
  }

  const handleDeleteAccountReceivable = async (accountId) => {
    if (!confirm('Deseja realmente excluir esta conta a receber?')) {
      return
    }

    setDeletingAccount(accountId)
    try {
      await api.delete(`/finance/ar/${accountId}`)
      toast({
        title: 'Sucesso!',
        description: 'Conta a receber excluída com sucesso',
      })
      loadSalesOrder()
    } catch (error) {
      toast({
        title: 'Erro',
        description: error.response?.data?.error?.message || 'Erro ao excluir conta a receber',
        variant: 'destructive',
      })
    } finally {
      setDeletingAccount(null)
    }
  }

  const handleDeliverOrder = async () => {
    if (!confirm('Deseja confirmar a entrega deste pedido? O estoque será atualizado automaticamente.')) {
      return
    }

    setDeliveringOrder(true)
    try {
      await api.post(`/sales/${params.id}/deliver`)
      toast({
        title: 'Sucesso!',
        description: 'Pedido confirmado e estoque atualizado com sucesso',
      })
      loadSalesOrder()
    } catch (error) {
      toast({
        title: 'Erro',
        description: error.response?.data?.error?.message || 'Erro ao confirmar pedido',
        variant: 'destructive',
      })
    } finally {
      setDeliveringOrder(false)
    }
  }

  if (loading) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-green-600" />
          </div>
        </div>
      </div>
    )
  }

  if (!salesOrder) {
    return null
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <Button variant="ghost" asChild className="hover:bg-[#00B299]/10">
            <Link href="/dashboard/sales">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Link>
          </Button>
          <div className="flex gap-2 ml-auto">
            <Button
              variant="outline"
              onClick={() => saveSalesOrderPDF(salesOrder)}
              className="hover:bg-[#00B299]/10 hover:border-[#00B299] transition-all"
            >
              <FileText className="h-4 w-4 mr-2" />
              Salvar PDF
            </Button>
            <Button
              variant="outline"
              onClick={() => printSalesOrder(salesOrder)}
              className="hover:bg-[#00B299]/10 hover:border-[#00B299] transition-all"
            >
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Informações Principais */}
          <div className="lg:col-span-2 space-y-4 md:space-y-6">
            <Card className="gradient-card border-green-100/50 shadow-glow-lg">
              <CardHeader>
                <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2 break-words">
                      Pedido #{salesOrder.id.slice(0, 8)}
                    </CardTitle>
                    <p className="text-gray-600 break-words">{salesOrder.customer?.name}</p>
                  </div>
                  <span className={`px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm whitespace-nowrap flex-shrink-0 ${getStatusColor(salesOrder.status)}`}>
                    {getStatusLabel(salesOrder.status)}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div className="space-y-2 p-3 md:p-4 bg-[#00B299]/5 rounded-xl">
                    <p className="text-sm text-gray-600 flex items-center gap-2">
                      <Calendar className="h-4 w-4 flex-shrink-0" />
                      Data da Venda
                    </p>
                    <p className="text-base md:text-lg font-semibold text-[#00B299] break-words">{formatDate(salesOrder.saleDate)}</p>
                  </div>
                  <div className="space-y-2 p-3 md:p-4 bg-[#00B299]/5 rounded-xl">
                    <p className="text-sm text-gray-600 flex items-center gap-2">
                      <User className="h-4 w-4 flex-shrink-0" />
                      Criado por
                    </p>
                    <p className="text-base md:text-lg font-semibold text-[#00B299] break-words">{salesOrder.createdBy?.name}</p>
                  </div>
                </div>
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
                  {salesOrder.items?.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4 p-4 bg-[#00B299]/5 rounded-xl border border-[#00B299]/20"
                    >
                      <div className="flex-1 min-w-0 w-full sm:w-auto">
                        <p className="font-semibold text-gray-900 break-words">{item.product?.name}</p>
                        <p className="text-xs text-gray-600">SKU: {item.product?.sku}</p>
                        <p className="text-sm text-gray-600 mt-1 break-words">
                          {Number(item.quantity)} {item.product?.unit} × {formatCurrency(Number(item.unitPrice))}
                        </p>
                      </div>
                      <div className="text-left sm:text-right w-full sm:w-auto flex-shrink-0">
                        <p className="text-base sm:text-lg font-bold text-[#00B299] whitespace-nowrap">{formatCurrency(Number(item.total))}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <span className="text-lg sm:text-xl font-bold text-gray-900">Total:</span>
                  <span className="text-xl sm:text-2xl md:text-3xl font-bold text-[#00B299] whitespace-nowrap">
                    {formatCurrency(salesOrder.total)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Contas a Receber */}
            {salesOrder.accountsReceivable && salesOrder.accountsReceivable.length > 0 && (
              <Card className="gradient-card border-[#00B299]/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#00B299] flex items-center justify-center">
                      <DollarSign className="h-4 w-4 text-white" />
                    </div>
                    Contas a Receber
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {salesOrder.accountsReceivable.map((ar) => (
                      <div
                        key={ar.id}
                        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-4 bg-[#00B299]/5 rounded-xl border border-[#00B299]/20"
                      >
                        <div className="flex-1 min-w-0 w-full sm:w-auto">
                          <p className="font-semibold text-gray-900 break-words">{ar.description}</p>
                          <p className="text-xs text-gray-600 mt-1 break-words">
                            Vencimento: {formatDate(ar.dueDate)} • Status: {ar.status}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                          <div className="text-left sm:text-right flex-shrink-0">
                            <p className="text-base sm:text-lg font-bold text-[#00B299] whitespace-nowrap">{formatCurrency(Number(ar.amount))}</p>
                          </div>
                          {ar.status === 'OPEN' && (
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditAccountReceivableModal(ar)}
                                className="h-8 w-8 p-0 hover:bg-[#00B299]/10"
                                title="Editar conta a receber"
                              >
                                <Edit className="h-4 w-4 text-[#00B299]" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteAccountReceivable(ar.id)}
                                disabled={deletingAccount === ar.id}
                                className="h-8 w-8 p-0 hover:bg-[#00B299]/20 text-[#00B299] hover:text-[#00B299]"
                                title="Excluir conta a receber"
                              >
                                {deletingAccount === ar.id ? (
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

            {/* Entregar Pedido */}
            {salesOrder.status !== 'DELIVERED' && salesOrder.status !== 'CANCELED' && (
              <Card className="gradient-card border-emerald-100/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#00B299] flex items-center justify-center">
                      <Truck className="h-4 w-4 text-white" />
                    </div>
                    Entregar Pedido
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    Ao confirmar a entrega do pedido, o estoque será atualizado automaticamente com a baixa dos produtos vendidos.
                  </p>
                  <Button
                    onClick={handleDeliverOrder}
                    disabled={deliveringOrder}
                    className="w-full bg-[#00B299] hover:shadow-glow-lg transition-all"
                  >
                    {deliveringOrder ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Confirmando...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Confirmar Entrega
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4 md:space-y-6">
            {/* Informações */}
            <Card className="gradient-card border-gray-100/50">
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Informações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs text-gray-600">Criado em</p>
                  <p className="text-sm font-medium text-gray-900 break-words">
                    {formatDate(salesOrder.createdAt)}
                  </p>
                </div>
                {salesOrder.updatedAt && (
                  <div>
                    <p className="text-xs text-gray-600">Atualizado em</p>
                    <p className="text-sm font-medium text-gray-900 break-words">
                      {formatDate(salesOrder.updatedAt)}
                    </p>
                  </div>
                )}
                {salesOrder.customer?.email && (
                  <div>
                    <p className="text-xs text-gray-600">Email do Cliente</p>
                    <p className="text-sm font-medium text-gray-900 break-all">{salesOrder.customer.email}</p>
                  </div>
                )}
                {salesOrder.customer?.phone && (
                  <div>
                    <p className="text-xs text-gray-600">Telefone do Cliente</p>
                    <p className="text-sm font-medium text-gray-900 break-words">{salesOrder.customer.phone}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Modal de Edição de Conta a Receber */}
      {editingAccountReceivable && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Editar Conta a Receber</CardTitle>
                <Button variant="ghost" size="icon" onClick={closeEditAccountReceivableModal}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-ar-description">Descrição *</Label>
                <Input
                  id="edit-ar-description"
                  type="text"
                  value={editingAccountData.description}
                  onChange={(e) => setEditingAccountData({ ...editingAccountData, description: e.target.value })}
                  placeholder="Descrição da conta"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-ar-dueDate">Data de Vencimento *</Label>
                <Input
                  id="edit-ar-dueDate"
                  type="date"
                  value={editingAccountData.dueDate}
                  onChange={(e) => setEditingAccountData({ ...editingAccountData, dueDate: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-ar-amount">Valor *</Label>
                <Input
                  id="edit-ar-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={editingAccountData.amount}
                  onChange={(e) => setEditingAccountData({ ...editingAccountData, amount: e.target.value })}
                  placeholder="0.00"
                />
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-4 pt-4 border-t">
                <Button variant="outline" onClick={closeEditAccountReceivableModal} className="w-full sm:w-auto">
                  Cancelar
                </Button>
                <Button onClick={handleUpdateAccountReceivable} disabled={savingAccount} className="gradient-primary w-full sm:w-auto">
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








