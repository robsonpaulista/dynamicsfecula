'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { ShoppingCart, Loader2, LogIn, Eye, EyeOff, Package, DollarSign, TrendingUp, BarChart3 } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { login } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      await login(email, password)
      toast({
        title: 'Login realizado com sucesso!',
        description: 'Redirecionando...',
      })
      // Redirecionamento completo evita race: layout do dashboard já vê user no localStorage
      window.location.href = '/dashboard'
      return
    } catch (error) {
      toast({
        title: 'Erro ao fazer login',
        description: error.response?.data?.error?.message || 'Credenciais inválidas',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-screen max-w-screen overflow-x-hidden flex items-center justify-center bg-white" style={{ width: '100vw', maxWidth: '100vw' }}>
      {/* Conteúdo principal */}
      <div 
        className={`w-full max-w-sm mx-auto transition-all duration-700 ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
        style={{ width: '100%', maxWidth: 'min(100%, 24rem)', padding: '2rem 1.5rem' }}
      >
        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl font-bold mb-1">
            <span className="text-[#00B299]">D</span>
            <span className="text-gray-400">ynamicsADM</span>
          </h1>
        </div>

        {/* Título Login */}
        <h2 className="text-2xl font-semibold text-gray-800 mb-8 text-center">Login</h2>
        
        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <Input
              id="email"
              type="email"
              placeholder="Email ou número de telefone"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="h-12 w-full rounded-lg border border-gray-300 bg-white px-4 text-gray-900 placeholder:text-gray-400 focus:border-[#00B299] focus:outline-none focus:ring-1 focus:ring-[#00B299] transition-all duration-200"
              style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}
            />
          </div>
          
          {/* Senha */}
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              className="h-12 w-full rounded-lg border border-gray-300 bg-white px-4 pr-12 text-gray-900 placeholder:text-gray-400 focus:border-[#00B299] focus:outline-none focus:ring-1 focus:ring-[#00B299] transition-all duration-200"
              style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>

          {/* Esqueceu a senha */}
          <div className="text-right">
            <button
              type="button"
              className="text-sm text-[#00B299] hover:text-[#00B299]/80 transition-colors"
              onClick={() => {
                // TODO: Implementar recuperação de senha
                toast({
                  title: 'Em desenvolvimento',
                  description: 'Funcionalidade de recuperação de senha em breve',
                })
              }}
            >
              Esqueceu sua senha?
            </button>
          </div>
          
          {/* Botão Login */}
          <Button 
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-[#FF8C00] hover:bg-[#FF8C00]/90 text-white font-semibold rounded-lg shadow-sm hover:shadow-md transition-all duration-200 mt-2"
            style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Entrando...
              </span>
            ) : (
              'Entrar'
            )}
          </Button>
        </form>

        {/* Informações sobre o sistema */}
        <div className="mt-10 pt-8 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-lg bg-[#00B299]/10 flex items-center justify-center mb-2">
                <Package className="h-6 w-6 text-[#00B299]" />
              </div>
              <p className="text-xs text-gray-600 font-medium">Estoque</p>
              <p className="text-xs text-gray-400 mt-1">Controle total</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-lg bg-[#00B299]/10 flex items-center justify-center mb-2">
                <DollarSign className="h-6 w-6 text-[#00B299]" />
              </div>
              <p className="text-xs text-gray-600 font-medium">Financeiro</p>
              <p className="text-xs text-gray-400 mt-1">Gestão completa</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-lg bg-[#00B299]/10 flex items-center justify-center mb-2">
                <TrendingUp className="h-6 w-6 text-[#00B299]" />
              </div>
              <p className="text-xs text-gray-600 font-medium">Vendas</p>
              <p className="text-xs text-gray-400 mt-1">Pedidos e clientes</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-lg bg-[#00B299]/10 flex items-center justify-center mb-2">
                <BarChart3 className="h-6 w-6 text-[#00B299]" />
              </div>
              <p className="text-xs text-gray-600 font-medium">Relatórios</p>
              <p className="text-xs text-gray-400 mt-1">Análises detalhadas</p>
            </div>
          </div>
        </div>

        {/* Dica de credenciais */}
        <div className="text-center">
          <p className="text-xs text-gray-400">
            Use: <span className="font-mono text-gray-500">admin@example.com</span> / <span className="font-mono text-gray-500">senha123</span>
          </p>
        </div>
      </div>
    </div>
  )
}

