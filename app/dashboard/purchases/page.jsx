'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Plus, ShoppingCart, ExternalLink, X, Loader2, Package, DollarSign } from 'lucide-react'
import Link from 'next/link'

const STATUS_FILTERS = [
  { value: '', label: 'Todos' },
  { value: 'DRAFT', label: 'Rascunho' },
  { value: 'APPROVED', label: 'Aprovado' },
  { value: 'RECEIVED', label: 'Recebido' },
  { value: 'CANCELED', label: 'Cancelados' },
]

const STATUS_LABELS = { DRAFT: 'Rascunho', APPROVED: 'Aprovado', RECEIVED: 'Recebido', CANCELED: 'Cancelado' }

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedPurchase, setSelectedPurchase] = useState(null)
  const [selectedPurchaseDetails, setSelectedPurchaseDetails] = useState(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [activeTab, setActiveTab] = useState('items')

  const loadPurchases = async () => {
    try {
      setLoading(true)
      const params = { limit: 200 }
      if (statusFilter) params.status = statusFilter
      const response = await api.get('/purchases', { params })
      const data = response.data.data
      setPurchases(data)
      setSelectedPurchase((prev) => (prev && data.find((p) => p.id === prev.id) ? prev : null))
      setSelectedPurchaseDetails((prev) => (prev && data.find((p) => p.id === prev.id) ? prev : null))
    } catch (error) {
      console.error('Erro ao carregar compras:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPurchases()
  }, [statusFilter])

  const handleSelectPurchase = async (purchase) => {
    if (selectedPurchase?.id === purchase.id) return
    setSelectedPurchase(purchase)
    setSelectedPurchaseDetails(null)
    setLoadingDetails(true)
    setActiveTab('items')
    try {
      const response = await api.get(`/purchases/${purchase.id}`)
      setSelectedPurchaseDetails(response.data.data)
    } catch (error) {
      console.error('Erro ao carregar detalhes:', error)
      setSelectedPurchase(null)
    } finally {
      setLoadingDetails(false)
    }
  }

  const handleClosePanel = () => {
    setSelectedPurchase(null)
    setSelectedPurchaseDetails(null)
  }

  const getStatusColor = (status) => {
    const colors = {
      DRAFT: 'bg-gray-100 text-gray-800',
      APPROVED: 'bg-[#00B299]/10 text-[#00B299]',
      RECEIVED: 'bg-green-100 text-green-800',
      CANCELED: 'bg-red-100 text-red-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#00B299]">Compras</h1>
            <p className="text-gray-600 mt-1 text-sm md:text-base">Gerencie pedidos de compra</p>
          </div>
          <Button asChild className="bg-[#00B299] hover:shadow-glow-lg transition-all w-full sm:w-auto">
            <Link href="/dashboard/purchases/new">
              <Plus className="h-4 w-4 mr-2" />
              Nova Compra
            </Link>
          </Button>
        </div>

        {/* Filtro por status */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
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
        </div>

        {/* Tabela de pedidos */}
        <Card className="mb-4 overflow-hidden">
          <div className="overflow-x-auto max-h-[320px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-gray-50">
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Pedido</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Fornecedor</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Data</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Total</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700 w-24">Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-500">
                      Carregando...
                    </td>
                  </tr>
                ) : purchases.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-500">
                      Nenhum pedido encontrado
                    </td>
                  </tr>
                ) : (
                  purchases.map((purchase) => (
                    <tr
                      key={purchase.id}
                      onClick={() => handleSelectPurchase(purchase)}
                      className={`border-b border-gray-100 cursor-pointer transition-colors hover:bg-[#00B299]/5 ${
                        selectedPurchase?.id === purchase.id ? 'bg-[#00B299]/10' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-mono text-gray-900">#{purchase.id.slice(0, 8)}</td>
                      <td className="py-3 px-4 text-gray-700">{purchase.supplier?.name || '-'}</td>
                      <td className="py-3 px-4 text-gray-600">{formatDate(purchase.issueDate)}</td>
                      <td className="py-3 px-4 text-right font-semibold text-[#00B299]">
                        {formatCurrency(Number(purchase.total))}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            purchase.status
                          )}`}
                        >
                          {STATUS_LABELS[purchase.status] || purchase.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" asChild className="h-8 px-2 text-[#00B299] hover:bg-[#00B299]/10">
                          <Link href={`/dashboard/purchases/${purchase.id}`}>
                            <ExternalLink className="h-4 w-4" title="Ver detalhes" />
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {!loading && purchases.length > 0 && (
            <div className="border-t border-gray-200 bg-gray-50 px-4 py-3 flex flex-wrap items-center gap-4 text-sm">
              <span className="font-semibold text-gray-700">
                Qtde de pedidos: <span className="text-[#00B299]">{purchases.length}</span>
              </span>
              <span className="font-semibold text-gray-700">
                Total comprado: <span className="text-[#00B299] text-lg">
                  {formatCurrency(purchases.reduce((sum, p) => sum + Number(p.total), 0))}
                </span>
              </span>
            </div>
          )}
        </Card>

        {/* Painel com abas (Itens | Contas a Pagar) */}
        {selectedPurchase && (
          <Card className="overflow-hidden">
            <CardHeader className="py-3 px-4 bg-gray-50 border-b flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold">
                Pedido #{selectedPurchase.id.slice(0, 8)} – {selectedPurchase.supplier?.name}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/dashboard/purchases/${selectedPurchase.id}`}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Ver detalhes
                  </Link>
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleClosePanel} title="Fechar">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
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
                  onClick={() => setActiveTab('ap')}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === 'ap'
                      ? 'text-[#00B299] border-b-2 border-[#00B299] bg-[#00B299]/5'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <DollarSign className="h-4 w-4" />
                  Contas a pagar
                </button>
              </div>

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
                        {(selectedPurchaseDetails?.items || selectedPurchase?.items || []).map((item) => (
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

                  {activeTab === 'ap' && (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-gray-50">
                          <th className="text-left py-2 px-4 font-medium text-gray-700">Descrição</th>
                          <th className="text-left py-2 px-4 font-medium text-gray-700">Vencimento</th>
                          <th className="text-left py-2 px-4 font-medium text-gray-700">Forma pagamento</th>
                          <th className="text-right py-2 px-4 font-medium text-gray-700">Valor</th>
                          <th className="text-left py-2 px-4 font-medium text-gray-700">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(selectedPurchaseDetails?.accountsPayable || []).length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-gray-500">
                              Nenhuma conta a pagar
                            </td>
                          </tr>
                        ) : (
                          (selectedPurchaseDetails?.accountsPayable || []).map((ap) => (
                            <tr key={ap.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                              <td className="py-2 px-4 text-gray-900">{ap.description}</td>
                              <td className="py-2 px-4 text-gray-600">{formatDate(ap.dueDate)}</td>
                              <td className="py-2 px-4 text-gray-600">{ap.paymentMethod?.name || '-'}</td>
                              <td className="py-2 px-4 text-right font-semibold text-[#FF8C00]">
                                {formatCurrency(Number(ap.amount))}
                              </td>
                              <td className="py-2 px-4">
                                <span
                                  className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                                    ap.status === 'OPEN' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                                  }`}
                                >
                                  {ap.status === 'OPEN' ? 'Aberta' : ap.status === 'PAID' ? 'Paga' : ap.status}
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

        {!loading && purchases.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhuma compra encontrada para o filtro selecionado</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
