'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Activity, RefreshCw, Loader2, ShoppingCart, Package, TrendingUp, DollarSign, FileDown } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import ReportPDF from './ReportPDF'

export default function RaioXPage() {
  const { toast } = useToast()
  const pdfRef = useRef(null)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [showExportOverlay, setShowExportOverlay] = useState(false)
  const [periodType, setPeriodType] = useState('currentMonth')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')

  const loadRaioX = useCallback(async () => {
    try {
      setLoading(true)
      const today = new Date()
      let from, to

      switch (periodType) {
        case 'currentMonth':
          from = new Date(today.getFullYear(), today.getMonth(), 1)
          to = today
          break
        case 'lastMonth':
          from = new Date(today.getFullYear(), today.getMonth() - 1, 1)
          to = new Date(today.getFullYear(), today.getMonth(), 0)
          break
        case 'year':
          from = new Date(today.getFullYear(), 0, 1)
          to = today
          break
        case 'all':
          from = null
          to = null
          break
        case 'custom':
          from = customFrom ? new Date(customFrom) : null
          to = customTo ? new Date(customTo) : null
          break
        default:
          from = new Date(today.getFullYear(), today.getMonth(), 1)
          to = today
      }

      const params = {}
      if (periodType === 'all') {
        params.from = ''
        params.to = ''
      } else {
        if (from) params.from = from.toISOString().split('T')[0]
        if (to) params.to = to.toISOString().split('T')[0]
      }

      const response = await api.get('/raio-x', { params })
      setData(response.data.data)
    } catch (error) {
      console.error('Erro ao carregar Raio X:', error)
    } finally {
      setLoading(false)
    }
  }, [periodType, customFrom, customTo])

  useEffect(() => {
    loadRaioX()
  }, [loadRaioX])

  const getPeriodLabel = useCallback(() => {
    switch (periodType) {
      case 'currentMonth': return 'Mês atual'
      case 'lastMonth': return 'Mês anterior'
      case 'year': return 'Ano atual'
      case 'all': return 'Todos os períodos'
      case 'custom': return customFrom && customTo ? `${customFrom} a ${customTo}` : 'Período personalizado'
      default: return 'Mês atual'
    }
  }, [periodType, customFrom, customTo])

  const handleExportPDF = useCallback(async () => {
    if (!data) return
    try {
      setExporting(true)
      setShowExportOverlay(true)
      // Aguardar o React renderizar o overlay no DOM (setState é assíncrono)
      await new Promise((r) => setTimeout(r, 100))
      await new Promise((r) => requestAnimationFrame(r))
      await new Promise((r) => requestAnimationFrame(r))
      const element = pdfRef.current?.querySelector('#report-pdf-content') || pdfRef.current || document.getElementById('report-pdf-content')
      if (!element) throw new Error('Elemento do relatório não encontrado')
      const html2pdf = (await import('html2pdf.js')).default
      const filename = `relatorio-executivo-raio-x-${new Date().toISOString().split('T')[0]}.pdf`
      await html2pdf()
        .set({
          margin: [5, 5, 5, 5],
          filename,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { 
            scale: 2, 
            useCORS: true, 
            logging: false,
            windowWidth: element.scrollWidth,
            windowHeight: element.scrollHeight,
            allowTaint: false,
          },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait', compress: true },
          pagebreak: { mode: ['avoid-all', 'css', 'legacy'], avoid: ['.table-wrapper', 'thead', 'tr'] },
        })
        .from(element)
        .save()
    } catch (error) {
      console.error('Erro ao exportar PDF:', error)
      toast({
        title: 'Erro ao exportar',
        description: error?.message || 'Não foi possível gerar o PDF',
        variant: 'destructive',
      })
    } finally {
      setExporting(false)
      setShowExportOverlay(false)
    }
  }, [toast, data])

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#00B299]" />
      </div>
    )
  }

  const c = data?.compras ?? {}
  const p = data?.produtos ?? {}
  const v = data?.vendas ?? {}
  const f = data?.financeiro ?? {}

  return (
    <>
      <div className="p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#00B299] flex items-center gap-2">
              <Activity className="h-8 w-8" />
              Raio X
            </h1>
            <p className="text-gray-600 mt-1 text-sm">
              Visão executiva da operação – resumo para CEOs e investidores
            </p>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <select
              value={periodType}
              onChange={(e) => setPeriodType(e.target.value)}
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm min-w-[140px]"
            >
              <option value="currentMonth">Mês Atual</option>
              <option value="lastMonth">Mês Anterior</option>
              <option value="year">Ano Atual</option>
              <option value="all">Todos</option>
              <option value="custom">Personalizado</option>
            </select>
            {periodType === 'custom' && (
              <>
                <Input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="w-36 text-sm"
                />
                <Input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="w-36 text-sm"
                />
              </>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={loadRaioX}
              disabled={loading}
              className="hover:bg-[#00B299]/10"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPDF}
              disabled={exporting}
              className="hover:bg-[#00B299]/10"
            >
              <FileDown className={`h-4 w-4 mr-2 ${exporting ? 'animate-pulse' : ''}`} />
              {exporting ? 'Exportando...' : 'Exportar PDF'}
            </Button>
          </div>
        </div>

        <div className="space-y-8">
          {/* === COMPRAS === */}
          <Card className="overflow-hidden border-blue-200/50">
            <CardHeader className="bg-blue-50/50">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
                  <ShoppingCart className="h-5 w-5 text-white" />
                </div>
                Compras
              </CardTitle>
              <p className="text-sm text-gray-600 mt-2">
                Pedidos de compra recebidos ou aprovados no período, com fornecedor, valor total, fonte pagadora (caixa ou investidor) e status. Permite acompanhar o volume de aquisições e a origem do recurso utilizado.
              </p>
            </CardHeader>
            <CardContent className="p-4">
              <div className="overflow-x-auto max-h-[280px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 z-10 bg-gray-50">
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-4 font-medium text-gray-700">Pedido</th>
                      <th className="text-left py-2 px-4 font-medium text-gray-700">Fornecedor</th>
                      <th className="text-left py-2 px-4 font-medium text-gray-700">Data</th>
                      <th className="text-right py-2 px-4 font-medium text-gray-700">Total</th>
                      <th className="text-left py-2 px-4 font-medium text-gray-700">Fonte pagadora</th>
                      <th className="text-left py-2 px-4 font-medium text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(!c.pedidos || c.pedidos.length === 0) ? (
                      <tr><td colSpan={6} className="py-8 text-center text-gray-500">Nenhum pedido</td></tr>
                    ) : (
                      c.pedidos.map((po) => (
                        <tr key={po.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                          <td className="py-2 px-4 text-gray-900">#{po.id.slice(0, 8)}</td>
                          <td className="py-2 px-4 text-gray-600">{po.fornecedor}</td>
                          <td className="py-2 px-4 text-gray-600">{formatDate(po.data)}</td>
                          <td className="py-2 px-4 text-right font-semibold text-blue-600">{formatCurrency(po.total)}</td>
                          <td className="py-2 px-4 text-gray-600 text-xs">{po.fontePagadora || '-'}</td>
                          <td className="py-2 px-4"><span className="px-2 py-0.5 rounded text-xs bg-green-100 text-green-800">{po.statusLabel || po.status}</span></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* === PRODUTOS === */}
          <Card className="overflow-hidden border-purple-200/50">
            <CardHeader className="bg-purple-50/50">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center">
                  <Package className="h-5 w-5 text-white" />
                </div>
                Produtos
              </CardTitle>
              <p className="text-sm text-gray-600 mt-2">
                Resumo por produto: quantidade comprada (entradas por compra), saídas (vendas, ajustes, bonificações) e saldo atual. Produtos com movimentação no período ou saldo em estoque são listados para conferência do inventário.
              </p>
            </CardHeader>
            <CardContent className="p-4">
              <div className="overflow-x-auto max-h-[280px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 z-10 bg-gray-50">
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-4 font-medium text-gray-700">SKU</th>
                      <th className="text-left py-2 px-4 font-medium text-gray-700">Nome</th>
                      <th className="text-right py-2 px-4 font-medium text-gray-700">Comprada</th>
                      <th className="text-right py-2 px-4 font-medium text-gray-700">Saídas</th>
                      <th className="text-right py-2 px-4 font-medium text-gray-700">Saldo</th>
                      <th className="text-left py-2 px-4 font-medium text-gray-700">Unidade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(!p.detalhes || p.detalhes.length === 0) ? (
                      <tr><td colSpan={6} className="py-8 text-center text-gray-500">Nenhum produto com movimentação</td></tr>
                    ) : (
                      p.detalhes.map((prod) => (
                        <tr key={prod.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                          <td className="py-2 px-4 text-gray-900 font-medium">{prod.sku}</td>
                          <td className="py-2 px-4 text-gray-600">{prod.name}</td>
                          <td className="py-2 px-4 text-right font-semibold text-purple-600">{prod.comprada}</td>
                          <td className="py-2 px-4 text-right font-semibold text-purple-600">{prod.saidas}</td>
                          <td className="py-2 px-4 text-right font-bold text-purple-700">{prod.saldo}</td>
                          <td className="py-2 px-4 text-gray-600">{prod.unit}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* === VENDAS === */}
          <Card className="overflow-hidden border-green-200/50">
            <CardHeader className="bg-green-50/50">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                Vendas
              </CardTitle>
              <p className="text-sm text-gray-600 mt-2">
                Pedidos de venda no período, com quantidade, total vendido, custo, lucro e margem. O total vendido considera apenas pedidos entregues. A tabela detalha cada pedido com status (digitado, confirmado, entregue) e a rentabilidade por venda.
              </p>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4 p-4 bg-gray-50 rounded-lg text-sm">
                <div>
                  <p className="text-gray-600">Qtde pedidos</p>
                  <p className="font-bold text-gray-900">{v.qtdePedidos ?? 0}</p>
                </div>
                <div>
                  <p className="text-gray-600">Total vendido (entregues)</p>
                  <p className="font-bold text-green-600 text-lg">{formatCurrency(v.totalVendido ?? 0)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Custo</p>
                  <p className="font-semibold text-gray-900">{formatCurrency(v.custo ?? 0)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Lucro</p>
                  <p className="font-bold text-green-700">{formatCurrency(v.lucro ?? 0)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Margem</p>
                  <p className="font-bold text-green-700">{(v.margemPercent ?? 0).toFixed(1)}%</p>
                </div>
              </div>
              <div className="overflow-x-auto max-h-[280px] overflow-y-auto pb-4">
                <table className="w-full text-sm min-w-[900px]">
                  <thead className="sticky top-0 z-10 bg-gray-50">
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-2 font-medium text-gray-700 w-20">Pedido</th>
                      <th className="text-left py-2 px-2 font-medium text-gray-700 min-w-[120px]">Cliente</th>
                      <th className="text-left py-2 px-2 font-medium text-gray-700 w-24">Data</th>
                      <th className="text-left py-2 px-2 font-medium text-gray-700 w-24">Status</th>
                      <th className="text-right py-2 px-2 font-medium text-gray-700 whitespace-nowrap w-24">Total</th>
                      <th className="text-right py-2 px-2 font-medium text-gray-700 whitespace-nowrap w-24">Custo</th>
                      <th className="text-right py-2 px-2 font-medium text-gray-700 whitespace-nowrap w-24">Lucro</th>
                      <th className="text-right py-2 px-2 font-medium text-gray-700 whitespace-nowrap w-20">Margem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(!v.pedidos || v.pedidos.length === 0) ? (
                      <tr><td colSpan={8} className="py-8 text-center text-gray-500">Nenhum pedido</td></tr>
                    ) : (
                      v.pedidos.map((pv) => (
                        <tr key={pv.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                          <td className="py-2 px-2 text-gray-900 font-mono text-xs">#{pv.id.slice(0, 8)}</td>
                          <td className="py-2 px-2 text-gray-600 truncate max-w-[140px]">{pv.cliente}</td>
                          <td className="py-2 px-2 text-gray-600 text-xs">{formatDate(pv.data)}</td>
                          <td className="py-2 px-2">
                            <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                              pv.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                              pv.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-800' :
                              pv.status === 'DRAFT' ? 'bg-gray-100 text-gray-800' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {pv.statusLabel || pv.status}
                            </span>
                          </td>
                          <td className="py-2 px-2 text-right font-semibold text-green-600 whitespace-nowrap">{formatCurrency(pv.total)}</td>
                          <td className="py-2 px-2 text-right text-gray-600 whitespace-nowrap">{formatCurrency(pv.custo)}</td>
                          <td className="py-2 px-2 text-right font-semibold text-green-700 whitespace-nowrap">{formatCurrency(pv.lucro)}</td>
                          <td className="py-2 px-2 text-right font-semibold text-green-700 whitespace-nowrap">{(pv.margem ?? 0).toFixed(1)}%</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* === FINANCEIRO === */}
          <Card className="overflow-hidden border-[#00B299]/30">
            <CardHeader className="bg-[#00B299]/5">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="w-10 h-10 rounded-lg bg-[#00B299] flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
                Financeiro
              </CardTitle>
              <p className="text-sm text-gray-600 mt-2">
                Fluxo de caixa e posição de contas: contas pagas (AP já quitadas), contas a pagar em aberto, contas recebidas (AR já recebidas), contas a receber em aberto e saldo em caixa. As tabelas abaixo detalham cada grupo de títulos.
              </p>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4 p-4 bg-gray-50 rounded-lg text-sm">
                <div>
                  <p className="text-gray-600">Contas pagas</p>
                  <p className="font-semibold text-gray-900">{formatCurrency(f.contasPagas ?? 0)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Contas recebidas</p>
                  <p className="font-semibold text-gray-900">{formatCurrency(f.contasRecebidas ?? 0)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Saldo em caixa</p>
                  <p className={`font-bold text-lg ${(f.saldoCaixa ?? 0) >= 0 ? 'text-[#00B299]' : 'text-red-600'}`}>
                    {formatCurrency(f.saldoCaixa ?? 0)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Contas a pagar</p>
                  <p className="font-semibold text-[#FF8C00]">{formatCurrency(f.contasAPagar ?? 0)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Contas a receber</p>
                  <p className="font-semibold text-[#00B299]">{formatCurrency(f.contasAReceber ?? 0)}</p>
                </div>
              </div>
              <div className="space-y-6">
                {/* 1. Contas Pagas */}
                <div>
                  <h4 className="font-semibold text-green-700 mb-2">Contas Pagas</h4>
                  <div className="overflow-x-auto max-h-[220px] overflow-y-auto border border-gray-200 rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 z-10 bg-gray-50">
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-2 px-4 font-medium text-gray-700">Descrição</th>
                          <th className="text-left py-2 px-4 font-medium text-gray-700">Fornecedor</th>
                          <th className="text-left py-2 px-4 font-medium text-gray-700">Pagamento</th>
                          <th className="text-right py-2 px-4 font-medium text-gray-700">Valor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(!f.detalhesAPPagas || f.detalhesAPPagas.length === 0) ? (
                          <tr><td colSpan={4} className="py-6 text-center text-gray-500">Nenhuma conta paga</td></tr>
                        ) : (
                          f.detalhesAPPagas.map((ap) => (
                            <tr key={ap.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                              <td className="py-2 px-4 text-gray-900 truncate max-w-[120px]">{ap.descricao}</td>
                              <td className="py-2 px-4 text-gray-600">{ap.fornecedor}</td>
                              <td className="py-2 px-4 text-gray-600">{formatDate(ap.pagamento)}</td>
                              <td className="py-2 px-4 text-right font-semibold text-green-700">{formatCurrency(ap.valor)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                {/* 2. Contas a Pagar (abertas) */}
                <div>
                  <h4 className="font-semibold text-[#FF8C00] mb-2">Contas a Pagar (abertas)</h4>
                  <div className="overflow-x-auto max-h-[220px] overflow-y-auto border border-gray-200 rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 z-10 bg-gray-50">
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-2 px-4 font-medium text-gray-700">Descrição</th>
                          <th className="text-left py-2 px-4 font-medium text-gray-700">Fornecedor</th>
                          <th className="text-left py-2 px-4 font-medium text-gray-700">Vencimento</th>
                          <th className="text-right py-2 px-4 font-medium text-gray-700">Valor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(!f.detalhesAP || f.detalhesAP.length === 0) ? (
                          <tr><td colSpan={4} className="py-6 text-center text-gray-500">Nenhuma conta a pagar</td></tr>
                        ) : (
                          f.detalhesAP.map((ap) => (
                            <tr key={ap.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                              <td className="py-2 px-4 text-gray-900 truncate max-w-[120px]">{ap.descricao}</td>
                              <td className="py-2 px-4 text-gray-600">{ap.fornecedor}</td>
                              <td className="py-2 px-4 text-gray-600">{formatDate(ap.vencimento)}</td>
                              <td className="py-2 px-4 text-right font-semibold text-[#FF8C00]">{formatCurrency(ap.valor)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                {/* 3. Contas Recebidas */}
                <div>
                  <h4 className="font-semibold text-green-700 mb-2">Contas Recebidas</h4>
                  <div className="overflow-x-auto max-h-[220px] overflow-y-auto border border-gray-200 rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 z-10 bg-gray-50">
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-2 px-4 font-medium text-gray-700">Descrição</th>
                          <th className="text-left py-2 px-4 font-medium text-gray-700">Cliente</th>
                          <th className="text-left py-2 px-4 font-medium text-gray-700">Recebimento</th>
                          <th className="text-right py-2 px-4 font-medium text-gray-700">Valor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(!f.detalhesARRecebidas || f.detalhesARRecebidas.length === 0) ? (
                          <tr><td colSpan={4} className="py-6 text-center text-gray-500">Nenhuma conta recebida</td></tr>
                        ) : (
                          f.detalhesARRecebidas.map((ar) => (
                            <tr key={ar.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                              <td className="py-2 px-4 text-gray-900 truncate max-w-[120px]">{ar.descricao}</td>
                              <td className="py-2 px-4 text-gray-600">{ar.cliente}</td>
                              <td className="py-2 px-4 text-gray-600">{formatDate(ar.recebimento)}</td>
                              <td className="py-2 px-4 text-right font-semibold text-green-700">{formatCurrency(ar.valor)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                {/* 4. Contas a Receber (abertas) */}
                <div>
                  <h4 className="font-semibold text-[#00B299] mb-2">Contas a Receber (abertas)</h4>
                  <div className="overflow-x-auto max-h-[220px] overflow-y-auto border border-gray-200 rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 z-10 bg-gray-50">
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-2 px-4 font-medium text-gray-700">Descrição</th>
                          <th className="text-left py-2 px-4 font-medium text-gray-700">Cliente</th>
                          <th className="text-left py-2 px-4 font-medium text-gray-700">Vencimento</th>
                          <th className="text-right py-2 px-4 font-medium text-gray-700">Valor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(!f.detalhesAR || f.detalhesAR.length === 0) ? (
                          <tr><td colSpan={4} className="py-6 text-center text-gray-500">Nenhuma conta a receber</td></tr>
                        ) : (
                          f.detalhesAR.map((ar) => (
                            <tr key={ar.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                              <td className="py-2 px-4 text-gray-900 truncate max-w-[120px]">{ar.descricao}</td>
                              <td className="py-2 px-4 text-gray-600">{ar.cliente}</td>
                              <td className="py-2 px-4 text-gray-600">{formatDate(ar.vencimento)}</td>
                              <td className="py-2 px-4 text-right font-semibold text-[#00B299]">{formatCurrency(ar.valor)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        </div>
      </div>

      {/* Overlay com relatório para exportação PDF - visível brevemente durante a captura */}
      {showExportOverlay && data && (
        <div
          ref={pdfRef}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999,
            backgroundColor: '#fff',
            overflow: 'auto',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            padding: 16,
          }}
        >
          <ReportPDF data={data} periodLabel={getPeriodLabel()} />
        </div>
      )}
    </>
  )
}
