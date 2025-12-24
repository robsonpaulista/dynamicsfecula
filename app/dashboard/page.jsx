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
  Loader2
} from 'lucide-react'

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }

    if (user) {
      loadDashboard()
    }
  }, [user, authLoading, router])

  const loadDashboard = async () => {
    try {
      const response = await api.get('/dashboard')
      setDashboardData(response.data.data)
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

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
          <h1 className="text-2xl md:text-3xl font-bold text-[#00B299]">
            Dashboard
          </h1>
          <p className="text-gray-600 mt-1 md:mt-2 text-sm md:text-base">
            Bem-vindo, <span className="font-semibold text-[#00B299]">{user?.name}</span>
          </p>
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

        {dashboardData?.lowStockProducts?.length > 0 && (
          <Card className="mt-4 md:mt-6 gradient-card border-orange-100/50 shadow-glow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-[#FF8C00] flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-white" />
                </div>
                Produtos com Estoque Baixo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dashboardData.lowStockProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex justify-between items-center p-3 md:p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border border-orange-200/50 hover:shadow-md transition-all"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 break-words">{product.name}</p>
                      <p className="text-xs md:text-sm text-gray-600">SKU: {product.sku}</p>
                    </div>
                    <div className="text-right ml-4 flex-shrink-0">
                      <p className="text-sm md:text-base">
                        Estoque: <span className="font-bold text-[#FF8C00]">{product.currentStock} {product.unit || ''}</span>
                      </p>
                      <p className="text-xs text-gray-500">
                        Mínimo: {product.minStock} {product.unit || ''}
                      </p>
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

