'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Plus, Users, ExternalLink, X, Loader2, ShoppingCart, DollarSign, Edit, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'

const STATUS_LABELS = { DRAFT: 'Rascunho', CONFIRMED: 'Confirmado', DELIVERED: 'Entregue', CANCELED: 'Cancelado' }

export default function CustomersPage() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deletingId, setDeletingId] = useState(null)
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [selectedCustomerDetails, setSelectedCustomerDetails] = useState(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [activeTab, setActiveTab] = useState('orders')
  const { toast } = useToast()

  const loadCustomers = async () => {
    try {
      setLoading(true)
      const params = { limit: 200 }
      if (search) params.search = search
      const response = await api.get('/customers', { params })
      const data = response.data.data
      setCustomers(data)
      setSelectedCustomer((prev) => (prev && data.find((c) => c.id === prev.id) ? prev : null))
      setSelectedCustomerDetails((prev) => (prev && data.find((c) => c.id === prev.id) ? prev : null))
    } catch (error) {
      console.error('Erro ao carregar clientes:', error)
      toast({ title: 'Erro', description: 'Erro ao carregar clientes', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCustomers()
  }, [search])

  const handleSelectCustomer = async (customer) => {
    if (selectedCustomer?.id === customer.id) return
    setSelectedCustomer(customer)
    setSelectedCustomerDetails(null)
    setLoadingDetails(true)
    setActiveTab('orders')
    try {
      const response = await api.get(`/customers/${customer.id}`)
      setSelectedCustomerDetails(response.data.data)
    } catch (error) {
      toast({ title: 'Erro', description: 'Erro ao carregar detalhes', variant: 'destructive' })
      setSelectedCustomer(null)
    } finally {
      setLoadingDetails(false)
    }
  }

  const handleClosePanel = () => {
    setSelectedCustomer(null)
    setSelectedCustomerDetails(null)
  }

  const handleDelete = async (e, id) => {
    e.stopPropagation()
    if (!confirm('Deseja realmente excluir este cliente?')) return

    setDeletingId(id)
    try {
      await api.delete(`/customers/${id}`)
      toast({ title: 'Sucesso!', description: 'Cliente excluído com sucesso' })
      loadCustomers()
      if (selectedCustomer?.id === id) {
        setSelectedCustomer(null)
        setSelectedCustomerDetails(null)
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: error.response?.data?.error?.message || 'Erro ao excluir cliente',
        variant: 'destructive',
      })
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#00B299]">Clientes</h1>
            <p className="text-gray-600 mt-1 text-sm md:text-base">Gerencie seus clientes</p>
          </div>
          <Button asChild className="bg-[#00B299] hover:shadow-glow-lg transition-all w-full sm:w-auto">
            <Link href="/dashboard/customers/new">
              <Plus className="h-4 w-4 mr-2" />
              Novo Cliente
            </Link>
          </Button>
        </div>

        {/* Filtro de busca */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Buscar por nome ou documento..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm w-full max-w-sm focus:outline-none focus:ring-2 focus:ring-[#00B299] focus:border-transparent bg-white"
          />
        </div>

        {/* Tabela de clientes */}
        <Card className="mb-4 overflow-hidden">
          <div className="overflow-x-auto max-h-[320px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-gray-50">
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Nome</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Documento</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Telefone</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Cidade</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700 w-24">Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-500">
                      Carregando...
                    </td>
                  </tr>
                ) : customers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-500">
                      Nenhum cliente encontrado
                    </td>
                  </tr>
                ) : (
                  customers.map((customer) => (
                    <tr
                      key={customer.id}
                      onClick={() => handleSelectCustomer(customer)}
                      className={`border-b border-gray-100 cursor-pointer transition-colors hover:bg-[#00B299]/5 ${
                        selectedCustomer?.id === customer.id ? 'bg-[#00B299]/10' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-medium text-gray-900">{customer.name}</td>
                      <td className="py-3 px-4 text-gray-600">{customer.document || '-'}</td>
                      <td className="py-3 px-4 text-gray-600">{customer.phone || '-'}</td>
                      <td className="py-3 px-4 text-gray-600 truncate max-w-[180px]" title={customer.email}>
                        {customer.email || '-'}
                      </td>
                      <td className="py-3 px-4 text-gray-600">{customer.addressCity || '-'}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                            customer.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {customer.isActive ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" asChild className="h-8 px-2 text-[#00B299] hover:bg-[#00B299]/10">
                            <Link href={`/dashboard/customers/${customer.id}`}>
                              <ExternalLink className="h-4 w-4" title="Ver detalhes" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-red-600 hover:bg-red-50"
                            onClick={(e) => handleDelete(e, customer.id)}
                            disabled={deletingId === customer.id}
                            title="Excluir"
                          >
                            {deletingId === customer.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {!loading && customers.length > 0 && (
            <div className="border-t border-gray-200 bg-gray-50 px-4 py-3 text-sm">
              <span className="font-semibold text-gray-700">
                Total: <span className="text-[#00B299]">{customers.length}</span> clientes
              </span>
            </div>
          )}
        </Card>

        {/* Painel com abas (Pedidos | Contas a Receber) */}
        {selectedCustomer && (
          <Card className="overflow-hidden">
            <CardHeader className="py-3 px-4 bg-gray-50 border-b flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold">{selectedCustomer.name}</CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/dashboard/customers/${selectedCustomer.id}`}>
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
                  onClick={() => setActiveTab('orders')}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === 'orders'
                      ? 'text-[#00B299] border-b-2 border-[#00B299] bg-[#00B299]/5'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <ShoppingCart className="h-4 w-4" />
                  Pedidos de venda
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

              {loadingDetails ? (
                <div className="py-12 flex justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-[#00B299]" />
                </div>
              ) : (
                <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                  {activeTab === 'orders' && (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-gray-50">
                          <th className="text-left py-2 px-4 font-medium text-gray-700">Pedido</th>
                          <th className="text-left py-2 px-4 font-medium text-gray-700">Data</th>
                          <th className="text-right py-2 px-4 font-medium text-gray-700">Total</th>
                          <th className="text-left py-2 px-4 font-medium text-gray-700">Status</th>
                          <th className="text-right py-2 px-4 font-medium text-gray-700"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {(!selectedCustomerDetails?.salesOrders || selectedCustomerDetails.salesOrders.length === 0) ? (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-gray-500">
                              Nenhum pedido de venda
                            </td>
                          </tr>
                        ) : (
                          selectedCustomerDetails.salesOrders.map((order) => (
                            <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                              <td className="py-2 px-4 font-mono text-gray-900">#{order.id.slice(0, 8)}</td>
                              <td className="py-2 px-4 text-gray-600">{formatDate(order.saleDate)}</td>
                              <td className="py-2 px-4 text-right font-semibold text-[#00B299]">
                                {formatCurrency(Number(order.total))}
                              </td>
                              <td className="py-2 px-4">
                                <span
                                  className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                                    order.status === 'DELIVERED'
                                      ? 'bg-green-100 text-green-800'
                                      : order.status === 'CANCELED'
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-yellow-100 text-yellow-800'
                                  }`}
                                >
                                  {STATUS_LABELS[order.status] || order.status}
                                </span>
                              </td>
                              <td className="py-2 px-4 text-right">
                                <Button variant="ghost" size="sm" asChild className="h-7 text-[#00B299]">
                                  <Link href={`/dashboard/sales/${order.id}`}>
                                    Ver
                                  </Link>
                                </Button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  )}

                  {activeTab === 'ar' && (
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
                        {(!selectedCustomerDetails?.accountsReceivable || selectedCustomerDetails.accountsReceivable.length === 0) ? (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-gray-500">
                              Nenhuma conta a receber
                            </td>
                          </tr>
                        ) : (
                          selectedCustomerDetails.accountsReceivable.map((ar) => (
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

        {!loading && customers.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhum cliente encontrado</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
