'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatCurrency, formatDate } from '@/lib/utils'
import { DollarSign, TrendingUp, TrendingDown, RefreshCw, CheckCircle, Loader2, Plus, Trash2, X } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

const AP_STATUS_FILTERS = [
  { value: '', label: 'Todos' },
  { value: 'OPEN', label: 'A pagar (aberto)' },
  { value: 'PAID', label: 'Pago' },
]

const AR_STATUS_FILTERS = [
  { value: '', label: 'Todos' },
  { value: 'OPEN', label: 'A receber (aberto)' },
  { value: 'RECEIVED', label: 'Recebido' },
]

export default function FinancePage() {
  const [accountsPayable, setAccountsPayable] = useState([])
  const [accountsReceivable, setAccountsReceivable] = useState([])
  const [summary, setSummary] = useState(null)
  const [investors, setInvestors] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('ap')
  const [apStatusFilter, setApStatusFilter] = useState('')
  const [arStatusFilter, setArStatusFilter] = useState('')
  const [processingAccount, setProcessingAccount] = useState(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState(null)
  const [paymentSources, setPaymentSources] = useState([{ investorId: '', amount: '' }])
  const [showReceiveModal, setShowReceiveModal] = useState(false)
  const [selectedARAccount, setSelectedARAccount] = useState(null)
  const [receivedAmount, setReceivedAmount] = useState('')
  const { toast } = useToast()

  const loadFinance = useCallback(async () => {
    try {
      setLoading(true)
      const apParams = { limit: 500 }
      const arParams = { limit: 500 }
      if (apStatusFilter) apParams.status = apStatusFilter
      if (arStatusFilter) arParams.status = arStatusFilter
      const [apResponse, arResponse, summaryResponse, investorsResponse] = await Promise.all([
        api.get('/finance/ap', { params: apParams }),
        api.get('/finance/ar', { params: arParams }),
        api.get('/finance/summary').catch(() => ({ data: { data: null } })),
        api.get('/investors', { params: { isActive: 'true', limit: 100 } }),
      ])
      setAccountsPayable(apResponse.data.data)
      setAccountsReceivable(arResponse.data.data)
      setSummary(summaryResponse.data?.data ?? null)
      setInvestors(investorsResponse.data.data || [])
    } catch (error) {
      console.error('Erro ao carregar financeiro:', error)
    } finally {
      setLoading(false)
    }
  }, [apStatusFilter, arStatusFilter])

  useEffect(() => {
    loadFinance()
  }, [loadFinance])

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const openAP = accountsPayable.filter((ap) => ap.status === 'OPEN')
  const openAR = accountsReceivable.filter((ar) => ar.status === 'OPEN')

  const totalAP = summary?.accountsPayable?.totalOpen ?? openAP.reduce((sum, ap) => sum + Number(ap.amount), 0)
  const countOpenAP = summary?.accountsPayable?.countOpen ?? openAP.length
  const totalPaidAP = summary?.accountsPayable?.totalPaid ?? accountsPayable
    .filter((ap) => ap.status === 'PAID')
    .reduce((sum, ap) => sum + Number(ap.amount), 0)
  const totalOverdueAP = summary?.accountsPayable?.totalOverdue ?? openAP
    .filter((ap) => new Date(ap.dueDate) < today)
    .reduce((sum, ap) => sum + Number(ap.amount), 0)
  const totalUpcomingAP = summary?.accountsPayable?.totalUpcoming ?? openAP
    .filter((ap) => new Date(ap.dueDate) >= today)
    .reduce((sum, ap) => sum + Number(ap.amount), 0)

  const totalAR = summary?.accountsReceivable?.totalOpen ?? openAR.reduce((sum, ar) => sum + Number(ar.amount), 0)
  const countOpenAR = summary?.accountsReceivable?.countOpen ?? openAR.length
  const totalReceivedAR = summary?.accountsReceivable?.totalReceived ?? accountsReceivable
    .filter((ar) => ar.status === 'RECEIVED')
    .reduce((sum, ar) => sum + Number(ar.amount), 0)
  const totalOverdueAR = summary?.accountsReceivable?.totalOverdue ?? openAR
    .filter((ar) => new Date(ar.dueDate) < today)
    .reduce((sum, ar) => sum + Number(ar.amount), 0)
  const totalUpcomingAR = summary?.accountsReceivable?.totalUpcoming ?? openAR
    .filter((ar) => new Date(ar.dueDate) >= today)
    .reduce((sum, ar) => sum + Number(ar.amount), 0)

  const openPaymentModal = (account) => {
    setSelectedAccount(account)
    setPaymentSources([{ investorId: '', amount: '' }])
    setShowPaymentModal(true)
  }

  const closePaymentModal = () => {
    setShowPaymentModal(false)
    setSelectedAccount(null)
    setPaymentSources([{ investorId: '', amount: '' }])
  }

  const addPaymentSource = () => {
    setPaymentSources([...paymentSources, { investorId: '', amount: '' }])
  }

  const removePaymentSource = (index) => {
    if (paymentSources.length > 1) {
      setPaymentSources(paymentSources.filter((_, i) => i !== index))
    }
  }

  const updatePaymentSource = (index, field, value) => {
    const updated = [...paymentSources]
    updated[index] = { ...updated[index], [field]: value }
    setPaymentSources(updated)
  }

  const handlePayAccount = async () => {
    if (!selectedAccount) return
    const validSources = paymentSources.filter((ps) => ps.amount && ps.investorId && ps.investorId !== '')
    if (validSources.length === 0) {
      toast({ title: 'Erro', description: 'Adicione pelo menos uma fonte pagadora', variant: 'destructive' })
      return
    }
    const totalSources = validSources.reduce((sum, ps) => sum + parseFloat(ps.amount || 0), 0)
    const accountAmount = Number(selectedAccount.amount)
    if (Math.abs(totalSources - accountAmount) > 0.01) {
      toast({
        title: 'Erro',
        description: `A soma das fontes (R$ ${totalSources.toFixed(2)}) deve ser igual ao valor (R$ ${accountAmount.toFixed(2)})`,
        variant: 'destructive',
      })
      return
    }
    setProcessingAccount(`ap-${selectedAccount.id}`)
    try {
      await api.post(`/finance/ap/${selectedAccount.id}/pay`, {
        paidAt: new Date().toISOString(),
        paymentSources: validSources.map((ps) => ({
          investorId: ps.investorId === 'CAIXA' ? undefined : ps.investorId,
          amount: parseFloat(ps.amount),
        })),
      })
      toast({ title: 'Sucesso!', description: 'Conta a pagar baixada com sucesso' })
      closePaymentModal()
      loadFinance()
    } catch (error) {
      toast({
        title: 'Erro',
        description: error.response?.data?.error?.message || 'Erro ao baixar conta a pagar',
        variant: 'destructive',
      })
    } finally {
      setProcessingAccount(null)
    }
  }

  const openReceiveModal = (account) => {
    setSelectedARAccount(account)
    setReceivedAmount(Number(account.amount).toFixed(2))
    setShowReceiveModal(true)
  }

  const closeReceiveModal = () => {
    setShowReceiveModal(false)
    setSelectedARAccount(null)
    setReceivedAmount('')
  }

  const handleReceiveAccount = async () => {
    if (!selectedARAccount) return
    const accountAmount = Number(selectedARAccount.amount)
    const receivedValue = parseFloat(receivedAmount || 0)
    if (receivedValue <= 0) {
      toast({ title: 'Erro', description: 'Valor deve ser maior que zero', variant: 'destructive' })
      return
    }
    if (receivedValue > accountAmount) {
      toast({ title: 'Erro', description: 'Valor não pode ser maior que o da conta', variant: 'destructive' })
      return
    }
    setProcessingAccount(`ar-${selectedARAccount.id}`)
    try {
      const response = await api.post(`/finance/ar/${selectedARAccount.id}/receive`, {
        receivedAt: new Date().toISOString(),
        receivedAmount: receivedValue,
      })
      toast({ title: 'Sucesso!', description: response.data.message || 'Conta a receber baixada com sucesso' })
      closeReceiveModal()
      loadFinance()
    } catch (error) {
      toast({
        title: 'Erro',
        description: error.response?.data?.error?.message || 'Erro ao baixar conta a receber',
        variant: 'destructive',
      })
    } finally {
      setProcessingAccount(null)
    }
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-[#00B299]">Financeiro</h1>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild className="hover:bg-red-50 border-red-200 text-red-700">
              <Link href="/dashboard/finance/expenses/new">
                <Plus className="h-4 w-4 mr-2" />
                Nova Despesa
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild className="hover:bg-green-50 border-green-200 text-green-700">
              <Link href="/dashboard/finance/income/new">
                <Plus className="h-4 w-4 mr-2" />
                Nova Receita
              </Link>
            </Button>
            <Button variant="outline" size="sm" onClick={loadFinance} disabled={loading} className="hover:bg-purple-50">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </div>

        {/* Cards de resumo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6">
          <Card className="gradient-card border-red-100/50 hover:shadow-glow-lg transition-all">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#FF8C00] flex items-center justify-center shadow-md">
                  <TrendingDown className="h-6 w-6 text-white" />
                </div>
                Contas a Pagar
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-3xl md:text-4xl font-bold text-[#FF8C00]">{formatCurrency(totalAP)}</p>
              <p className="text-sm text-gray-600">
                <span className="font-semibold text-[#FF8C00]">{countOpenAP}</span> contas abertas
              </p>
              <div className="pt-2 border-t border-[#FF8C00]/20 space-y-1.5 text-sm">
                <p className="flex justify-between text-gray-700">
                  <span>Já pago</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(totalPaidAP)}</span>
                </p>
                <p className="flex justify-between text-gray-700">
                  <span>Vencido (em aberto)</span>
                  <span className="font-semibold text-red-600">{formatCurrency(totalOverdueAP)}</span>
                </p>
                <p className="flex justify-between text-gray-700">
                  <span>A vencer</span>
                  <span className="font-semibold text-[#FF8C00]">{formatCurrency(totalUpcomingAP)}</span>
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="gradient-card border-green-100/50 hover:shadow-glow-lg transition-all">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#00B299] flex items-center justify-center shadow-md">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                Contas a Receber
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-3xl md:text-4xl font-bold text-[#00B299]">{formatCurrency(totalAR)}</p>
              <p className="text-sm text-gray-600">
                <span className="font-semibold text-[#00B299]">{countOpenAR}</span> contas abertas
              </p>
              <div className="pt-2 border-t border-[#00B299]/20 space-y-1.5 text-sm">
                <p className="flex justify-between text-gray-700">
                  <span>Já recebido</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(totalReceivedAR)}</span>
                </p>
                <p className="flex justify-between text-gray-700">
                  <span>Vencido (em aberto)</span>
                  <span className="font-semibold text-red-600">{formatCurrency(totalOverdueAR)}</span>
                </p>
                <p className="flex justify-between text-gray-700">
                  <span>A vencer</span>
                  <span className="font-semibold text-[#00B299]">{formatCurrency(totalUpcomingAR)}</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Abas e tabelas */}
        <Card className="overflow-hidden">
          <div className="flex border-b border-gray-200">
            <button
              type="button"
              onClick={() => setActiveTab('ap')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'ap'
                  ? 'text-[#FF8C00] border-b-2 border-[#FF8C00] bg-[#FF8C00]/5'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <TrendingDown className="h-4 w-4" />
              Contas a Pagar
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('ar')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'ar'
                  ? 'text-[#00B299] border-b-2 border-[#00B299] bg-[#00B299]/5'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <TrendingUp className="h-4 w-4" />
              Contas a Receber
            </button>
          </div>

          <CardContent className="p-0">
            {/* Contas a Pagar */}
            {activeTab === 'ap' && (
              <div className="p-4">
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">Filtrar:</span>
                  <select
                    value={apStatusFilter}
                    onChange={(e) => setApStatusFilter(e.target.value)}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF8C00] bg-white"
                  >
                    {AP_STATUS_FILTERS.map((f) => (
                      <option key={f.value || 'all'} value={f.value}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="overflow-x-auto max-h-[450px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 z-10 bg-gray-50">
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-4 font-medium text-gray-700">Descrição</th>
                        <th className="text-left py-2 px-4 font-medium text-gray-700">Fornecedor / Venda</th>
                        <th className="text-left py-2 px-4 font-medium text-gray-700">Vencimento</th>
                        <th className="text-right py-2 px-4 font-medium text-gray-700">Valor</th>
                        <th className="text-left py-2 px-4 font-medium text-gray-700">Status</th>
                        <th className="text-left py-2 px-4 font-medium text-gray-700">Forma pagamento</th>
                        <th className="text-right py-2 px-4 font-medium text-gray-700 w-24">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-gray-500">
                            Carregando...
                          </td>
                        </tr>
                      ) : accountsPayable.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-gray-500">
                            Nenhuma conta a pagar
                          </td>
                        </tr>
                      ) : (
                        accountsPayable.map((ap) => (
                          <tr key={ap.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                            <td className="py-2 px-4 text-gray-900">{ap.description}</td>
                            <td className="py-2 px-4 text-gray-600">
                              {ap.supplier?.name || (ap.salesOrder && `Venda #${ap.salesOrder.id.slice(0, 8)}`) || '-'}
                            </td>
                            <td className="py-2 px-4 text-gray-600">{formatDate(ap.dueDate)}</td>
                            <td className="py-2 px-4 text-right font-semibold text-[#FF8C00]">
                              {formatCurrency(Number(ap.amount))}
                            </td>
                            <td className="py-2 px-4">
                              <span
                                className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                                  ap.status === 'OPEN' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                                }`}
                              >
                                {ap.status === 'OPEN' ? 'Aberta' : 'Paga'}
                              </span>
                            </td>
                            <td className="py-2 px-4 text-gray-600 text-xs">
                              {ap.status === 'PAID' && ap.paymentSources?.length
                                ? ap.paymentSources.map((ps, i) => ps.investor?.name || 'Caixa').join(', ')
                                : ap.paymentMethod?.name || '-'}
                            </td>
                            <td className="py-2 px-4 text-right">
                              {ap.status === 'OPEN' && (
                                <Button
                                  size="sm"
                                  onClick={() => openPaymentModal(ap)}
                                  disabled={processingAccount === `ap-${ap.id}`}
                                  className="bg-green-600 hover:bg-green-700 text-white h-8"
                                >
                                  {processingAccount === `ap-${ap.id}` ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <>
                                      <CheckCircle className="h-4 w-4 mr-1" />
                                      Baixar
                                    </>
                                  )}
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                {!loading && accountsPayable.length > 0 && (
                  <div className="border-t border-gray-200 bg-gray-50 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold text-gray-700">
                      Qtde de títulos: <span className="text-[#FF8C00]">{accountsPayable.length}</span>
                    </span>
                    <span className="font-semibold text-gray-700">
                      Total: <span className="text-[#FF8C00] text-lg">{formatCurrency(accountsPayable.reduce((s, ap) => s + Number(ap.amount), 0))}</span>
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Contas a Receber */}
            {activeTab === 'ar' && (
              <div className="p-4">
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">Filtrar:</span>
                  <select
                    value={arStatusFilter}
                    onChange={(e) => setArStatusFilter(e.target.value)}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00B299] bg-white"
                  >
                    {AR_STATUS_FILTERS.map((f) => (
                      <option key={f.value || 'all'} value={f.value}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="overflow-x-auto max-h-[450px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 z-10 bg-gray-50">
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-4 font-medium text-gray-700">Descrição</th>
                        <th className="text-left py-2 px-4 font-medium text-gray-700">Cliente</th>
                        <th className="text-left py-2 px-4 font-medium text-gray-700">Vencimento</th>
                        <th className="text-right py-2 px-4 font-medium text-gray-700">Valor</th>
                        <th className="text-left py-2 px-4 font-medium text-gray-700">Status</th>
                        <th className="text-left py-2 px-4 font-medium text-gray-700">Forma pagamento</th>
                        <th className="text-right py-2 px-4 font-medium text-gray-700 w-24">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-gray-500">
                            Carregando...
                          </td>
                        </tr>
                      ) : accountsReceivable.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-gray-500">
                            Nenhuma conta a receber
                          </td>
                        </tr>
                      ) : (
                        accountsReceivable.map((ar) => (
                          <tr key={ar.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                            <td className="py-2 px-4 text-gray-900">{ar.description}</td>
                            <td className="py-2 px-4 text-gray-600">{ar.customer?.name || '-'}</td>
                            <td className="py-2 px-4 text-gray-600">{formatDate(ar.dueDate)}</td>
                            <td className="py-2 px-4 text-right font-semibold text-[#00B299]">
                              {formatCurrency(Number(ar.amount))}
                            </td>
                            <td className="py-2 px-4">
                              <span
                                className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                                  ar.status === 'OPEN' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                                }`}
                              >
                                {ar.status === 'OPEN' ? 'Aberta' : 'Recebida'}
                              </span>
                            </td>
                            <td className="py-2 px-4 text-gray-600">{ar.paymentMethod?.name || '-'}</td>
                            <td className="py-2 px-4 text-right">
                              {ar.status === 'OPEN' && (
                                <Button
                                  size="sm"
                                  onClick={() => openReceiveModal(ar)}
                                  disabled={processingAccount === `ar-${ar.id}`}
                                  className="bg-[#00B299] hover:bg-[#00B299]/90 text-white h-8"
                                >
                                  {processingAccount === `ar-${ar.id}` ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <>
                                      <CheckCircle className="h-4 w-4 mr-1" />
                                      Baixar
                                    </>
                                  )}
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                {!loading && accountsReceivable.length > 0 && (
                  <div className="border-t border-gray-200 bg-gray-50 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold text-gray-700">
                      Qtde de títulos: <span className="text-[#00B299]">{accountsReceivable.length}</span>
                    </span>
                    <span className="font-semibold text-gray-700">
                      Total: <span className="text-[#00B299] text-lg">{formatCurrency(accountsReceivable.reduce((s, ar) => s + Number(ar.amount), 0))}</span>
                    </span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal Recebimento */}
      {showReceiveModal && selectedARAccount && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Baixar Conta a Receber</CardTitle>
              <Button variant="ghost" size="icon" onClick={closeReceiveModal}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Descrição</p>
                <p className="font-semibold">{selectedARAccount.description}</p>
                <p className="text-sm text-gray-600 mt-2">Valor Total</p>
                <p className="text-xl font-bold text-[#00B299]">{formatCurrency(Number(selectedARAccount.amount))}</p>
                {selectedARAccount.customer?.name && (
                  <p className="text-sm text-gray-600 mt-2">Cliente: <span className="font-semibold">{selectedARAccount.customer.name}</span></p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="received-amount" className="text-base font-semibold">Valor a Receber *</Label>
                <Input
                  id="received-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  max={Number(selectedARAccount.amount)}
                  value={receivedAmount}
                  onChange={(e) => setReceivedAmount(e.target.value)}
                  placeholder="0.00"
                />
                <p className="text-xs text-gray-500">
                  Valor padrão para baixa total ou menor para baixa parcial
                </p>
              </div>
              <div className="flex gap-2 justify-end pt-4 border-t">
                <Button variant="outline" onClick={closeReceiveModal}>Cancelar</Button>
                <Button
                  onClick={handleReceiveAccount}
                  disabled={processingAccount === `ar-${selectedARAccount.id}` || !receivedAmount || parseFloat(receivedAmount || 0) <= 0}
                  className="bg-[#00B299] hover:bg-[#00B299]/90 text-white"
                >
                  {processingAccount === `ar-${selectedARAccount.id}` ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Baixando...</>
                  ) : (
                    <><CheckCircle className="h-4 w-4 mr-2" />Confirmar Recebimento</>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal Pagamento */}
      {showPaymentModal && selectedAccount && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Baixar Conta a Pagar</CardTitle>
              <Button variant="ghost" size="icon" onClick={closePaymentModal}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Descrição</p>
                <p className="font-semibold">{selectedAccount.description}</p>
                <p className="text-sm text-gray-600 mt-2">Valor Total</p>
                <p className="text-xl font-bold text-[#FF8C00]">{formatCurrency(Number(selectedAccount.amount))}</p>
              </div>
              <div>
                <div className="flex justify-between items-center mb-3">
                  <Label className="text-base font-semibold">Fontes Pagadoras *</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addPaymentSource}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Fonte
                  </Button>
                </div>
                <div className="space-y-3">
                  {paymentSources.map((source, index) => (
                    <div key={index} className="flex gap-2 items-start p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1 space-y-2">
                        <Label htmlFor={`source-investor-${index}`} className="text-xs">Investidor / Fonte *</Label>
                        <select
                          id={`source-investor-${index}`}
                          value={source.investorId || ''}
                          onChange={(e) => updatePaymentSource(index, 'investorId', e.target.value)}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                          <option value="">Selecione</option>
                          <option value="CAIXA">💰 Caixa</option>
                          {investors.map((inv) => (
                            <option key={inv.id} value={inv.id}>{inv.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="w-32 space-y-2">
                        <Label htmlFor={`source-amount-${index}`} className="text-xs">Valor *</Label>
                        <Input
                          id={`source-amount-${index}`}
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={source.amount}
                          onChange={(e) => updatePaymentSource(index, 'amount', e.target.value)}
                        />
                      </div>
                      {paymentSources.length > 1 && (
                        <Button type="button" variant="ghost" size="icon" onClick={() => removePaymentSource(index)} className="mt-6 text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold">Total das fontes:</span>
                    <span className={`text-lg font-bold ${
                      Math.abs(paymentSources.reduce((s, ps) => s + parseFloat(ps.amount || 0), 0) - Number(selectedAccount.amount)) < 0.01 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(paymentSources.reduce((s, ps) => s + parseFloat(ps.amount || 0), 0))}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-4 border-t">
                <Button variant="outline" onClick={closePaymentModal}>Cancelar</Button>
                <Button onClick={handlePayAccount} disabled={processingAccount === `ap-${selectedAccount.id}`} className="bg-green-600 hover:bg-green-700 text-white">
                  {processingAccount === `ap-${selectedAccount.id}` ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Baixando...</>
                  ) : (
                    <><CheckCircle className="h-4 w-4 mr-2" />Confirmar Pagamento</>
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
