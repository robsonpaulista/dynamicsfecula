'use client'

import { useEffect, useState } from 'react'
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
  }, [user, authLoading])

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
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Contas a Receber',
      value: formatCurrency(dashboardData?.accountsReceivable || 0),
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Contas a Pagar',
      value: formatCurrency(dashboardData?.accountsPayable || 0),
      icon: TrendingDown,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
    {
      title: 'Estoque Baixo',
      value: dashboardData?.lowStockCount || 0,
      icon: AlertTriangle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Bem-vindo, {user?.name}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <div className={`${stat.bgColor} p-2 rounded-lg`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Vendas do Período</CardTitle>
              <CardDescription>
                Total: {formatCurrency(dashboardData?.sales?.total || 0)} •{' '}
                {dashboardData?.sales?.count || 0} pedidos
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Compras do Período</CardTitle>
              <CardDescription>
                Total: {formatCurrency(dashboardData?.purchases?.total || 0)} •{' '}
                {dashboardData?.purchases?.count || 0} pedidos
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {dashboardData?.lowStockProducts?.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                Produtos com Estoque Baixo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {dashboardData.lowStockProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex justify-between items-center p-2 bg-orange-50 rounded"
                  >
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-gray-600">{product.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">
                        Estoque: <span className="font-bold">{product.currentStock}</span>
                      </p>
                      <p className="text-xs text-gray-500">
                        Mínimo: {product.minStock}
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










