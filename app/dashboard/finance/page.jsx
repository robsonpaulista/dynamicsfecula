'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/utils'
import { DollarSign, TrendingUp, TrendingDown, RefreshCw, CheckCircle, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function FinancePage() {
  const [accountsPayable, setAccountsPayable] = useState([])
  const [accountsReceivable, setAccountsReceivable] = useState([])
  const [loading, setLoading] = useState(true)
  const [processingAccount, setProcessingAccount] = useState(null)
  const { toast } = useToast()

  useEffect(() => {
    loadFinance()
    // Recarregar a cada 30 segundos para manter dados atualizados
    const interval = setInterval(loadFinance, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadFinance = async () => {
    try {
      const [apResponse, arResponse] = await Promise.all([
        api.get('/finance/ap'),
        api.get('/finance/ar'),
      ])
      setAccountsPayable(apResponse.data.data)
      setAccountsReceivable(arResponse.data.data)
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

  const handlePayAccount = async (accountId) => {
    if (!confirm('Deseja confirmar o pagamento desta conta?')) {
      return
    }

    setProcessingAccount(`ap-${accountId}`)
    try {
      await api.post(`/finance/ap/${accountId}/pay`, {
        paidAt: new Date().toISOString(),
      })
      toast({
        title: 'Sucesso!',
        description: 'Conta a pagar baixada com sucesso',
      })
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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-[#00B299]">
            Financeiro
          </h1>
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
                        {formatDate(ap.dueDate)} • {ap.supplier?.name || '-'}
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
                          onClick={() => handlePayAccount(ap.id)}
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
                        {formatDate(ar.dueDate)} • {ar.customer?.name || '-'}
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
    </div>
  )
}

