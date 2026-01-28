'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, Users, Edit, Trash2, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'

export default function CustomersPage() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deletingId, setDeletingId] = useState(null)
  const { toast } = useToast()

  useEffect(() => {
    loadCustomers()
  }, [search])

  const loadCustomers = async () => {
    try {
      const response = await api.get('/customers', {
        params: { search, limit: 100 },
      })
      setCustomers(response.data.data)
    } catch (error) {
      console.error('Erro ao carregar clientes:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao carregar clientes',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Deseja realmente excluir este cliente?')) {
      return
    }

    setDeletingId(id)
    try {
      await api.delete(`/customers/${id}`)
      toast({
        title: 'Sucesso!',
        description: 'Cliente excluído com sucesso',
      })
      loadCustomers()
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
            <h1 className="text-2xl md:text-3xl font-bold text-[#00B299]">
              Clientes
            </h1>
            <p className="text-gray-600 mt-1 text-sm md:text-base">Gerencie seus clientes</p>
          </div>
          <Button asChild className="bg-[#00B299] hover:shadow-glow-lg transition-all w-full sm:w-auto">
            <Link href="/dashboard/customers/new">
              <Plus className="h-4 w-4 mr-2" />
              Novo Cliente
            </Link>
          </Button>
        </div>

        <Card className="mb-6 gradient-card border-[#00B299]/20 shadow-md">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#00B299]" />
              <Input
                placeholder="Buscar clientes..."
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
            <p className="text-gray-600 mt-4">Carregando clientes...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {customers.map((customer) => (
              <Card 
                key={customer.id} 
                className="gradient-card border-[#00B299]/20 hover:shadow-glow-lg transition-all duration-300 hover:scale-105"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg font-semibold text-gray-900 break-words">
                        {customer.name}
                      </CardTitle>
                      {customer.document && (
                        <p className="text-sm text-gray-600 mt-1 break-words">Doc: {customer.document}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`px-2 py-1 rounded-md text-xs font-semibold ${
                        customer.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {customer.isActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {customer.phone && (
                      <p className="text-sm text-gray-600 break-words">
                        <span className="font-medium">Telefone:</span> {customer.phone}
                      </p>
                    )}
                    {customer.email && (
                      <p className="text-sm text-gray-600 break-words">
                        <span className="font-medium">Email:</span> {customer.email}
                      </p>
                    )}
                    {(customer.addressStreet || customer.addressCity) && (
                      <p className="text-sm text-gray-600 break-words">
                        <span className="font-medium">Endereço:</span>{' '}
                        {[
                          customer.addressStreet,
                          customer.addressNumber && `nº ${customer.addressNumber}`,
                          customer.addressNeighborhood,
                          customer.addressCity,
                          customer.addressState,
                        ]
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="flex-1 hover:bg-[#00B299]/10"
                    >
                      <Link href={`/dashboard/customers/${customer.id}`}>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(customer.id)}
                      disabled={deletingId === customer.id}
                      className="hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                    >
                      {deletingId === customer.id ? (
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















