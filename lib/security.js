import { NextResponse } from 'next/server'

/**
 * Adiciona headers de segurança às respostas
 */
export function addSecurityHeaders(response) {
  // Headers de segurança
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')
  
  // CSP básico
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;"
  )
  
  return response
}

/**
 * Cria uma resposta JSON com headers de segurança
 */
export function secureJsonResponse(data, status = 200) {
  const response = NextResponse.json(data, { status })
  return addSecurityHeaders(response)
}





