/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [],
  },
  // Garantir que arquivos estáticos sejam servidos corretamente
  // Desabilitar compressão para arquivos estáticos (Vercel faz isso automaticamente)
  compress: true,
  // Headers de segurança (excluindo arquivos estáticos do Next.js)
  // O padrão /((?!_next/static).*) exclui _next/static, _next/image e outros arquivos estáticos
  async headers() {
    return [
      {
        // Aplicar headers apenas em rotas da aplicação, não em arquivos estáticos
        source: '/((?!_next/static|_next/image|favicon.ico|.*\\.js$|.*\\.css$).*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig

