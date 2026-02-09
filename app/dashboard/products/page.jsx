'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Plus, Package, ExternalLink, X, Loader2, History } from 'lucide-react'
import Link from 'next/link'

const TYPE_LABELS = { MP: 'Matéria-prima', PA: 'Produto acabado', SERVICO: 'Serviço' }

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [selectedProductDetails, setSelectedProductDetails] = useState(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [historyDateFrom, setHistoryDateFrom] = useState('')
  const [historyDateTo, setHistoryDateTo] = useState('')
  const [reconciling, setReconciling] = useState(false)

  const loadProducts = async () => {
    try {
      setLoading(true)
      const params = { limit: 200 }
      if (search) params.search = search
      const response = await api.get('/products', { params })
      const data = response.data.data
      setProducts(data)
      setSelectedProduct((prev) => (prev && data.find((p) => p.id === prev.id) ? prev : null))
      setSelectedProductDetails((prev) => (prev && data.find((p) => p.id === prev.id) ? prev : null))
    } catch (error) {
      console.error('Erro ao carregar produtos:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()
  }, [search])

  const loadProductDetails = async (product) => {
    setSelectedProduct(product)
    setSelectedProductDetails(null)
    setLoadingDetails(true)
    try {
      const params = {}
      if (historyDateFrom) params.from = historyDateFrom
      if (historyDateTo) params.to = historyDateTo
      const response = await api.get(`/products/${product.id}`, { params })
      setSelectedProductDetails(response.data.data)
    } catch (error) {
      console.error('Erro ao carregar detalhes:', error)
      setSelectedProduct(null)
    } finally {
      setLoadingDetails(false)
    }
  }

  const handleSelectProduct = (product) => {
    if (selectedProduct?.id === product.id) return
    loadProductDetails(product)
  }

  const handleHistoryFilterChange = () => {
    if (selectedProduct) {
      loadProductDetails(selectedProduct)
    }
  }

  const handleClosePanel = () => {
    setSelectedProduct(null)
    setSelectedProductDetails(null)
  }

  const handleReconcileBalance = async () => {
    if (!selectedProduct?.id) return
    setReconciling(true)
    try {
      await api.post(`/products/${selectedProduct.id}/reconcile`)
      await loadProductDetails(selectedProduct)
      await loadProducts()
    } catch (error) {
      console.error('Erro ao corrigir saldo:', error)
    } finally {
      setReconciling(false)
    }
  }

  const getMovementTypeLabel = (type) => {
    const labels = { IN: 'Entrada', OUT: 'Saída', ADJUST: 'Ajuste' }
    return labels[type] || type
  }

  const getMovementTypeColor = (type) => {
    const colors = { IN: 'bg-green-100 text-green-800', OUT: 'bg-red-100 text-red-800', ADJUST: 'bg-amber-100 text-amber-800' }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  const getReferenceLabel = (movement) => {
    if (!movement.reference) return movement.note || '-'
    if (movement.reference.type === 'PURCHASE' && movement.reference.supplier) {
      return `Compra - ${movement.reference.supplier.name}`
    }
    if (movement.reference.type === 'SALE' && movement.reference.customer) {
      const cancelado = movement.reference.isCanceled ? ' (Cancelado)' : ''
      return `Venda - ${movement.reference.customer.name}${cancelado}`
    }
    return movement.note || movement.referenceType || '-'
  }

  const getReferenceIdLabel = (movement) => {
    if (!movement.referenceId) return '-'
    const shortId = String(movement.referenceId).slice(0, 8)
    const prefix = {
      PURCHASE: 'Compra',
      SALE: 'Venda',
      RETURN: 'Devolução',
      INVENTORY: 'Inventário',
      MANUAL: 'Ajuste',
    }
    const typeLabel = prefix[movement.referenceType] || movement.referenceType || 'Ref'
    const cancelado = movement.reference?.type === 'SALE' && movement.reference?.isCanceled ? ' (Cancelado)' : ''
    return `${typeLabel} #${shortId}${cancelado}`
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#00B299]">Produtos</h1>
            <p className="text-gray-600 mt-1 text-sm md:text-base">Gerencie seu catálogo de produtos</p>
          </div>
          <Button asChild className="bg-[#00B299] hover:shadow-glow-lg transition-all w-full sm:w-auto">
            <Link href="/dashboard/products/new">
              <Plus className="h-4 w-4 mr-2" />
              Novo Produto
            </Link>
          </Button>
        </div>

        {/* Filtro de busca */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Buscar por nome ou SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm w-full max-w-sm focus:outline-none focus:ring-2 focus:ring-[#00B299] focus:border-transparent bg-white"
          />
        </div>

        {/* Tabela de produtos */}
        <Card className="mb-4 overflow-hidden">
          <div className="overflow-x-auto max-h-[320px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-gray-50">
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">SKU</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Nome</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Tipo</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Unidade</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Estoque</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Custo</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Preço venda</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700 w-24">Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-gray-500">
                      Carregando...
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-gray-500">
                      Nenhum produto encontrado
                    </td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr
                      key={product.id}
                      onClick={() => handleSelectProduct(product)}
                      className={`border-b border-gray-100 cursor-pointer transition-colors hover:bg-[#00B299]/5 ${
                        selectedProduct?.id === product.id ? 'bg-[#00B299]/10' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-mono text-gray-900">{product.sku}</td>
                      <td className="py-3 px-4 text-gray-700">{product.name}</td>
                      <td className="py-3 px-4 text-gray-600">{TYPE_LABELS[product.type] || product.type}</td>
                      <td className="py-3 px-4 text-gray-600">{product.unit}</td>
                      <td className="py-3 px-4 text-right font-semibold text-[#00B299]">
                        {product.stockBalance
                          ? `${Number(product.stockBalance.quantity)} ${product.unit}`
                          : `0 ${product.unit}`}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-700">
                        {product.costPrice != null ? formatCurrency(Number(product.costPrice)) : '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-[#00B299]">
                        {product.salePrice != null ? formatCurrency(Number(product.salePrice)) : '-'}
                      </td>
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" asChild className="h-8 px-2 text-[#00B299] hover:bg-[#00B299]/10">
                          <Link href={`/dashboard/products/${product.id}`}>
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
          {/* Totalizador */}
          {!loading && products.length > 0 && (
            <div className="border-t border-gray-200 bg-gray-50 px-4 py-3 text-sm">
              <span className="font-semibold text-gray-700">
                Total: <span className="text-[#00B299]">{products.length}</span> produtos
              </span>
            </div>
          )}
        </Card>

        {/* Painel de histórico - exibido quando há produto selecionado */}
        {selectedProduct && (
          <Card className="overflow-hidden">
            <CardHeader className="py-3 px-4 bg-gray-50 border-b flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <History className="h-4 w-4 text-[#00B299]" />
                Histórico – {selectedProduct.name} ({selectedProduct.sku})
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/dashboard/products/${selectedProduct.id}`}>
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
            <CardContent className="p-4">
              {/* Filtro por data do histórico */}
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <span className="text-sm font-medium text-gray-700">Filtrar histórico por data:</span>
                <div className="flex items-center gap-2">
                  <label htmlFor="hist-from" className="text-sm text-gray-600">De:</label>
                  <input
                    id="hist-from"
                    type="date"
                    value={historyDateFrom}
                    onChange={(e) => setHistoryDateFrom(e.target.value)}
                    onBlur={handleHistoryFilterChange}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00B299] bg-white"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label htmlFor="hist-to" className="text-sm text-gray-600">Até:</label>
                  <input
                    id="hist-to"
                    type="date"
                    value={historyDateTo}
                    onChange={(e) => setHistoryDateTo(e.target.value)}
                    onBlur={handleHistoryFilterChange}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00B299] bg-white"
                  />
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleHistoryFilterChange}
                  className="text-[#00B299] hover:bg-[#00B299]/10 border-[#00B299]/50"
                >
                  Aplicar
                </Button>
                {(historyDateFrom || historyDateTo) && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setHistoryDateFrom('')
                      setHistoryDateTo('')
                      setTimeout(() => loadProductDetails(selectedProduct), 0)
                    }}
                  >
                    Limpar
                  </Button>
                )}
              </div>

              {/* Tabela de histórico */}
              {loadingDetails ? (
                <div className="py-12 flex justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-[#00B299]" />
                </div>
              ) : (
                <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="text-left py-2 px-4 font-medium text-gray-700">Data</th>
                        <th className="text-left py-2 px-4 font-medium text-gray-700">ID</th>
                        <th className="text-left py-2 px-4 font-medium text-gray-700">Tipo</th>
                        <th className="text-right py-2 px-4 font-medium text-gray-700">Quantidade</th>
                        <th className="text-right py-2 px-4 font-medium text-gray-700">Custo / Preço un.</th>
                        <th className="text-left py-2 px-4 font-medium text-gray-700">Referência</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(!selectedProductDetails?.stockMovements || selectedProductDetails.stockMovements.length === 0) ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-gray-500">
                            Nenhuma movimentação no período
                          </td>
                        </tr>
                      ) : (
                        (() => {
                          const movs = [...selectedProductDetails.stockMovements].sort(
                            (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
                          )
                          let saldoCorrido = 0
                          return movs.map((mov) => {
                            const q = Number(mov.quantity)
                            const efeito = mov.type === 'IN' || (mov.type === 'ADJUST' && q > 0) ? q : -(Math.abs(q))
                            saldoCorrido += efeito
                            return (
                              <tr key={mov.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                                <td className="py-2 px-4 text-gray-600">{formatDate(mov.createdAt)}</td>
                                <td className="py-2 px-4 font-mono text-xs text-gray-700" title={mov.referenceId}>
                                  {getReferenceIdLabel(mov)}
                                </td>
                                <td className="py-2 px-4">
                                  <span
                                    className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getMovementTypeColor(
                                      mov.type
                                    )}`}
                                  >
                                    {getMovementTypeLabel(mov.type)}
                                  </span>
                                </td>
                                <td className="py-2 px-4 text-right font-semibold">
                                  <span
                                    className={
                                      mov.type === 'OUT' || (mov.type === 'ADJUST' && Number(mov.quantity) < 0)
                                        ? 'text-red-700'
                                        : 'text-green-700'
                                    }
                                  >
                                    {mov.type === 'OUT' || Number(mov.quantity) < 0 ? '-' : '+'}
                                    {Math.abs(Number(mov.quantity))} {selectedProduct.unit}
                                  </span>
                                </td>
                                <td className="py-2 px-4 text-right font-bold text-[#00B299] tabular-nums">
                                  {saldoCorrido.toLocaleString('pt-BR')} {selectedProduct.unit}
                                </td>
                                <td className="py-2 px-4 text-right text-gray-600">
                                  {(mov.displayUnitPrice ?? mov.unitCost) != null ? formatCurrency(Number(mov.displayUnitPrice ?? mov.unitCost)) : '-'}
                                </td>
                                <td className="py-2 px-4 text-gray-600 max-w-[200px] truncate" title={getReferenceLabel(mov)}>
                                  {getReferenceLabel(mov)}
                                </td>
                              </tr>
                            )
                          })
                        })()
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Totalizador do histórico */}
              {!loadingDetails && selectedProductDetails?.stockMovements?.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <span className="font-semibold text-gray-700">
                      Entradas: <span className="text-green-700 font-bold">
                        +{selectedProductDetails.stockMovements
                          .filter((m) => m.type === 'IN' || (m.type === 'ADJUST' && Number(m.quantity) > 0))
                          .reduce((s, m) => s + Math.abs(Number(m.quantity)), 0)}{' '}
                        {selectedProduct.unit}
                      </span>
                    </span>
                    <span className="font-semibold text-gray-700">
                      Saídas: <span className="text-red-700 font-bold">
                        -{selectedProductDetails.stockMovements
                          .filter((m) => m.type === 'OUT' || (m.type === 'ADJUST' && Number(m.quantity) < 0))
                          .reduce((s, m) => s + Math.abs(Number(m.quantity)), 0)}{' '}
                        {selectedProduct.unit}
                      </span>
                    </span>
                    <span className="font-semibold text-gray-700">
                      Soma das movimentações listadas: <span className="text-[#00B299] font-bold">
                        {selectedProductDetails.stockMovements.reduce((s, m) => {
                          const q = Number(m.quantity)
                          if (m.type === 'IN' || (m.type === 'ADJUST' && q > 0)) return s + q
                          if (m.type === 'OUT' || (m.type === 'ADJUST' && q < 0)) return s - Math.abs(q)
                          return s
                        }, 0)}{' '}
                        {selectedProduct.unit}
                      </span>
                    </span>
                    <span className="font-semibold text-gray-700">
                      Saldo atual (estoque real): <span className="text-[#00B299] font-bold">
                        {selectedProductDetails.stockBalance?.quantity != null
                          ? `${Number(selectedProductDetails.stockBalance.quantity)} ${selectedProduct.unit}`
                          : '-'}
                      </span>
                    </span>
                  </div>
                  {selectedProductDetails.stockBalance?.quantity != null && (() => {
                    const saldoPeriodo = selectedProductDetails.stockMovements.reduce((s, m) => {
                      const q = Number(m.quantity)
                      if (m.type === 'IN' || (m.type === 'ADJUST' && q > 0)) return s + q
                      if (m.type === 'OUT' || (m.type === 'ADJUST' && q < 0)) return s - Math.abs(q)
                      return s
                    }, 0)
                    const saldoAtual = Number(selectedProductDetails.stockBalance.quantity)
                    const dif = saldoAtual - saldoPeriodo
                    if (Math.abs(dif) > 0.001) {
                      return (
                        <div className="space-y-2">
                          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
                            A soma das movimentações listadas ({saldoPeriodo} {selectedProduct.unit}) difere do saldo atual ({saldoAtual} {selectedProduct.unit}). Isso pode ocorrer por <strong>filtro por data</strong>, lista limitada a 500 registros ou inconsistência nos dados.
                          </p>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-amber-500 text-amber-700 hover:bg-amber-50 inline-flex items-center gap-2"
                            onClick={handleReconcileBalance}
                            disabled={reconciling}
                          >
                            {reconciling && <Loader2 className="h-4 w-4 animate-spin" />}
                            Corrigir saldo com base em todas as movimentações
                          </Button>
                        </div>
                      )
                    }
                    return null
                  })()}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {!loading && products.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhum produto encontrado</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
