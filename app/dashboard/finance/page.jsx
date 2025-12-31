'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatCurrency, formatDate } from '@/lib/utils'
import { DollarSign, TrendingUp, TrendingDown, RefreshCw, CheckCircle, Loader2, Plus, Trash2, X } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function FinancePage() {
  const [accountsPayable, setAccountsPayable] = useState([])
  const [accountsReceivable, setAccountsReceivable] = useState([])
  const [investors, setInvestors] = useState([])
  const [loading, setLoading] = useState(true)
  const [processingAccount, setProcessingAccount] = useState(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState(null)
  const [paymentSources, setPaymentSources] = useState([{ investorId: '', amount: '' }])
  const { toast } = useToast()

  useEffect(() => {
    loadFinance()
    // Recarregar a cada 30 segundos para manter dados atualizados
    const interval = setInterval(loadFinance, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadFinance = async () => {
    try {
      const [apResponse, arResponse, investorsResponse] = await Promise.all([
        api.get('/finance/ap'),
        api.get('/finance/ar'),
        api.get('/investors', { params: { isActive: 'true', limit: 100 } }),
      ])
      setAccountsPayable(apResponse.data.data)
      setAccountsReceivable(arResponse.data.data)
      setInvestors(investorsResponse.data.data || [])
    } catch (error) {
      console.error('Erro ao carregar financeiro:', error)
    } finally {
      setLoading(false)
    }
  }

  const totalAP = accountsPayable
    .filter((ap) => ap.status === 'OPEN')
    .reduce((sum, ap) => sum + Number(ap.amount), 0)

  const totalAR = accountsReceivable
    .filter((ar) => ar.status === 'OPEN')
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

    // Validar fontes pagadoras (aceita Caixa ou Investidor)
    // Uma fonte é válida se tem amount e investorId (seja 'CAIXA' ou ID de investidor)
    const validSources = paymentSources.filter(ps => ps.amount && ps.investorId && ps.investorId !== '')
    if (validSources.length === 0) {
      toast({
        title: 'Erro',
        description: 'Adicione pelo menos uma fonte pagadora',
        variant: 'destructive',
      })
      return
    }

    const totalSources = validSources.reduce((sum, ps) => sum + parseFloat(ps.amount || 0), 0)
    const accountAmount = Number(selectedAccount.amount)

    if (Math.abs(totalSources - accountAmount) > 0.01) {
      toast({
        title: 'Erro',
        description: `A soma das fontes pagadoras (R$ ${totalSources.toFixed(2)}) deve ser igual ao valor da conta (R$ ${accountAmount.toFixed(2)})`,
        variant: 'destructive',
      })
      return
    }

    setProcessingAccount(`ap-${selectedAccount.id}`)
    try {
      await api.post(`/finance/ap/${selectedAccount.id}/pay`, {
        paidAt: new Date().toISOString(),
        paymentSources: validSources.map(ps => ({
          // Se for 'CAIXA', não enviar investorId (será null no backend)
          investorId: ps.investorId === 'CAIXA' ? undefined : ps.investorId,
          amount: parseFloat(ps.amount),
        })),
      })
      toast({
        title: 'Sucesso!',
        description: 'Conta a pagar baixada com sucesso',
      })
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

  const handleReceiveAccount = async (accountId) => {
    if (!confirm('Deseja confirmar o recebimento desta conta?')) {
      return
    }

    setProcessingAccount(`ar-${accountId}`)
    try {
      await api.post(`/finance/ar/${accountId}/receive`, {
        receivedAt: new Date().toISOString(),
      })
      toast({
        title: 'Sucesso!',
        description: 'Conta a receber baixada com sucesso',
      })
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
          <h1 className="text-2xl md:text-3xl font-bold text-[#00B299]">
            Financeiro
          </h1>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              asChild
              className="hover:bg-red-50 border-red-200 text-red-700"
            >
              <Link href="/dashboard/finance/expenses/new">
                <Plus className="h-4 w-4 mr-2" />
                Nova Despesa
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              asChild
              className="hover:bg-green-50 border-green-200 text-green-700"
            >
              <Link href="/dashboard/finance/income/new">
                <Plus className="h-4 w-4 mr-2" />
                Nova Receita
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={loadFinance}
              disabled={loading}
              className="hover:bg-purple-50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
          <Card className="gradient-card border-red-100/50 hover:shadow-glow-lg transition-all">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#FF8C00] flex items-center justify-center shadow-md">
                  <TrendingDown className="h-6 w-6 text-white" />
                </div>
                Contas a Pagar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl md:text-4xl font-bold text-[#FF8C00]">
                {formatCurrency(totalAP)}
              </p>
              <p className="text-sm text-gray-600 mt-2">
                <span className="font-semibold text-[#FF8C00]">
                  {accountsPayable.filter((ap) => ap.status === 'OPEN').length}
                </span> contas abertas
              </p>
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
            <CardContent>
              <p className="text-3xl md:text-4xl font-bold text-[#00B299]">
                {formatCurrency(totalAR)}
              </p>
              <p className="text-sm text-gray-600 mt-2">
                <span className="font-semibold text-[#00B299]">
                  {accountsReceivable.filter((ar) => ar.status === 'OPEN').length}
                </span> contas abertas
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <Card className="gradient-card border-red-100/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#FF8C00] flex items-center justify-center">
                  <TrendingDown className="h-4 w-4 text-white" />
                </div>
                Contas a Pagar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {accountsPayable.slice(0, 10).map((ap) => (
                  <div
                    key={ap.id}
                    className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-3 md:p-4 bg-gradient-to-r from-red-50 to-pink-50 rounded-xl border border-red-100/50 hover:shadow-md transition-all"
                  >
                    <div className="flex-1 min-w-0 w-full sm:w-auto">
                      <p className="font-semibold text-gray-900 break-words">{ap.description}</p>
                      <p className="text-xs md:text-sm text-gray-600 mt-1 break-words">
                        {formatDate(ap.dueDate)}
                        {ap.supplier?.name && ` • ${ap.supplier.name}`}
                        {ap.salesOrder && (
                          <span className="inline-block ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                            Venda: #{ap.salesOrder.id.slice(0, 8)}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                      <div className="text-left sm:text-right flex-shrink-0">
                        <p className="font-bold text-[#FF8C00] whitespace-nowrap">{formatCurrency(Number(ap.amount))}</p>
                        <span className={`text-xs px-2 py-1 rounded-md font-semibold inline-block mt-1 ${
                          ap.status === 'OPEN' ? 'bg-yellow-100 text-yellow-800' : 'bg-[#00B299]/10 text-[#00B299]'
                        }`}>
                          {ap.status === 'OPEN' ? 'Aberta' : 'Paga'}
                        </span>
                      </div>
                      {ap.status === 'OPEN' && (
                        <Button
                          size="sm"
                          onClick={() => openPaymentModal(ap)}
                          disabled={processingAccount === `ap-${ap.id}`}
                          className="bg-green-600 hover:bg-green-700 text-white flex-shrink-0"
                        >
                          {processingAccount === `ap-${ap.id}` ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Baixando...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Baixar
                            </>
                          )}
                        </Button>
                      )}
                      {ap.status === 'PAID' && ap.paymentSources && ap.paymentSources.length > 0 && (
                        <div className="text-xs text-gray-600 mt-1">
                          <p className="font-semibold">Fontes pagadoras:</p>
                          {ap.paymentSources.map((ps, idx) => (
                            <p key={idx} className="text-gray-500">
                              {ps.investor?.name || '💰 Caixa'}: {formatCurrency(Number(ps.amount))}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="gradient-card border-green-100/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#00B299] flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-white" />
                </div>
                Contas a Receber
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {accountsReceivable.slice(0, 10).map((ar) => (
                  <div
                    key={ar.id}
                    className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-3 md:p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100/50 hover:shadow-md transition-all"
                  >
                    <div className="flex-1 min-w-0 w-full sm:w-auto">
                      <p className="font-semibold text-gray-900 break-words">{ar.description}</p>
                      <p className="text-xs md:text-sm text-gray-600 mt-1 break-words">
                        {formatDate(ar.dueDate)}
                        {ar.paymentDays ? ` • Prazo: ${ar.paymentDays} dias` : ''} • {ar.customer?.name || '-'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                      <div className="text-left sm:text-right flex-shrink-0">
                        <p className="font-bold text-[#00B299] whitespace-nowrap">{formatCurrency(Number(ar.amount))}</p>
                        <span className={`text-xs px-2 py-1 rounded-md font-semibold inline-block mt-1 ${
                          ar.status === 'OPEN' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {ar.status === 'OPEN' ? 'Aberta' : 'Recebida'}
                        </span>
                      </div>
                      {ar.status === 'OPEN' && (
                        <Button
                          size="sm"
                          onClick={() => handleReceiveAccount(ar.id)}
                          disabled={processingAccount === `ar-${ar.id}`}
                          className="bg-[#00B299] hover:bg-[#00B299]/90 text-white flex-shrink-0"
                        >
                          {processingAccount === `ar-${ar.id}` ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Baixando...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Baixar
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal de Fontes Pagadoras */}
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
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addPaymentSource}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Fonte
                  </Button>
                </div>

                <div className="space-y-3">
                  {paymentSources.map((source, index) => (
                    <div key={index} className="flex gap-2 items-start p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1 space-y-2">
                        <Label htmlFor={`source-investor-${index}`} className="text-xs">Investidor / Fonte Pagadora *</Label>
                        <select
                          id={`source-investor-${index}`}
                          value={source.investorId || ''}
                          onChange={(e) => updatePaymentSource(index, 'investorId', e.target.value)}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                          <option value="">Selecione uma fonte pagadora</option>
                          <option value="CAIXA">💰 Caixa</option>
                          {investors.map((investor) => (
                            <option key={investor.id} value={investor.id}>
                              {investor.name}
                            </option>
                          ))}
                        </select>
                        {investors.length === 0 && (
                          <p className="text-xs text-orange-600">
                            Nenhum investidor cadastrado. <Link href="/dashboard/investors/new" className="underline">Cadastrar agora</Link>
                          </p>
                        )}
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
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removePaymentSource(index)}
                          className="mt-6 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-gray-700">Total das Fontes:</span>
                    <span className={`text-lg font-bold ${
                      Math.abs(
                        paymentSources.reduce((sum, ps) => sum + parseFloat(ps.amount || 0), 0) - 
                        Number(selectedAccount.amount)
                      ) < 0.01 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {formatCurrency(paymentSources.reduce((sum, ps) => sum + parseFloat(ps.amount || 0), 0))}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-sm text-gray-600">Valor da Conta:</span>
                    <span className="text-sm font-semibold text-gray-700">
                      {formatCurrency(Number(selectedAccount.amount))}
                    </span>
                  </div>
                  {Math.abs(
                    paymentSources.reduce((sum, ps) => sum + parseFloat(ps.amount || 0), 0) - 
                    Number(selectedAccount.amount)
                  ) >= 0.01 && (
                    <p className="text-xs text-red-600 mt-2">
                      ⚠️ A soma das fontes deve ser igual ao valor da conta
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t">
                <Button variant="outline" onClick={closePaymentModal}>
                  Cancelar
                </Button>
                <Button
                  onClick={handlePayAccount}
                  disabled={processingAccount === `ap-${selectedAccount.id}`}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {processingAccount === `ap-${selectedAccount.id}` ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Baixando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Confirmar Pagamento
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

