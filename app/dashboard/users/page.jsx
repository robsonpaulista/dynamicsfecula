'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import { Plus, Users } from 'lucide-react'
import Link from 'next/link'

export default function UsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const response = await api.get('/users')
      setUsers(response.data.data)
    } catch (error) {
      console.error('Erro ao carregar usuários:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRoleLabel = (role) => {
    const labels = {
      ADMIN: 'Administrador',
      FINANCEIRO: 'Financeiro',
      COMPRAS: 'Compras',
      VENDAS: 'Vendas',
      ESTOQUE: 'Estoque',
    }
    return labels[role] || role
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#00B299]">
              Usuários
            </h1>
            <p className="text-gray-600 mt-1 text-sm md:text-base">Gerencie usuários do sistema</p>
          </div>
          <Button asChild className="bg-[#00B299] hover:shadow-glow-lg transition-all w-full sm:w-auto">
            <Link href="/dashboard/users/new">
              <Plus className="h-4 w-4 mr-2" />
              Novo Usuário
            </Link>
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Carregando usuários...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {users.map((user) => (
              <Card 
                key={user.id} 
                className="gradient-card border-[#00B299]/20 hover:shadow-glow-lg transition-all duration-300 hover:scale-105"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold text-gray-900">{user.name}</CardTitle>
                      <p className="text-sm text-gray-600 mt-1 truncate">{user.email}</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-[#00B299] flex items-center justify-center shadow-md">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-2 bg-[#00B299]/5 rounded-lg">
                      <span className="text-sm text-gray-600">Perfil:</span>
                      <span className="text-sm font-semibold text-[#00B299]">{getRoleLabel(user.role)}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-[#00B299]/5 rounded-lg">
                      <span className="text-sm text-gray-600">Status:</span>
                      <span className={`text-sm font-bold px-2 py-1 rounded-md ${
                        user.isActive ? 'bg-[#00B299]/10 text-[#00B299]' : 'bg-red-100 text-red-700'
                      }`}>
                        {user.isActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-[#00B299]/5 rounded-lg">
                      <span className="text-sm text-gray-600">Criado em:</span>
                      <span className="text-sm font-medium text-[#00B299]">{formatDate(user.createdAt)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!loading && users.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhum usuário encontrado</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

