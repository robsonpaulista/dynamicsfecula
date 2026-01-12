/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [],
  },
  // Headers de segurança (aplicados apenas em rotas da aplicação)
  // Os arquivos estáticos do Next.js (_next/static, _next/image) não recebem esses headers
  async headers() {
    return [
      {
        // Aplicar em todas as rotas exceto arquivos estáticos
        source: '/:path*',
        headers: [
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
      {
        // Aplicar X-Content-Type-Options apenas em rotas da aplicação (não em _next)
        source: '/:path*',
        missing: [
          {
            type: 'header',
            key: 'x-nextjs-data',
          },
        ],
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig

