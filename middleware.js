import { NextResponse } from 'next/server'

export function middleware(request) {
  const { pathname } = request.nextUrl

  // Rotas que não precisam de autenticação
  const publicRoutes = ['/login', '/api/auth/login', '/api/health', '/api/seed', '/seed']
  
  // Verificar se é rota pública
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Permitir rota raiz
  if (pathname === '/') {
    return NextResponse.next()
  }

  // Proteger rotas do dashboard
  if (pathname.startsWith('/dashboard')) {
    // A verificação de autenticação será feita no layout do dashboard
    // e nas rotas da API individualmente
    return NextResponse.next()
  }

  // Proteger rotas da API (exceto login)
  if (pathname.startsWith('/api') && !pathname.startsWith('/api/auth/login')) {
    // A autenticação será verificada em cada rota individualmente
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}










