'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Package,
  AlertTriangle,
  Loader2,
  RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [periodType, setPeriodType] = useState('currentMonth') // currentMonth, lastMonth, year, all
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }

    if (user) {
      loadDashboard()
    }
  }, [user, authLoading, router, loadDashboard])

  const loadDashboard = useCallback(async () => {
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
      
      // Se for 'all', enviar parâmetros vazios para não filtrar
      if (periodType === 'all') {
        params.from = ''
        params.to = ''
      } else {
        if (from) {
          params.from = from.toISOString().split('T')[0]
        }
        if (to) {
          params.to = to.toISOString().split('T')[0]
        }
      }

      const response = await api.get('/dashboard', { params })
      setDashboardData(response.data.data)
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error)
    } finally {
      setLoading(false)
    }
  }, [periodType, customFrom, customTo])

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) return null

  const stats = [
    {
      title: 'Saldo de Caixa',
      value: formatCurrency(dashboardData?.cashBalance || 0),
      icon: DollarSign,
      color: 'text-[#00B299]',
      bgColor: 'bg-[#00B299]/10',
    },
    {
      title: 'Contas a Receber',
      value: formatCurrency(dashboardData?.accountsReceivable || 0),
      icon: TrendingUp,
      color: 'text-[#00B299]',
      bgColor: 'bg-[#00B299]/10',
    },
    {
      title: 'Contas a Pagar',
      value: formatCurrency(dashboardData?.accountsPayable || 0),
      icon: TrendingDown,
      color: 'text-[#FF8C00]',
      bgColor: 'bg-[#FF8C00]/10',
    },
    {
      title: 'Estoque Baixo',
      value: dashboardData?.lowStockCount || 0,
      icon: AlertTriangle,
      color: 'text-[#FF8C00]',
      bgColor: 'bg-[#FF8C00]/10',
    },
  ]

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 md:mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#00B299]">
                Dashboard
              </h1>
              <p className="text-gray-600 mt-1 md:mt-2 text-sm md:text-base">
                Bem-vindo, <span className="font-semibold text-[#00B299]">{user?.name}</span>
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="flex gap-2">
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
                      placeholder="De"
                      className="w-36 text-sm"
                    />
                    <Input
                      type="date"
                      value={customTo}
                      onChange={(e) => setCustomTo(e.target.value)}
                      placeholder="Até"
                      className="w-36 text-sm"
                    />
                  </>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={loadDashboard}
                disabled={loading}
                className="hover:bg-[#00B299]/10"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <Card 
                key={index} 
                className="gradient-card border-[#00B299]/20 hover:shadow-glow-lg transition-all duration-300 hover:scale-105 cursor-pointer"
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs md:text-sm font-medium text-gray-700">
                    {stat.title}
                  </CardTitle>
                  <div className={`${stat.bgColor} p-2.5 rounded-xl shadow-md`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-xl md:text-2xl font-bold text-gray-900">{stat.value}</div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <Card className="gradient-card border-[#00B299]/20 hover:shadow-glow transition-all">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-[#00B299] flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                Vendas do Período
              </CardTitle>
              <CardDescription className="text-base">
                <span className="font-bold text-[#00B299]">
                  {formatCurrency(dashboardData?.sales?.total || 0)}
                </span>
                <span className="text-gray-500 ml-2">
                  • {dashboardData?.sales?.count || 0} pedidos
                </span>
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="gradient-card border-[#00B299]/20 hover:shadow-glow transition-all">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-[#00B299] flex items-center justify-center">
                  <TrendingDown className="h-5 w-5 text-white" />
                </div>
                Compras do Período
              </CardTitle>
              <CardDescription className="text-base">
                <span className="font-bold text-[#00B299]">
                  {formatCurrency(dashboardData?.purchases?.total || 0)}
                </span>
                <span className="text-gray-500 ml-2">
                  • {dashboardData?.purchases?.count || 0} pedidos
                </span>
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="gradient-card border-green-100/50 hover:shadow-glow transition-all">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                Receitas Recebidas
              </CardTitle>
              <CardDescription className="text-base">
                <span className="font-bold text-green-600">
                  {formatCurrency(dashboardData?.income?.received || 0)}
                </span>
                <span className="text-gray-500 ml-2">
                  • {dashboardData?.income?.count || 0} recebimentos
                </span>
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="gradient-card border-red-100/50 hover:shadow-glow transition-all">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-red-500 flex items-center justify-center">
                  <TrendingDown className="h-5 w-5 text-white" />
                </div>
                Despesas Pagas
              </CardTitle>
              <CardDescription className="text-base">
                <span className="font-bold text-red-600">
                  {formatCurrency(dashboardData?.expenses?.paid || 0)}
                </span>
                <span className="text-gray-500 ml-2">
                  • {dashboardData?.expenses?.count || 0} pagamentos
                </span>
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {dashboardData?.productsWithStock && dashboardData.productsWithStock.length > 0 && (
          <Card className="mt-4 md:mt-6 gradient-card border-[#00B299]/20 shadow-glow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-[#00B299] flex items-center justify-center">
                  <Package className="h-5 w-5 text-white" />
                </div>
                Estoque dos Produtos
                {dashboardData.lowStockCount > 0 && (
                  <span className="ml-2 px-2 py-1 bg-orange-500 text-white text-xs font-semibold rounded-full">
                    {dashboardData.lowStockCount} com estoque baixo
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {dashboardData.productsWithStock.map((product) => {
                  const isLowStock = product.isLowStock
                  return (
                    <div
                      key={product.id}
                      className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-3 md:p-4 rounded-xl border hover:shadow-md transition-all ${
                        isLowStock
                          ? 'bg-gradient-to-r from-orange-50 to-red-50 border-orange-200/50'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex-1 min-w-0 flex items-center gap-3">
                        {isLowStock && (
                          <div className="flex-shrink-0">
                            <AlertTriangle className="h-5 w-5 text-orange-500" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-gray-900 break-words">{product.name}</p>
                            {isLowStock && (
                              <span className="px-2 py-0.5 bg-orange-500 text-white text-xs font-semibold rounded whitespace-nowrap">
                                Estoque Baixo
                              </span>
                            )}
                          </div>
                          <p className="text-xs md:text-sm text-gray-600">SKU: {product.sku}</p>
                        </div>
                      </div>
                      <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-3 sm:gap-4">
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-sm">
                          <div className="text-green-600">
                            <span className="font-medium">Entradas:</span>{' '}
                            <span className="font-bold">{product.totalEntries || 0} {product.unit || ''}</span>
                          </div>
                          <div className="text-red-600">
                            <span className="font-medium">Saídas:</span>{' '}
                            <span className="font-bold">{product.totalExits || 0} {product.unit || ''}</span>
                          </div>
                        </div>
                        <div className="text-right sm:text-left border-t sm:border-t-0 sm:border-l pt-2 sm:pt-0 sm:pl-4 border-gray-300">
                          <p className={`text-sm md:text-base font-semibold ${isLowStock ? 'text-orange-600' : 'text-gray-700'}`}>
                            Estoque: <span className={`font-bold ${isLowStock ? 'text-[#FF8C00]' : 'text-[#00B299]'}`}>
                              {product.currentStock} {product.unit || ''}
                            </span>
                          </p>
                          {product.minStock !== null && (
                            <p className="text-xs text-gray-500">
                              Mínimo: {product.minStock} {product.unit || ''}
                            </p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">
                            {product.totalEntries || 0} - {product.totalExits || 0} = {product.currentStock}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

