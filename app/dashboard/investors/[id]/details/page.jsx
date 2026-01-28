'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ArrowLeft, DollarSign, Calendar, TrendingUp, FileText, Loader2, Building2 } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'

export default function InvestorDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [investor, setInvestor] = useState(null)
  const [payments, setPayments] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadInvestorDetails()
  }, [params.id])

  const loadInvestorDetails = async () => {
    try {
      const [investorRes, paymentsRes] = await Promise.all([
        api.get(`/investors/${params.id}`),
        api.get(`/investors/${params.id}/payments`),
      ])

      setInvestor(investorRes.data.data)
      setPayments(paymentsRes.data.data.payments)
      setSummary(paymentsRes.data.data.summary)
    } catch (error) {
      console.error('Erro ao carregar detalhes do investidor:', error)
      toast({
        title: 'Erro',
        description: error.response?.data?.error?.message || 'Erro ao carregar detalhes do investidor',
        variant: 'destructive',
      })
      router.push('/dashboard/investors')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-[#00B299]" />
          </div>
        </div>
      </div>
    )
  }

  if (!investor) {
    return null
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Button variant="ghost" asChild className="hover:bg-[#00B299]/10">
            <Link href="/dashboard/investors">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Link>
          </Button>
        </div>

        {/* Cabeçalho do Investidor */}
        <Card className="mb-6 gradient-card border-[#00B299]/20 shadow-glow-lg">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="text-2xl md:text-3xl text-[#00B299]">
                  {investor.name}
                </CardTitle>
                {investor.document && (
                  <p className="text-sm text-gray-600 mt-1">Doc: {investor.document}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-md text-sm font-semibold ${
                  investor.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {investor.isActive ? 'Ativo' : 'Inativo'}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {investor.phone && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600">Telefone</p>
                  <p className="font-semibold">{investor.phone}</p>
                </div>
              )}
              {investor.email && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600">Email</p>
                  <p className="font-semibold">{investor.email}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Resumo de Investimentos */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6">
            <Card className="gradient-card border-[#00B299]/20 hover:shadow-glow-lg transition-all">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#00B299] flex items-center justify-center shadow-md">
                    <DollarSign className="h-6 w-6 text-white" />
                  </div>
                  Total Investido
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl md:text-4xl font-bold text-[#00B299]">
                  {formatCurrency(summary.totalInvested)}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  Em {summary.totalAccounts} {summary.totalAccounts === 1 ? 'conta' : 'contas'}
                </p>
              </CardContent>
            </Card>

            <Card className="gradient-card border-blue-100/50 hover:shadow-glow-lg transition-all">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-md">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  Contas Pagas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl md:text-4xl font-bold text-blue-600">
                  {summary.totalAccounts}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  Total de pagamentos realizados
                </p>
              </CardContent>
            </Card>

            <Card className="gradient-card border-purple-100/50 hover:shadow-glow-lg transition-all">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-purple-600 flex items-center justify-center shadow-md">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                  Média por Conta
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl md:text-4xl font-bold text-purple-600">
                  {summary.totalAccounts > 0 
                    ? formatCurrency(summary.totalInvested / summary.totalAccounts)
                    : formatCurrency(0)
                  }
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  Valor médio investido
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Lista de Pagamentos */}
        <Card className="gradient-card border-[#00B299]/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-[#00B299]" />
              Histórico de Investimentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <div className="text-center py-12">
                <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Nenhum investimento registrado ainda</p>
              </div>
            ) : (
              <div className="space-y-3">
                {payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-4 bg-gradient-to-r from-[#00B299]/5 to-green-50 rounded-xl border border-[#00B299]/20 hover:shadow-md transition-all"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 break-words">
                        {payment.account.description}
                      </p>
                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-600">
                        {payment.account.supplier && (
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {payment.account.supplier.name}
                          </span>
                        )}
                        {payment.account.category && (
                          <span className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {payment.account.category.name}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(payment.paidAt || payment.createdAt)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Investido</p>
                        <p className="text-lg font-bold text-[#00B299]">
                          {formatCurrency(payment.amount)}
                        </p>
                        {payment.account.totalAmount !== payment.amount && (
                          <p className="text-xs text-gray-500 mt-1">
                            de {formatCurrency(payment.account.totalAmount)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gráfico por Mês (Opcional - pode ser adicionado depois) */}
        {summary && summary.byMonth && summary.byMonth.length > 0 && (
          <Card className="mt-6 gradient-card border-[#00B299]/20">
            <CardHeader>
              <CardTitle>Investimentos por Mês</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {summary.byMonth.map((monthData) => (
                  <div key={monthData.month} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">
                      {new Date(monthData.month + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                    </span>
                    <div className="text-right">
                      <p className="font-bold text-[#00B299]">{formatCurrency(monthData.total)}</p>
                      <p className="text-xs text-gray-500">{monthData.count} {monthData.count === 1 ? 'conta' : 'contas'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}









