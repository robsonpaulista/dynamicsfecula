'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Plus, ShoppingCart, XCircle, Loader2, X, ExternalLink, Package, DollarSign, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'

const STATUS_FILTERS = [
  { value: '', label: 'Todos' },
  { value: 'DRAFT', label: 'Digitado (Rascunho)' },
  { value: 'CONFIRMED', label: 'Confirmado' },
  { value: 'DELIVERED', label: 'Faturado (Entregue)' },
  { value: 'CANCELED', label: 'Cancelados' },
]

export default function SalesPage() {
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(true)
  const [cancelingId, setCancelingId] = useState(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [sortColumn, setSortColumn] = useState('saleDate')
  const [sortDirection, setSortDirection] = useState('desc')
  const [filterPedido, setFilterPedido] = useState('')
  const [filterCliente, setFilterCliente] = useState('')
  const [filterTotal, setFilterTotal] = useState('')
  const [selectedSale, setSelectedSale] = useState(null)
  const [selectedSaleDetails, setSelectedSaleDetails] = useState(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [activeTab, setActiveTab] = useState('items')
  const { toast } = useToast()

  const loadSales = async () => {
    try {
      setLoading(true)
      const params = { limit: 100 }
      if (statusFilter) params.status = statusFilter
      if (dateFrom) params.from = dateFrom
      if (dateTo) params.to = dateTo
      const response = await api.get('/sales', { params })
      setSales(response.data.data)
      if (selectedSale && !response.data.data.find(s => s.id === selectedSale.id)) {
        setSelectedSale(null)
        setSelectedSaleDetails(null)
      }
    } catch (error) {
      console.error('Erro ao carregar vendas:', error)
      toast({ title: 'Erro', description: 'Erro ao carregar vendas', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSales()
  }, [statusFilter, dateFrom, dateTo])

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

  const canCancel = (sale) => sale.status !== 'DELIVERED' && sale.status !== 'CANCELED'

  const handleCancel = async (e, sale) => {
    e.stopPropagation()
    if (!confirm('Deseja realmente cancelar este pedido? Esta ação não pode ser desfeita.')) return
    setCancelingId(sale.id)
    try {
      await api.patch(`/sales/${sale.id}`, { status: 'CANCELED' })
      toast({ title: 'Sucesso', description: 'Pedido cancelado com sucesso' })
      loadSales()
      if (selectedSale?.id === sale.id) {
        setSelectedSale(null)
        setSelectedSaleDetails(null)
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: error.response?.data?.error?.message || 'Erro ao cancelar pedido',
        variant: 'destructive',
      })
    } finally {
      setCancelingId(null)
    }
  }

  const handleSelectSale = async (sale) => {
    if (selectedSale?.id === sale.id) return
    setSelectedSale(sale)
    setSelectedSaleDetails(null)
    setLoadingDetails(true)
    setActiveTab('items')
    try {
      const response = await api.get(`/sales/${sale.id}`)
      setSelectedSaleDetails(response.data.data)
    } catch (error) {
      toast({ title: 'Erro', description: 'Erro ao carregar detalhes', variant: 'destructive' })
      setSelectedSale(null)
    } finally {
      setLoadingDetails(false)
    }
  }

  const handleClosePanel = () => {
    setSelectedSale(null)
    setSelectedSaleDetails(null)
  }

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const SortIcon = ({ col }) => {
    if (sortColumn !== col) return <ArrowUpDown className="h-3.5 w-3.5 ml-1 opacity-50" />
    return sortDirection === 'asc' ? (
      <ArrowUp className="h-3.5 w-3.5 ml-1 text-[#00B299]" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5 ml-1 text-[#00B299]" />
    )
  }

  const filteredAndSortedSales = (() => {
    let result = [...sales]
    const pedido = filterPedido.trim().toLowerCase()
    const cliente = filterCliente.trim().toLowerCase()
    const totalStr = filterTotal.trim().replace(/[^\d]/g, '')

    if (pedido) {
      result = result.filter((s) => s.id.slice(0, 8).toLowerCase().includes(pedido))
    }
    if (cliente) {
      result = result.filter((s) => (s.customer?.name || '').toLowerCase().includes(cliente))
    }
    if (totalStr) {
      const totalDigits = (v) => String(Math.round(Number(v) * 100)).replace(/\D/g, '')
      result = result.filter((s) => totalDigits(s.total).includes(totalStr))
    }

    result.sort((a, b) => {
      let va, vb
      switch (sortColumn) {
        case 'id':
          va = a.id
          vb = b.id
          break
        case 'customer':
          va = (a.customer?.name || '').toLowerCase()
          vb = (b.customer?.name || '').toLowerCase()
          break
        case 'saleDate':
          va = new Date(a.saleDate).getTime()
          vb = new Date(b.saleDate).getTime()
          break
        case 'total':
          va = Number(a.total)
          vb = Number(b.total)
          break
        case 'status':
          va = (getStatusLabel(a.status) || '').toLowerCase()
          vb = (getStatusLabel(b.status) || '').toLowerCase()
          break
        default:
          va = new Date(a.createdAt || a.saleDate).getTime()
          vb = new Date(b.createdAt || b.saleDate).getTime()
      }
      if (typeof va === 'string' && typeof vb === 'string') {
        return sortDirection === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
      }
      if (va < vb) return sortDirection === 'asc' ? -1 : 1
      if (va > vb) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    return result
  })()

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#00B299]">Vendas</h1>
            <p className="text-gray-600 mt-1 text-sm md:text-base">Gerencie pedidos de venda</p>
          </div>
          <Button asChild className="bg-[#00B299] hover:shadow-glow-lg transition-all w-full sm:w-auto">
            <Link href="/dashboard/sales/new">
              <Plus className="h-4 w-4 mr-2" />
              Nova Venda
            </Link>
          </Button>
        </div>

        {/* Filtros */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-gray-700">Filtrar:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00B299] focus:border-transparent bg-white"
          >
            {STATUS_FILTERS.map((f) => (
              <option key={f.value || 'all'} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-2">
            <label htmlFor="date-from" className="text-sm text-gray-600">De:</label>
            <input
              id="date-from"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00B299] focus:border-transparent bg-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="date-to" className="text-sm text-gray-600">Até:</label>
            <input
              id="date-to"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00B299] focus:border-transparent bg-white"
            />
          </div>
        </div>

        {/* Tabela de pedidos */}
        <Card className="mb-4 overflow-hidden">
          <div className="overflow-x-auto max-h-[320px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-gray-50">
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-4 font-semibold text-gray-700">
                    <button
                      type="button"
                      onClick={() => handleSort('id')}
                      className="flex items-center hover:text-[#00B299] transition-colors"
                    >
                      Pedido
                      <SortIcon col="id" />
                    </button>
                  </th>
                  <th className="text-left py-2 px-4 font-semibold text-gray-700">
                    <button
                      type="button"
                      onClick={() => handleSort('customer')}
                      className="flex items-center hover:text-[#00B299] transition-colors"
                    >
                      Cliente
                      <SortIcon col="customer" />
                    </button>
                  </th>
                  <th className="text-left py-2 px-4 font-semibold text-gray-700">
                    <button
                      type="button"
                      onClick={() => handleSort('saleDate')}
                      className="flex items-center hover:text-[#00B299] transition-colors"
                    >
                      Data
                      <SortIcon col="saleDate" />
                    </button>
                  </th>
                  <th className="text-right py-2 px-4 font-semibold text-gray-700">
                    <button
                      type="button"
                      onClick={() => handleSort('total')}
                      className="flex items-center justify-end ml-auto hover:text-[#00B299] transition-colors"
                    >
                      Total
                      <SortIcon col="total" />
                    </button>
                  </th>
                  <th className="text-left py-2 px-4 font-semibold text-gray-700">
                    <button
                      type="button"
                      onClick={() => handleSort('status')}
                      className="flex items-center hover:text-[#00B299] transition-colors"
                    >
                      Status
                      <SortIcon col="status" />
                    </button>
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700 w-24">Ações</th>
                </tr>
                <tr className="border-b border-gray-200 bg-gray-50/80">
                  <th className="py-1.5 px-4">
                    <input
                      type="text"
                      placeholder="Buscar pedido..."
                      value={filterPedido}
                      onChange={(e) => setFilterPedido(e.target.value)}
                      className="w-full max-w-[120px] rounded border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#00B299]"
                    />
                  </th>
                  <th className="py-1.5 px-4">
                    <input
                      type="text"
                      placeholder="Buscar cliente..."
                      value={filterCliente}
                      onChange={(e) => setFilterCliente(e.target.value)}
                      className="w-full max-w-[140px] rounded border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#00B299]"
                    />
                  </th>
                  <th className="py-1.5 px-4" />
                  <th className="py-1.5 px-4 text-right">
                    <input
                      type="text"
                      placeholder="Buscar total..."
                      value={filterTotal}
                      onChange={(e) => setFilterTotal(e.target.value.replace(/[^\d.,]/g, ''))}
                      className="w-full max-w-[100px] ml-auto rounded border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#00B299]"
                    />
                  </th>
                  <th className="py-1.5 px-4" colSpan={2} />
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-500">
                      Carregando...
                    </td>
                  </tr>
                ) : sales.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-500">
                      Nenhum pedido encontrado
                    </td>
                  </tr>
                ) : filteredAndSortedSales.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-500">
                      Nenhum pedido corresponde aos filtros
                    </td>
                  </tr>
                ) : (
                  filteredAndSortedSales.map((sale) => (
                    <tr
                      key={sale.id}
                      onClick={() => handleSelectSale(sale)}
                      className={`border-b border-gray-100 cursor-pointer transition-colors hover:bg-[#00B299]/5 ${
                        selectedSale?.id === sale.id ? 'bg-[#00B299]/10' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-mono text-gray-900">#{sale.id.slice(0, 8)}</td>
                      <td className="py-3 px-4 text-gray-700">{sale.customer?.name || '-'}</td>
                      <td className="py-3 px-4 text-gray-600">{formatDate(sale.saleDate)}</td>
                      <td className="py-3 px-4 text-right font-semibold text-[#00B299]">
                        {formatCurrency(Number(sale.total))}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            sale.status
                          )}`}
                        >
                          {getStatusLabel(sale.status)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="h-8 px-2 text-[#00B299] hover:bg-[#00B299]/10"
                          >
                            <Link href={`/dashboard/sales/${sale.id}`}>
                              <ExternalLink className="h-4 w-4" title="Ver detalhes" />
                            </Link>
                          </Button>
                          {canCancel(sale) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-red-600 hover:bg-red-50"
                              onClick={(e) => handleCancel(e, sale)}
                              disabled={cancelingId === sale.id}
                              title="Cancelar pedido"
                            >
                              {cancelingId === sale.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <XCircle className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {/* Totalizador */}
          {!loading && filteredAndSortedSales.length > 0 && (
            <div className="border-t border-gray-200 bg-gray-50 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-4 text-sm">
                <span className="font-semibold text-gray-700">
                  Qtde de pedidos: <span className="text-[#00B299]">{filteredAndSortedSales.length}</span>
                  {(filterPedido || filterCliente || filterTotal) && sales.length !== filteredAndSortedSales.length && (
                    <span className="text-gray-500 ml-1">(de {sales.length})</span>
                  )}
                </span>
                <span className="font-semibold text-gray-700">
                  Total vendido: <span className="text-[#00B299] text-lg">{formatCurrency(filteredAndSortedSales.reduce((sum, s) => sum + Number(s.total), 0))}</span>
                </span>
              </div>
            </div>
          )}
        </Card>

        {/* Painel com abas (Itens | Contas a Receber) - exibido quando há pedido selecionado */}
        {selectedSale && (
          <Card className="overflow-hidden">
            <CardHeader className="py-3 px-4 bg-gray-50 border-b flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold">
                Pedido #{selectedSale.id.slice(0, 8)} – {selectedSale.customer?.name}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/dashboard/sales/${selectedSale.id}`}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Ver detalhes
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleClosePanel}
                  title="Fechar"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {/* Tabs */}
              <div className="flex border-b border-gray-200">
                <button
                  type="button"
                  onClick={() => setActiveTab('items')}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === 'items'
                      ? 'text-[#00B299] border-b-2 border-[#00B299] bg-[#00B299]/5'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Package className="h-4 w-4" />
                  Itens do pedido
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
                  <DollarSign className="h-4 w-4" />
                  Contas a receber
                </button>
              </div>

              {/* Conteúdo das abas */}
              {loadingDetails ? (
                <div className="py-12 flex justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-[#00B299]" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  {activeTab === 'items' && (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-gray-50">
                          <th className="text-left py-2 px-4 font-medium text-gray-700">Produto</th>
                          <th className="text-left py-2 px-4 font-medium text-gray-700">SKU</th>
                          <th className="text-right py-2 px-4 font-medium text-gray-700">Qtd</th>
                          <th className="text-right py-2 px-4 font-medium text-gray-700">Preço un.</th>
                          <th className="text-right py-2 px-4 font-medium text-gray-700">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(selectedSaleDetails?.items || selectedSale?.items || []).map((item) => (
                          <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                            <td className="py-2 px-4 text-gray-900">
                              {item.product?.name || 'Produto não encontrado'}
                            </td>
                            <td className="py-2 px-4 text-gray-600">{item.product?.sku || '-'}</td>
                            <td className="py-2 px-4 text-right">
                              {Number(item.quantity)} {item.product?.unit || 'un'}
                            </td>
                            <td className="py-2 px-4 text-right text-gray-600">
                              {formatCurrency(Number(item.unitPrice))}
                            </td>
                            <td className="py-2 px-4 text-right font-semibold text-[#00B299]">
                              {formatCurrency(Number(item.total))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {activeTab === 'ar' && (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-gray-50">
                          <th className="text-left py-2 px-4 font-medium text-gray-700">Descrição</th>
                          <th className="text-left py-2 px-4 font-medium text-gray-700">Vencimento</th>
                          <th className="text-left py-2 px-4 font-medium text-gray-700">Forma de pagamento</th>
                          <th className="text-right py-2 px-4 font-medium text-gray-700">Valor</th>
                          <th className="text-left py-2 px-4 font-medium text-gray-700">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(selectedSaleDetails?.accountsReceivable || []).length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-gray-500">
                              Nenhuma conta a receber
                            </td>
                          </tr>
                        ) : (
                          (selectedSaleDetails?.accountsReceivable || []).map((ar) => (
                            <tr key={ar.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                              <td className="py-2 px-4 text-gray-900">{ar.description}</td>
                              <td className="py-2 px-4 text-gray-600">{formatDate(ar.dueDate)}</td>
                              <td className="py-2 px-4 text-gray-600">{ar.paymentMethod?.name || '-'}</td>
                              <td className="py-2 px-4 text-right font-semibold text-[#00B299]">
                                {formatCurrency(Number(ar.amount))}
                              </td>
                              <td className="py-2 px-4">
                                <span
                                  className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                                    ar.status === 'OPEN' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                                  }`}
                                >
                                  {ar.status === 'OPEN' ? 'Aberta' : ar.status === 'RECEIVED' ? 'Recebida' : ar.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {!loading && sales.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhuma venda encontrada para o filtro selecionado</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
