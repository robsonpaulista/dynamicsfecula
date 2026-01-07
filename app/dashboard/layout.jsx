'use client'

import { useAuth } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  DollarSign,
  LogOut,
  Menu,
  Building2,
  UserCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

export default function DashboardLayout({ children }) {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebarCollapsed')
      return saved === 'true'
    }
    return false
  })

  useEffect(() => {
    if (!user) {
      router.push('/login')
    }
  }, [user, router])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebarCollapsed', sidebarCollapsed.toString())
    }
  }, [sidebarCollapsed])

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed)
  }

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  const menuItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/products', label: 'Produtos', icon: Package },
    { href: '/dashboard/suppliers', label: 'Fornecedores', icon: Building2 },
    { href: '/dashboard/customers', label: 'Clientes', icon: UserCircle },
    { href: '/dashboard/purchases', label: 'Compras', icon: ShoppingCart },
    { href: '/dashboard/sales', label: 'Vendas', icon: ShoppingCart },
    { href: '/dashboard/finance', label: 'Financeiro', icon: DollarSign },
    { href: '/dashboard/investors', label: 'Investidores', icon: DollarSign },
    { href: '/dashboard/users', label: 'Usuários', icon: Users },
  ]

  if (!user) return null

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      {/* Mobile Header */}
      <div className="lg:hidden glass-effect border-b shadow-sm p-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
            <span className="text-white font-bold text-sm">D</span>
          </div>
          <h1 className="text-xl font-bold text-[#00B299]">
            DynamicsADM
          </h1>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="hover:bg-[#00B299]/10"
        >
          <Menu className="h-6 w-6 text-[#00B299]" />
        </Button>
      </div>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm">
          <div className="bg-gradient-to-b from-white to-[#F5F5F5] w-72 h-full p-4 shadow-xl">
            <div className="mb-6 pt-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
                  <span className="text-white font-bold">D</span>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#00B299]">
                    Menu
                  </h2>
                  <p className="text-xs text-gray-600">{user?.name}</p>
                </div>
              </div>
            </div>
            <nav className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#00B299]/10 transition-all hover:shadow-md active:scale-95"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon className="h-5 w-5 text-[#00B299]" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                )
              })}
            </nav>
            <Button
              variant="ghost"
              className="w-full mt-6 hover:bg-red-100 hover:text-red-600"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      )}

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className={`hidden lg:flex flex-col bg-gradient-to-b from-white via-white to-[#F5F5F5] border-r border-[#00B299]/20 min-h-screen shadow-lg transition-all duration-300 ${
          sidebarCollapsed ? 'w-20' : 'w-72'
        }`}>
          <div className={`p-6 border-b border-[#00B299]/20 ${sidebarCollapsed ? 'px-4' : ''}`}>
            <div className={`flex items-center gap-3 mb-2 ${sidebarCollapsed ? 'justify-center' : ''}`}>
              <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shadow-glow-lg flex-shrink-0">
                <span className="text-white font-bold text-lg">D</span>
              </div>
              {!sidebarCollapsed && (
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl font-bold text-[#00B299] truncate">
                    DynamicsADM
                  </h1>
                  <p className="text-xs text-gray-600 mt-0.5 truncate">{user?.name}</p>
                </div>
              )}
            </div>
          </div>
          <nav className={`flex-1 p-4 space-y-1 ${sidebarCollapsed ? 'px-2' : ''}`}>
            {menuItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center rounded-xl hover:bg-[#00B299]/10 transition-all hover:shadow-md group ${
                    sidebarCollapsed ? 'justify-center p-3' : 'gap-3 p-3'
                  }`}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <Icon className="h-5 w-5 text-[#00B299] group-hover:scale-110 transition-transform flex-shrink-0" />
                  {!sidebarCollapsed && (
                    <span className="font-medium truncate">{item.label}</span>
                  )}
                </Link>
              )
            })}
          </nav>
          <div className={`p-4 border-t border-[#00B299]/20 ${sidebarCollapsed ? 'px-2' : ''}`}>
            <Button
              variant="ghost"
              className={`w-full hover:bg-red-100 hover:text-red-600 ${sidebarCollapsed ? 'justify-center' : ''}`}
              onClick={handleLogout}
              title={sidebarCollapsed ? 'Sair' : undefined}
            >
              <LogOut className="h-4 w-4 flex-shrink-0" />
              {!sidebarCollapsed && <span className="ml-2">Sair</span>}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className={`w-full mt-2 hover:bg-[#00B299]/10 ${sidebarCollapsed ? 'justify-center' : ''}`}
              title={sidebarCollapsed ? 'Expandir' : 'Recolher'}
            >
              {sidebarCollapsed ? (
                <ChevronRight className="h-4 w-4 text-[#00B299]" />
              ) : (
                <ChevronLeft className="h-4 w-4 text-[#00B299]" />
              )}
            </Button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-h-screen">{children}</main>
      </div>
    </div>
  )
}
