'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, DollarSign, Edit, Trash2, Loader2, Eye } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'

export default function InvestorsPage() {
  const [investors, setInvestors] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deletingId, setDeletingId] = useState(null)
  const [investorStats, setInvestorStats] = useState({})
  const { toast } = useToast()

  useEffect(() => {
    loadInvestors()
  }, [])

  const loadInvestors = async () => {
    try {
      // Não usar includeStats inicialmente para evitar esgotamento de conexões
      // Carregar stats apenas quando necessário ou em background
      const response = await api.get('/investors', {
        params: { isActive: 'true', limit: 50, includeStats: 'true' },
      })
      const filtered = response.data.data.filter(inv => 
        !search || inv.name.toLowerCase().includes(search.toLowerCase())
      )
      setInvestors(filtered)

      // Extrair estatísticas da resposta
      const statsMap = {}
      filtered.forEach(investor => {
        if (investor.stats) {
          statsMap[investor.id] = {
            total: investor.stats.totalInvested,
            count: investor.stats.totalAccounts,
          }
        }
      })
      setInvestorStats(statsMap)
    } catch (error) {
      console.error('Erro ao carregar investidores:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao carregar investidores',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!loading) {
      loadInvestors()
    }
  }, [search])

  const handleDelete = async (id) => {
    if (!confirm('Deseja realmente excluir este investidor?')) {
      return
    }

    setDeletingId(id)
    try {
      await api.delete(`/investors/${id}`)
      toast({
        title: 'Sucesso!',
        description: 'Investidor excluído com sucesso',
      })
      loadInvestors()
    } catch (error) {
      toast({
        title: 'Erro',
        description: error.response?.data?.error?.message || 'Erro ao excluir investidor',
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
            <h1 className="text-2xl md:text-3xl font-bold text-[#00B299]">
              Investidores / Fontes Pagadoras
            </h1>
            <p className="text-gray-600 mt-1 text-sm md:text-base">Gerencie os sócios e investidores</p>
          </div>
          <Button asChild className="bg-[#00B299] hover:shadow-glow-lg transition-all w-full sm:w-auto">
            <Link href="/dashboard/investors/new">
              <Plus className="h-4 w-4 mr-2" />
              Novo Investidor
            </Link>
          </Button>
        </div>

        <Card className="mb-6 gradient-card border-[#00B299]/20 shadow-md">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#00B299]" />
              <Input
                placeholder="Buscar investidores..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 border-[#00B299]/30 focus:border-[#00B299] focus:ring-[#00B299]"
              />
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#00B299]"></div>
            <p className="text-gray-600 mt-4">Carregando investidores...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {investors.map((investor) => (
              <Card 
                key={investor.id} 
                className="gradient-card border-[#00B299]/20 hover:shadow-glow-lg transition-all duration-300 hover:scale-105"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg font-semibold text-gray-900 break-words">
                        {investor.name}
                      </CardTitle>
                      {investor.document && (
                        <p className="text-sm text-gray-600 mt-1 break-words">Doc: {investor.document}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`px-2 py-1 rounded-md text-xs font-semibold ${
                        investor.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {investor.isActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {investor.phone && (
                      <p className="text-sm text-gray-600 break-words">
                        <span className="font-medium">Telefone:</span> {investor.phone}
                      </p>
                    )}
                    {investor.email && (
                      <p className="text-sm text-gray-600 break-words">
                        <span className="font-medium">Email:</span> {investor.email}
                      </p>
                    )}
                    {investorStats[investor.id] && (
                      <div className="mt-3 p-3 bg-[#00B299]/5 rounded-lg border border-[#00B299]/20">
                        <p className="text-xs text-gray-600 mb-1">Total Investido</p>
                        <p className="text-lg font-bold text-[#00B299]">
                          {formatCurrency(investorStats[investor.id].total)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {investorStats[investor.id].count} {investorStats[investor.id].count === 1 ? 'conta paga' : 'contas pagas'}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="flex-1 hover:bg-[#00B299]/10"
                    >
                      <Link href={`/dashboard/investors/${investor.id}/details`}>
                        <Eye className="h-4 w-4 mr-2" />
                        Detalhes
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="hover:bg-blue-50 hover:text-blue-600"
                    >
                      <Link href={`/dashboard/investors/${investor.id}`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(investor.id)}
                      disabled={deletingId === investor.id}
                      className="hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                    >
                      {deletingId === investor.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!loading && investors.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhum investidor encontrado</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}




