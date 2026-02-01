'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ShieldCheck, RefreshCw, Loader2, AlertTriangle, CheckCircle, DollarSign, Package } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function AuditoriaPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [data, setData] = useState(null)
  const [caixaData, setCaixaData] = useState(null)
  const [pedidosSemAR, setPedidosSemAR] = useState(null)
  const [pedidosCanceladosComAR, setPedidosCanceladosComAR] = useState(null)
  const [estoqueVendasCanceladas, setEstoqueVendasCanceladas] = useState(null)
  const [estoqueSaidasDuplicadas, setEstoqueSaidasDuplicadas] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadingCaixa, setLoadingCaixa] = useState(true)
  const [loadingPedidosSemAR, setLoadingPedidosSemAR] = useState(true)
  const [transferirDe, setTransferirDe] = useState('')
  const [transferirPara, setTransferirPara] = useState('')
  const [corrigindo, setCorrigindo] = useState(false)
  const [corrigindoId, setCorrigindoId] = useState(null)
  const [revertendoCaixaId, setRevertendoCaixaId] = useState(null)
  const [abaAtiva, setAbaAtiva] = useState('ar')
  const [pedidoExpandido, setPedidoExpandido] = useState(null)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.push('/login')
      return
    }
    if (user.role !== 'ADMIN') {
      router.push('/dashboard')
      return
    }
  }, [user, authLoading, router])

  const loadValidate = useCallback(async () => {
    try {
      setLoading(true)
      const response = await api.get('/finance/validate?tipo=ar_pedidos')
      setData(response.data.data)
    } catch (error) {
      if (error.response?.status === 403) {
        toast({ title: 'Acesso negado', description: 'Apenas administradores podem acessar a auditoria', variant: 'destructive' })
        router.push('/dashboard')
        return
      }
      console.error('Erro ao carregar validação:', error)
      toast({ title: 'Erro', description: error.response?.data?.error?.message || 'Erro ao carregar validação', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [router, toast])

  const loadCaixa = useCallback(async () => {
    try {
      setLoadingCaixa(true)
      const response = await api.get('/finance/validate?tipo=caixa')
      setCaixaData(response.data.data)
    } catch (error) {
      if (error.response?.status === 403) {
        return
      }
      console.error('Erro ao carregar conferência caixa:', error)
      toast({ title: 'Erro', description: error.response?.data?.error?.message || 'Erro ao carregar conferência do caixa', variant: 'destructive' })
    } finally {
      setLoadingCaixa(false)
    }
  }, [toast])

  const loadPedidosSemAR = useCallback(async () => {
    try {
      setLoadingPedidosSemAR(true)
      const response = await api.get('/finance/validate?tipo=pedidos_sem_ar')
      setPedidosSemAR(response.data.data)
    } catch (error) {
      if (error.response?.status === 403) return
      console.error('Erro ao carregar pedidos sem AR:', error)
      toast({ title: 'Erro', description: error.response?.data?.error?.message || 'Erro ao carregar', variant: 'destructive' })
    } finally {
      setLoadingPedidosSemAR(false)
    }
  }, [toast])

  const loadEstoqueSaidasDuplicadas = useCallback(async () => {
    try {
      const response = await api.get('/finance/validate?tipo=estoque_saidas_duplicadas')
      setEstoqueSaidasDuplicadas(response.data.data)
    } catch (error) {
      if (error.response?.status === 403) return
      setEstoqueSaidasDuplicadas({ total: 0, itens: [] })
    }
  }, [])

  const loadEstoqueVendasCanceladas = useCallback(async () => {
    try {
      const response = await api.get('/finance/validate?tipo=estoque_vendas_canceladas')
      setEstoqueVendasCanceladas(response.data.data)
    } catch (error) {
      if (error.response?.status === 403) return
      setEstoqueVendasCanceladas({ total: 0, itens: [] })
    }
  }, [])

  const loadPedidosCanceladosComAR = useCallback(async () => {
    try {
      const response = await api.get('/finance/validate?tipo=pedidos_cancelados_com_ar')
      setPedidosCanceladosComAR(response.data.data?.itens ?? [])
    } catch (error) {
      if (error.response?.status === 403) return
      setPedidosCanceladosComAR([])
    }
  }, [])

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      loadValidate()
      loadCaixa()
      loadPedidosSemAR()
      loadPedidosCanceladosComAR()
      loadEstoqueVendasCanceladas()
      loadEstoqueSaidasDuplicadas()
    }
  }, [user?.role, loadValidate, loadCaixa, loadPedidosSemAR, loadPedidosCanceladosComAR, loadEstoqueVendasCanceladas, loadEstoqueSaidasDuplicadas])

  const handleTransferirAR = async () => {
    if (!user || user.role !== 'ADMIN' || !transferirDe || !transferirPara) return
    try {
      setCorrigindo(true)
      const response = await api.post('/finance/validate', {
        acao: 'transferir_ar',
        dePedidoId: transferirDe,
        paraPedidoId: transferirPara,
      })
      const transferidos = response.data.data?.transferidos ?? 0
      toast({
        title: 'Transferência concluída',
        description: response.data.data?.message || `${transferidos} conta(s) transferida(s)`,
      })
      setTransferirDe('')
      setTransferirPara('')
      loadPedidosSemAR()
      loadPedidosCanceladosComAR()
      loadValidate()
    } catch (error) {
      if (error.response?.status === 403) {
        toast({ title: 'Acesso negado', variant: 'destructive' })
        return
      }
      toast({
        title: 'Erro',
        description: error.response?.data?.error?.message || 'Erro ao transferir',
        variant: 'destructive',
      })
    } finally {
      setCorrigindo(false)
    }
  }

  const handleCorrigirPedidosSemAR = async () => {
    if (!user || user.role !== 'ADMIN') return
    try {
      setCorrigindo(true)
      const response = await api.post('/finance/validate', { acao: 'pedidos_sem_ar' })
      const arCriadas = response.data.data?.arCriadas ?? 0
      const pedidos = response.data.data?.corrigidos ?? 0
      toast({
        title: 'Correção concluída',
        description: `${arCriadas} conta(s) a receber criada(s) para ${pedidos} pedido(s).`,
      })
      loadPedidosSemAR()
    } catch (error) {
      if (error.response?.status === 403) {
        toast({ title: 'Acesso negado', description: 'Apenas administradores podem corrigir', variant: 'destructive' })
        return
      }
      toast({
        title: 'Erro',
        description: error.response?.data?.error?.message || 'Erro ao corrigir',
        variant: 'destructive',
      })
    } finally {
      setCorrigindo(false)
    }
  }

  const handleCorrigir = async () => {
    if (!user || user.role !== 'ADMIN') return
    try {
      setCorrigindo(true)
      const response = await api.post('/finance/validate', { acao: 'ar_pedidos' })
      const corrigidos = response.data.data?.corrigidos ?? 0
      toast({
        title: 'Correção concluída',
        description: corrigidos > 0
          ? `${corrigidos} contas a receber foram canceladas`
          : 'Nenhuma conta precisou de correção',
      })
      loadValidate()
    } catch (error) {
      if (error.response?.status === 403) {
        toast({ title: 'Acesso negado', description: 'Apenas administradores podem corrigir', variant: 'destructive' })
        return
      }
      toast({
        title: 'Erro',
        description: error.response?.data?.error?.message || 'Erro ao corrigir',
        variant: 'destructive',
      })
    } finally {
      setCorrigindo(false)
    }
  }

  const handleCorrigirUm = async (ar) => {
    if (!user || user.role !== 'ADMIN' || ar.status !== 'OPEN') return
    try {
      setCorrigindoId(ar.id)
      await api.put(`/finance/ar/${ar.id}`, { status: 'CANCELED' })
      toast({
        title: 'AR cancelada',
        description: `Conta "${ar.description?.slice(0, 30)}..." foi cancelada.`,
      })
      loadValidate()
    } catch (error) {
      if (error.response?.status === 403) {
        toast({ title: 'Acesso negado', description: 'Apenas administradores podem corrigir', variant: 'destructive' })
        return
      }
      toast({
        title: 'Erro',
        description: error.response?.data?.error?.message || 'Erro ao cancelar AR',
        variant: 'destructive',
      })
    } finally {
      setCorrigindoId(null)
    }
  }

  const handleReverterCaixa = async (t) => {
    if (!user || user.role !== 'ADMIN' || !t.inconsistencia) return
    await handleReverterTransacaoCaixa(t.id)
  }

  const handleReverterTransacaoCaixa = async (transactionId) => {
    if (!user || user.role !== 'ADMIN' || !transactionId) return
    try {
      setRevertendoCaixaId(transactionId)
      await api.post('/finance/validate', { acao: 'caixa_reverter', transactionId })
      toast({
        title: 'Estorno lançado',
        description: 'Transação revertida no caixa (lançamento de estorno criado).',
      })
      loadCaixa()
    } catch (error) {
      if (error.response?.status === 403) {
        toast({ title: 'Acesso negado', description: 'Apenas administradores podem corrigir', variant: 'destructive' })
        return
      }
      toast({
        title: 'Erro',
        description: error.response?.data?.error?.message || 'Erro ao reverter transação',
        variant: 'destructive',
      })
    } finally {
      setRevertendoCaixaId(null)
    }
  }

  const handleReverterEstoqueVendasCanceladas = async () => {
    if (!user || user.role !== 'ADMIN') return
    try {
      setCorrigindo(true)
      const response = await api.post('/finance/validate', { acao: 'reverter_estoque_vendas_canceladas' })
      const revertidos = response.data.data?.revertidos ?? 0
      toast({
        title: 'Estoque revertido',
        description: response.data.data?.message || `${revertidos} movimentação(ões) revertida(s)`,
      })
      loadEstoqueVendasCanceladas()
    } catch (error) {
      if (error.response?.status === 403) {
        toast({ title: 'Acesso negado', variant: 'destructive' })
        return
      }
      toast({
        title: 'Erro',
        description: error.response?.data?.error?.message || 'Erro ao reverter estoque',
        variant: 'destructive',
      })
    } finally {
      setCorrigindo(false)
    }
  }

  const handleExcluirSaidaDuplicata = async (movementId) => {
    if (!user || user.role !== 'ADMIN') return
    try {
      setCorrigindoId(movementId)
      const response = await api.post('/finance/validate', { acao: 'estoque_excluir_duplicata', movementId })
      toast({ title: 'Duplicata excluída', description: response.data.data?.message })
      loadEstoqueSaidasDuplicadas()
    } catch (error) {
      if (error.response?.status === 403) return
      toast({
        title: 'Erro',
        description: error.response?.data?.error?.message || 'Erro ao excluir',
        variant: 'destructive',
      })
    } finally {
      setCorrigindoId(null)
    }
  }

  const handleExcluirTransacaoCaixa = async (transactionId) => {
    if (!user || user.role !== 'ADMIN' || !transactionId) return
    try {
      setRevertendoCaixaId(transactionId)
      await api.post('/finance/validate', { acao: 'caixa_excluir', transactionId })
      toast({
        title: 'Registro excluído',
        description: 'Uma transação duplicada foi excluída. O outro registro foi mantido.',
      })
      loadCaixa()
    } catch (error) {
      if (error.response?.status === 403) {
        toast({ title: 'Acesso negado', description: 'Apenas administradores podem corrigir', variant: 'destructive' })
        return
      }
      toast({
        title: 'Erro',
        description: error.response?.data?.error?.message || 'Erro ao excluir transação',
        variant: 'destructive',
      })
    } finally {
      setRevertendoCaixaId(null)
    }
  }

  if (authLoading || (user && user.role !== 'ADMIN')) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#00B299]" />
      </div>
    )
  }

  if (!user) return null

  const itens = data?.itens ?? []
  const total = data?.total ?? 0
  const totalValor = data?.totalValor ?? 0
  const porStatus = data?.porStatus ?? { cancelados: 0, digitados: 0, confirmados: 0 }
  const temCorrigir = itens.some((i) => i.status === 'OPEN')

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#00B299] flex items-center gap-2">
              <ShieldCheck className="h-8 w-8" />
              Auditoria
            </h1>
            <p className="text-gray-600 mt-1 text-sm">
              Validação e correção de inconsistências – apenas Administradores
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => { loadValidate(); loadCaixa(); loadPedidosSemAR(); loadPedidosCanceladosComAR(); loadEstoqueVendasCanceladas(); loadEstoqueSaidasDuplicadas(); }}
              disabled={loading || loadingCaixa || loadingPedidosSemAR}
              className="hover:bg-[#00B299]/10"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading || loadingCaixa || loadingPedidosSemAR ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            {temCorrigir && (
              <Button
                size="sm"
                onClick={handleCorrigir}
                disabled={corrigindo}
                className="bg-[#00B299] hover:bg-[#00B299]/90 text-white"
              >
                {corrigindo ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Corrigindo...</>
                ) : (
                  <><CheckCircle className="h-4 w-4 mr-2" />Corrigir inconsistências</>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Abas */}
        <div className="flex border-b border-gray-200 mb-4">
          <button
            type="button"
            onClick={() => setAbaAtiva('ar')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              abaAtiva === 'ar' ? 'text-amber-600 border-b-2 border-amber-500 bg-amber-50/50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <AlertTriangle className="h-4 w-4" />
            Contas a Receber
          </button>
          <button
            type="button"
            onClick={() => setAbaAtiva('caixa')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              abaAtiva === 'caixa' ? 'text-[#00B299] border-b-2 border-[#00B299] bg-[#00B299]/5' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <DollarSign className="h-4 w-4" />
            Conferência do Caixa
          </button>
          <button
            type="button"
            onClick={() => setAbaAtiva('pedidos_sem_ar')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              abaAtiva === 'pedidos_sem_ar' ? 'text-red-600 border-b-2 border-red-500 bg-red-50/50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <AlertTriangle className="h-4 w-4" />
            Pedidos sem AR
          </button>
          <button
            type="button"
            onClick={() => setAbaAtiva('estoque_saidas_duplicadas')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              abaAtiva === 'estoque_saidas_duplicadas' ? 'text-amber-600 border-b-2 border-amber-500 bg-amber-50/50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Package className="h-4 w-4" />
            Saídas duplicadas
          </button>
          <button
            type="button"
            onClick={() => setAbaAtiva('estoque_vendas_canceladas')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              abaAtiva === 'estoque_vendas_canceladas' ? 'text-orange-600 border-b-2 border-orange-500 bg-orange-50/50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Package className="h-4 w-4" />
            Estoque vendas canceladas
          </button>
          <button
            type="button"
            onClick={() => setAbaAtiva('transferir_ar')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              abaAtiva === 'transferir_ar' ? 'text-[#00B299] border-b-2 border-[#00B299] bg-[#00B299]/5' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <CheckCircle className="h-4 w-4" />
            Transferir AR
          </button>
        </div>

        {/* Seção AR */}
        {abaAtiva === 'ar' && (
        <Card className="overflow-hidden border-amber-200/50 mb-6">
          <CardHeader className="bg-amber-50/50">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-white" />
              </div>
              Contas a receber de pedidos cancelados ou não entregues
            </CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              AR vinculadas a pedidos com status Digitado, Confirmado ou Cancelado (que não foram entregues).
              Essas contas não deveriam estar em aberto.
            </p>
          </CardHeader>
          <CardContent className="p-4">
            {loading ? (
              <div className="py-12 text-center text-gray-500">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-[#00B299]" />
                Carregando...
              </div>
            ) : total === 0 ? (
              <div className="py-12 text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                <p className="text-green-700 font-medium">Nenhuma inconsistência encontrada</p>
                <p className="text-sm text-gray-600 mt-1">Todas as contas a receber estão vinculadas a pedidos entregues ou são manuais.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 rounded-lg text-sm">
                  <div>
                    <p className="text-gray-600">Total de inconsistências</p>
                    <p className="font-bold text-amber-600 text-lg">{total}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Valor total</p>
                    <p className="font-bold text-amber-700">{formatCurrency(totalValor)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Pedidos cancelados</p>
                    <p className="font-semibold">{porStatus.cancelados}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Digitados / Confirmados</p>
                    <p className="font-semibold">{porStatus.digitados + porStatus.confirmados}</p>
                  </div>
                </div>
                <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 z-10 bg-gray-50">
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-4 font-medium text-gray-700">Descrição</th>
                        <th className="text-left py-2 px-4 font-medium text-gray-700">Cliente</th>
                        <th className="text-left py-2 px-4 font-medium text-gray-700">Pedido</th>
                        <th className="text-left py-2 px-4 font-medium text-gray-700">Status pedido</th>
                        <th className="text-left py-2 px-4 font-medium text-gray-700">Vencimento</th>
                        <th className="text-right py-2 px-4 font-medium text-gray-700">Valor</th>
                        <th className="text-left py-2 px-4 font-medium text-gray-700">Status AR</th>
                        <th className="text-center py-2 px-4 font-medium text-gray-700">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {itens.map((ar) => (
                        <tr key={ar.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                          <td className="py-2 px-4 text-gray-900 truncate max-w-[150px]">{ar.description}</td>
                          <td className="py-2 px-4 text-gray-600">{ar.customerName}</td>
                          <td className="py-2 px-4 text-gray-600">#{ar.salesOrderId?.slice(0, 8)}</td>
                          <td className="py-2 px-4">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              ar.salesOrderStatus === 'CANCELED' ? 'bg-red-100 text-red-800' :
                              ar.salesOrderStatus === 'DRAFT' ? 'bg-gray-100 text-gray-800' :
                              ar.salesOrderStatus === 'CONFIRMED' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100'
                            }`}>
                              {ar.salesOrderStatus === 'CANCELED' ? 'Cancelado' :
                               ar.salesOrderStatus === 'DRAFT' ? 'Digitado' :
                               ar.salesOrderStatus === 'CONFIRMED' ? 'Confirmado' : ar.salesOrderStatus}
                            </span>
                          </td>
                          <td className="py-2 px-4 text-gray-600">{formatDate(ar.dueDate)}</td>
                          <td className="py-2 px-4 text-right font-semibold text-amber-700">{formatCurrency(ar.amount)}</td>
                          <td className="py-2 px-4">
                            <span className={`px-2 py-0.5 rounded text-xs ${
                              ar.status === 'OPEN' ? 'bg-amber-100 text-amber-800' :
                              ar.status === 'RECEIVED' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {ar.status === 'OPEN' ? 'Aberta' : ar.status === 'RECEIVED' ? 'Recebida' : ar.status}
                            </span>
                          </td>
                          <td className="py-2 px-4 text-center">
                            {ar.status === 'OPEN' ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-amber-700 border-amber-300 hover:bg-amber-50"
                                disabled={corrigindo || corrigindoId !== null}
                                onClick={() => handleCorrigirUm(ar)}
                              >
                                {corrigindoId === ar.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  'Cancelar AR'
                                )}
                              </Button>
                            ) : (
                              <span className="text-gray-400 text-xs">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {temCorrigir && (
                  <p className="mt-4 text-sm text-amber-700">
                    Clique em &quot;Corrigir inconsistências&quot; para cancelar as contas a receber em aberto (status OPEN) vinculadas a esses pedidos.
                    AR já recebidas não são alteradas (requer análise manual).
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>
        )}

        {/* Seção Conferência do Caixa */}
        {abaAtiva === 'caixa' && (
        <Card className="overflow-hidden border-[#00B299]/30">
          <CardHeader className="bg-[#00B299]/5">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="w-10 h-10 rounded-lg bg-[#00B299] flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              Conferência do Caixa
            </CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              Todas as transações de caixa (entradas e saídas) com saldo acumulado.
              Inconsistências destacadas podem explicar saldo incorreto.
            </p>
          </CardHeader>
          <CardContent className="p-4">
            {loadingCaixa ? (
              <div className="py-12 text-center text-gray-500">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-[#00B299]" />
                Carregando...
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4 p-4 bg-gray-50 rounded-lg text-sm">
                  <div>
                    <p className="text-gray-600">Total entradas</p>
                    <p className="font-bold text-green-600 text-lg">{formatCurrency(caixaData?.totalIn ?? 0)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Total saídas</p>
                    <p className="font-bold text-red-600 text-lg">{formatCurrency(caixaData?.totalOut ?? 0)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Saldo calculado</p>
                    <p className={`font-bold text-lg ${(caixaData?.saldoCalculado ?? 0) >= 0 ? 'text-[#00B299]' : 'text-red-600'}`}>
                      {formatCurrency(caixaData?.saldoCalculado ?? 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Transações</p>
                    <p className="font-semibold">{caixaData?.quantidadeTransacoes ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Inconsistências</p>
                    <p className={`font-semibold ${(caixaData?.inconsistencias?.length ?? 0) > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                      {caixaData?.inconsistencias?.length ?? 0}
                    </p>
                  </div>
                </div>
                {(caixaData?.inconsistencias?.length ?? 0) > 0 && (
                  <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="font-medium text-amber-800">{caixaData?.resumo}</p>
                    <ul className="mt-2 space-y-1 text-sm text-amber-700">
                      {caixaData?.inconsistencias?.map((inc, i) => (
                        <li key={inc.id || i}>• {inc.msg}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recebimentos por pedido: detectar duplicação vs recebimento parcial */}
                {(caixaData?.recebimentosPorPedido?.length ?? 0) > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Recebimentos por pedido</h3>
                    <p className="text-xs text-gray-600 mb-2">
                      Pedidos com mais de um recebimento no caixa. Compare &quot;Total do pedido&quot; com &quot;Total recebido&quot;: se recebido &gt; pedido, há possível duplicação; se recebido ≤ pedido, pode ser recebimento parcial.
                      Em caso de duplicação, use &quot;Excluir&quot; em um dos recebimentos para remover o duplicado e manter o outro.
                    </p>
                    <div className="overflow-x-auto border border-gray-200 rounded-lg max-h-[320px] overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="sticky top-0 z-10 bg-gray-100">
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-2 px-4 font-medium text-gray-700">Pedido</th>
                            <th className="text-left py-2 px-4 font-medium text-gray-700">Cliente</th>
                            <th className="text-right py-2 px-4 font-medium text-gray-700">Total do pedido</th>
                            <th className="text-right py-2 px-4 font-medium text-gray-700">Qtde receb.</th>
                            <th className="text-right py-2 px-4 font-medium text-gray-700">Total recebido</th>
                            <th className="text-left py-2 px-4 font-medium text-gray-700">Situação</th>
                            <th className="text-center py-2 px-4 font-medium text-gray-700">Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {caixaData?.recebimentosPorPedido?.map((row) => (
                            <tr
                              key={row.salesOrderId}
                              className={`border-b border-gray-100 hover:bg-gray-50/50 ${row.situacao === 'possivel_duplicacao' ? 'bg-amber-50/70' : ''}`}
                            >
                              <td className="py-2 px-4 text-gray-900 font-mono text-xs">#{row.salesOrderId?.slice(0, 8)}</td>
                              <td className="py-2 px-4 text-gray-600">{row.customerName}</td>
                              <td className="py-2 px-4 text-right font-semibold text-gray-800">{formatCurrency(row.totalPedido)}</td>
                              <td className="py-2 px-4 text-right">{row.qtdeRecebimentos}</td>
                              <td className="py-2 px-4 text-right font-semibold text-green-700">{formatCurrency(row.totalRecebido)}</td>
                              <td className="py-2 px-4">
                                {row.situacao === 'possivel_duplicacao' ? (
                                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800" title="Total recebido no caixa é maior que o total do pedido">
                                    Possível duplicação
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800" title="Pode ser recebimento parcial">
                                    OK (parcial?)
                                  </span>
                                )}
                              </td>
                              <td className="py-2 px-4">
                                {row.situacao === 'possivel_duplicacao' && row.transacoes?.length ? (
                                  <div className="flex flex-wrap gap-1 justify-center">
                                    {row.transacoes.map((tx) => (
                                      <Button
                                        key={tx.id}
                                        size="sm"
                                        variant="outline"
                                        className="text-amber-700 border-amber-300 hover:bg-amber-50 text-xs"
                                        disabled={revertendoCaixaId !== null}
                                        onClick={() => handleExcluirTransacaoCaixa(tx.id)}
                                      >
                                        {revertendoCaixaId === tx.id ? (
                                          <Loader2 className="h-3 w-3 animate-spin" />
                                        ) : (
                                          `Excluir ${formatCurrency(tx.amount)}`
                                        )}
                                      </Button>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-gray-400 text-xs">—</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      Detalhe por pedido: {caixaData?.recebimentosPorPedido?.map((row) => (
                        <span key={row.salesOrderId} className="mr-3">
                          #{row.salesOrderId?.slice(0, 8)} → {row.transacoes?.map((tx) => formatCurrency(tx.amount)).join(' + ')} = {formatCurrency(row.totalRecebido)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* AR com múltiplas baixas: mesma conta a receber com mais de uma entrada no caixa (possível baixa duplicada) */}
                {(caixaData?.arComMultiplasBaixas?.length ?? 0) > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">AR com múltiplas baixas no caixa</h3>
                    <p className="text-xs text-gray-600 mb-2">
                      Contas a receber que têm mais de uma transação de entrada no caixa. Pode ser recebimento parcial (várias parcelas) ou baixa duplicada.
                      Compare &quot;Valor atual AR&quot; com &quot;Total baixado no caixa&quot; e use &quot;Excluir&quot; para remover uma baixa duplicada se necessário.
                    </p>
                    <div className="overflow-x-auto border border-gray-200 rounded-lg max-h-[280px] overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="sticky top-0 z-10 bg-gray-100">
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-2 px-4 font-medium text-gray-700">Descrição</th>
                            <th className="text-left py-2 px-4 font-medium text-gray-700">Cliente</th>
                            <th className="text-right py-2 px-4 font-medium text-gray-700">Valor atual AR</th>
                            <th className="text-left py-2 px-4 font-medium text-gray-700">Status AR</th>
                            <th className="text-right py-2 px-4 font-medium text-gray-700">Qtde baixas</th>
                            <th className="text-right py-2 px-4 font-medium text-gray-700">Total baixado</th>
                            <th className="text-center py-2 px-4 font-medium text-gray-700">Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {caixaData?.arComMultiplasBaixas?.map((row) => (
                            <tr key={row.arId} className="border-b border-gray-100 hover:bg-gray-50/50 bg-amber-50/50">
                              <td className="py-2 px-4 text-gray-900 truncate max-w-[160px]" title={row.description}>{row.description}</td>
                              <td className="py-2 px-4 text-gray-600">{row.customerName}</td>
                              <td className="py-2 px-4 text-right font-semibold text-gray-800">{formatCurrency(row.valorAtualAR)}</td>
                              <td className="py-2 px-4">
                                <span className={`px-2 py-0.5 rounded text-xs ${
                                  row.status === 'OPEN' ? 'bg-amber-100 text-amber-800' :
                                  row.status === 'RECEIVED' ? 'bg-green-100 text-green-800' : 'bg-gray-100'
                                }`}>
                                  {row.status === 'OPEN' ? 'Aberta' : row.status === 'RECEIVED' ? 'Recebida' : row.status}
                                </span>
                              </td>
                              <td className="py-2 px-4 text-right">{row.qtdeBaixas}</td>
                              <td className="py-2 px-4 text-right font-semibold text-green-700">{formatCurrency(row.totalBaixadoNoCaixa)}</td>
                              <td className="py-2 px-4">
                                <div className="flex flex-wrap gap-1 justify-center">
                                  {row.transacoes?.map((tx) => (
                                    <Button
                                      key={tx.id}
                                      size="sm"
                                      variant="outline"
                                      className="text-amber-700 border-amber-300 hover:bg-amber-50 text-xs"
                                      disabled={revertendoCaixaId !== null}
                                      onClick={() => handleExcluirTransacaoCaixa(tx.id)}
                                    >
                                      {revertendoCaixaId === tx.id ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                      ) : (
                                        `Excluir ${formatCurrency(tx.amount)}`
                                      )}
                                    </Button>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="overflow-x-auto max-h-[450px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 z-10 bg-gray-50">
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-4 font-medium text-gray-700">Data</th>
                        <th className="text-left py-2 px-4 font-medium text-gray-700">Origem</th>
                        <th className="text-left py-2 px-4 font-medium text-gray-700">Descrição</th>
                        <th className="text-right py-2 px-4 font-medium text-gray-700">Entrada</th>
                        <th className="text-right py-2 px-4 font-medium text-gray-700">Saída</th>
                        <th className="text-right py-2 px-4 font-medium text-gray-700">Saldo acum.</th>
                        <th className="text-left py-2 px-4 font-medium text-gray-700">Responsável</th>
                        <th className="text-left py-2 px-4 font-medium text-gray-700 w-48">Inconsistência</th>
                        <th className="text-center py-2 px-4 font-medium text-gray-700">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(caixaData?.itens?.length ?? 0) === 0 ? (
                        <tr><td colSpan={9} className="py-8 text-center text-gray-500">Nenhuma transação de caixa</td></tr>
                      ) : (
                        caixaData?.itens?.map((t) => (
                          <tr
                            key={t.id}
                            className={`border-b border-gray-100 hover:bg-gray-50/50 ${t.inconsistencia ? 'bg-amber-50/70' : ''}`}
                          >
                            <td className="py-2 px-4 text-gray-600">{formatDate(t.date)}</td>
                            <td className="py-2 px-4">
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                t.origin === 'AR' ? 'bg-green-100 text-green-800' :
                                t.origin === 'AP' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {t.origin}
                              </span>
                            </td>
                            <td className="py-2 px-4 text-gray-900 truncate max-w-[180px]" title={t.description}>{t.description}</td>
                            <td className="py-2 px-4 text-right font-semibold text-green-600">
                              {t.type === 'IN' ? formatCurrency(t.amount) : '-'}
                            </td>
                            <td className="py-2 px-4 text-right font-semibold text-red-600">
                              {t.type === 'OUT' ? formatCurrency(t.amount) : '-'}
                            </td>
                            <td className={`py-2 px-4 text-right font-bold ${t.saldoAcumulado >= 0 ? 'text-[#00B299]' : 'text-red-600'}`}>
                              {formatCurrency(t.saldoAcumulado)}
                            </td>
                            <td className="py-2 px-4 text-gray-600 text-xs">{t.createdByName}</td>
                            <td className="py-2 px-4 text-xs">
                              {t.inconsistencia ? (
                                <span className="text-amber-700 font-medium" title={t.inconsistencia}>{t.inconsistencia}</span>
                              ) : '-'}
                            </td>
                            <td className="py-2 px-4 text-center">
                              {t.inconsistencia ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-amber-700 border-amber-300 hover:bg-amber-50"
                                  disabled={revertendoCaixaId !== null}
                                  onClick={() => handleReverterCaixa(t)}
                                >
                                  {revertendoCaixaId === t.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    'Reverter'
                                  )}
                                </Button>
                              ) : (
                                <span className="text-gray-400 text-xs">—</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
        )}

        {/* Seção Pedidos entregues sem AR */}
        {abaAtiva === 'pedidos_sem_ar' && (
        <Card className="overflow-hidden border-red-200/50">
          <CardHeader className="bg-red-50/50">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="w-10 h-10 rounded-lg bg-red-500 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-white" />
              </div>
              Pedidos entregues sem contas a receber
            </CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              Pedidos com status Entregue que não possuem contas a receber. Geralmente ocorre em pedidos criados antes da migração ou sem parcelas informadas.
            </p>
          </CardHeader>
          <CardContent className="p-4">
            {loadingPedidosSemAR ? (
              <div className="py-12 text-center text-gray-500">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-red-500" />
                Carregando...
              </div>
            ) : (pedidosSemAR?.total ?? 0) === 0 ? (
              <div className="py-12 text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                <p className="text-green-700 font-medium">Nenhum pedido encontrado</p>
                <p className="text-sm text-gray-600 mt-1">Todos os pedidos entregues possuem contas a receber.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 rounded-lg text-sm">
                  <div>
                    <p className="text-gray-600">Pedidos sem AR</p>
                    <p className="font-bold text-red-600 text-lg">{pedidosSemAR?.total ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Valor total</p>
                    <p className="font-bold text-red-700">{formatCurrency(pedidosSemAR?.totalValor ?? 0)}</p>
                  </div>
                  <div className="flex items-end">
                    <Button
                      size="sm"
                      onClick={handleCorrigirPedidosSemAR}
                      disabled={corrigindo}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      {corrigindo ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Corrigindo...</>
                      ) : (
                        <><CheckCircle className="h-4 w-4 mr-2" />Criar AR para esses pedidos</>
                      )}
                    </Button>
                  </div>
                </div>
                <div className="overflow-x-auto border border-gray-200 rounded-lg max-h-[450px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 z-10 bg-gray-100">
                      <tr className="border-b border-gray-200">
                        <th className="w-8"></th>
                        <th className="text-left py-2 px-4 font-medium text-gray-700">Pedido</th>
                        <th className="text-left py-2 px-4 font-medium text-gray-700">Cliente</th>
                        <th className="text-left py-2 px-4 font-medium text-gray-700">Data</th>
                        <th className="text-right py-2 px-4 font-medium text-gray-700">Total</th>
                        <th className="text-left py-2 px-4 font-medium text-gray-700">Forma pag.</th>
                        <th className="text-left py-2 px-4 font-medium text-gray-700">Parcelas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pedidosSemAR?.itens?.map((p) => (
                        <React.Fragment key={p.id}>
                          <tr
                            key={p.id}
                            onClick={() => setPedidoExpandido(pedidoExpandido === p.id ? null : p.id)}
                            className="border-b border-gray-100 hover:bg-gray-50/80 bg-red-50/30 cursor-pointer"
                          >
                            <td className="py-2 px-2 text-gray-500">
                              {pedidoExpandido === p.id ? '▼' : '▶'}
                            </td>
                            <td className="py-2 px-4 text-gray-900 font-mono">#{p.id?.slice(0, 8)}</td>
                            <td className="py-2 px-4 text-gray-600">{p.customerName}</td>
                            <td className="py-2 px-4 text-gray-600">{formatDate(p.saleDate)}</td>
                            <td className="py-2 px-4 text-right font-semibold text-red-700">{formatCurrency(p.total)}</td>
                            <td className="py-2 px-4">
                              <span className={`px-2 py-0.5 rounded text-xs ${p.temFormaPagamento ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                                {p.temFormaPagamento ? 'Sim' : 'Não'}
                              </span>
                            </td>
                            <td className="py-2 px-4 text-gray-600">
                              {p.parcelas?.length ? `${p.parcelas.length} parcela(s)` : '—'}
                            </td>
                          </tr>
                          {pedidoExpandido === p.id && (
                            <tr>
                              <td colSpan={7} className="bg-gray-50 p-4 text-sm">
                                <div className="grid gap-4 md:grid-cols-2">
                                  <div>
                                    <p className="font-semibold text-gray-700 mb-2">Parcelas planejadas (installmentsJson)</p>
                                    {p.parcelas?.length ? (
                                      <table className="w-full text-xs">
                                        <thead><tr className="border-b"><th className="text-left py-1">#</th><th className="text-left py-1">Vencimento</th><th className="text-right py-1">Valor</th><th className="text-left py-1">Forma pag.</th></tr></thead>
                                        <tbody>
                                          {p.parcelas.map((parc) => (
                                            <tr key={parc.parcela} className="border-b border-gray-100">
                                              <td className="py-1">{parc.parcela}</td>
                                              <td>{formatDate(parc.dueDate)}</td>
                                              <td className="text-right font-semibold">{formatCurrency(parc.amount)}</td>
                                              <td>{parc.paymentMethodName ?? '—'}</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    ) : (
                                      <p className="text-amber-700">Sem parcelas gravadas (installmentsJson vazio ou null)</p>
                                    )}
                                  </div>
                                  <div>
                                    <p className="font-semibold text-gray-700 mb-2">Itens do pedido</p>
                                    {p.items?.length ? (
                                      <table className="w-full text-xs">
                                        <thead><tr className="border-b"><th className="text-left py-1">Produto</th><th className="text-right py-1">Qtde</th><th className="text-right py-1">Preço un.</th><th className="text-right py-1">Total</th></tr></thead>
                                        <tbody>
                                          {p.items.map((item, idx) => (
                                            <tr key={idx} className="border-b border-gray-100">
                                              <td className="py-1">{item.productName} {item.sku ? `(${item.sku})` : ''}</td>
                                              <td className="text-right">{item.quantity}</td>
                                              <td className="text-right">{formatCurrency(item.unitPrice)}</td>
                                              <td className="text-right font-semibold">{formatCurrency(item.total)}</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    ) : (
                                      <p className="text-gray-500">—</p>
                                    )}
                                  </div>
                                </div>
                                <p className="mt-2 text-xs text-gray-500">Status: {p.status} | Bonificação: {p.isBonificacao ? 'Sim' : 'Não'} | Criado em: {formatDate(p.createdAt)}</p>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
        )}

        {/* Seção Saídas duplicadas (mesmo pedido gerou mais de uma saída de estoque) */}
        {abaAtiva === 'estoque_saidas_duplicadas' && (
        <Card className="overflow-hidden border-amber-200/50">
          <CardHeader className="bg-amber-50/50">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center">
                <Package className="h-5 w-5 text-white" />
              </div>
              Saídas duplicadas de estoque
            </CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              Mesmo pedido de venda gerou mais de uma movimentação de saída (ex.: dois cliques em &quot;Confirmar entrega&quot;). Exclua a duplicata para corrigir o saldo. Mantenha apenas uma saída por pedido+produto.
            </p>
          </CardHeader>
          <CardContent className="p-4">
            {(estoqueSaidasDuplicadas?.total ?? 0) === 0 ? (
              <div className="py-12 text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                <p className="text-green-700 font-medium">Nenhuma duplicata encontrada</p>
                <p className="text-sm text-gray-600 mt-1">Não há saídas duplicadas no estoque.</p>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-600 mb-4">{estoqueSaidasDuplicadas?.resumo}</p>
                <div className="overflow-x-auto border border-gray-200 rounded-lg max-h-[350px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 z-10 bg-gray-100">
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-4 font-medium text-gray-700">Produto</th>
                        <th className="text-left py-2 px-4 font-medium text-gray-700">SKU</th>
                        <th className="text-right py-2 px-4 font-medium text-gray-700">Qtde</th>
                        <th className="text-left py-2 px-4 font-medium text-gray-700">Data</th>
                        <th className="text-left py-2 px-4 font-medium text-gray-700">Pedido</th>
                        <th className="text-left py-2 px-4 font-medium text-gray-700">Ação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {estoqueSaidasDuplicadas?.itens?.map((m) => (
                        <tr key={m.id} className="border-b border-gray-100 hover:bg-gray-50/50 bg-amber-50/30">
                          <td className="py-2 px-4 text-gray-900">{m.productName}</td>
                          <td className="py-2 px-4 text-gray-600">{m.sku}</td>
                          <td className="py-2 px-4 text-right font-semibold text-red-700">-{m.quantity}</td>
                          <td className="py-2 px-4 text-gray-600">{formatDate(m.createdAt)}</td>
                          <td className="py-2 px-4 text-gray-600 font-mono">#{m.referenceId?.slice(0, 8)}</td>
                          <td className="py-2 px-4">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleExcluirSaidaDuplicata(m.id)}
                              disabled={corrigindoId === m.id}
                              className="text-amber-700 border-amber-300 hover:bg-amber-100"
                            >
                              {corrigindoId === m.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>Excluir duplicata</>
                              )}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
        )}

        {/* Seção Estoque de vendas canceladas */}
        {abaAtiva === 'estoque_vendas_canceladas' && (
        <Card className="overflow-hidden border-orange-200/50">
          <CardHeader className="bg-orange-50/50">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="w-10 h-10 rounded-lg bg-orange-500 flex items-center justify-center">
                <Package className="h-5 w-5 text-white" />
              </div>
              Estoque de vendas canceladas
            </CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              Movimentações de saída de vendas que foram canceladas. Elas não devem aparecer no extrato do produto e nem afetar o saldo. Use &quot;Reverter estoque&quot; para criar compensações (entradas) e corrigir o saldo.
            </p>
          </CardHeader>
          <CardContent className="p-4">
            {(estoqueVendasCanceladas?.total ?? 0) === 0 ? (
              <div className="py-12 text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                <p className="text-green-700 font-medium">Nenhuma movimentação encontrada</p>
                <p className="text-sm text-gray-600 mt-1">Não há saídas de vendas canceladas no estoque.</p>
              </div>
            ) : (
              <>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                  <p className="text-sm text-gray-600">{estoqueVendasCanceladas?.resumo}</p>
                  <Button
                    size="sm"
                    onClick={handleReverterEstoqueVendasCanceladas}
                    disabled={corrigindo}
                    className="bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    {corrigindo ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Revertendo...</>
                    ) : (
                      <>Reverter estoque</>
                    )}
                  </Button>
                </div>
                <div className="overflow-x-auto border border-gray-200 rounded-lg max-h-[300px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 z-10 bg-gray-100">
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-4 font-medium text-gray-700">Produto</th>
                        <th className="text-left py-2 px-4 font-medium text-gray-700">SKU</th>
                        <th className="text-left py-2 px-4 font-medium text-gray-700">Cliente</th>
                        <th className="text-right py-2 px-4 font-medium text-gray-700">Qtde</th>
                        <th className="text-left py-2 px-4 font-medium text-gray-700">Data</th>
                        <th className="text-left py-2 px-4 font-medium text-gray-700">Pedido</th>
                      </tr>
                    </thead>
                    <tbody>
                      {estoqueVendasCanceladas?.itens?.map((m) => (
                        <tr key={m.id} className="border-b border-gray-100 hover:bg-gray-50/50 bg-orange-50/30">
                          <td className="py-2 px-4 text-gray-900">{m.productName}</td>
                          <td className="py-2 px-4 text-gray-600">{m.sku}</td>
                          <td className="py-2 px-4 text-gray-600">{m.customerName}</td>
                          <td className="py-2 px-4 text-right font-semibold text-red-700">-{m.quantity}</td>
                          <td className="py-2 px-4 text-gray-600">{formatDate(m.createdAt)}</td>
                          <td className="py-2 px-4 text-gray-600 font-mono">#{m.referenceId?.slice(0, 8)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
        )}

        {/* Seção Transferir AR entre pedidos duplicados */}
        {abaAtiva === 'transferir_ar' && (
        <Card className="overflow-hidden border-[#00B299]/30">
          <CardHeader className="bg-[#00B299]/5">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="w-10 h-10 rounded-lg bg-[#00B299] flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
              Transferir contas a receber entre pedidos
            </CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              Para pedidos duplicados: transferir AR do pedido cancelado para o pedido ativo (entregue). As AR em aberto terão o salesOrderId atualizado.
            </p>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid gap-4 md:grid-cols-2 max-w-2xl">
              <div>
                <Label className="text-sm font-medium">Transferir de (pedido cancelado com AR)</Label>
                <select
                  value={transferirDe}
                  onChange={(e) => setTransferirDe(e.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#00B299] focus:outline-none focus:ring-1 focus:ring-[#00B299]"
                >
                  <option value="">Selecione...</option>
                  {pedidosCanceladosComAR?.map((p) => (
                    <option key={p.id} value={p.id}>
                      #{p.id?.slice(0, 8)} — {p.customerName} — {formatDate(p.saleDate)} — {formatCurrency(p.totalAR)} ({p.qtdeAR} AR)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-sm font-medium">Para (pedido entregue sem AR)</Label>
                <select
                  value={transferirPara}
                  onChange={(e) => setTransferirPara(e.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#00B299] focus:outline-none focus:ring-1 focus:ring-[#00B299]"
                >
                  <option value="">Selecione...</option>
                  {pedidosSemAR?.itens?.map((p) => (
                    <option key={p.id} value={p.id}>
                      #{p.id?.slice(0, 8)} — {p.customerName} — {formatDate(p.saleDate)} — {formatCurrency(p.total)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-4">
              <Button
                size="sm"
                onClick={handleTransferirAR}
                disabled={corrigindo || !transferirDe || !transferirPara}
                className="bg-[#00B299] hover:bg-[#00B299]/90 text-white"
              >
                {corrigindo ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Transferindo...</>
                ) : (
                  <>Transferir AR</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
        )}
      </div>
    </div>
  )
}
