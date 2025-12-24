import { MetadataRoute } from 'next'

export default function manifest() {
  return {
    name: 'DynamicsADM - Sistema de Gestão',
    short_name: 'DynamicsADM',
    description: 'Sistema completo de gestão empresarial - Compras, Estoque, Vendas e Financeiro',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#00B299',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/icons/icon-72x72.svg',
        sizes: '72x72',
        type: 'image/svg+xml',
        purpose: 'maskable any',
      },
      {
        src: '/icons/icon-96x96.svg',
        sizes: '96x96',
        type: 'image/svg+xml',
        purpose: 'maskable any',
      },
      {
        src: '/icons/icon-128x128.svg',
        sizes: '128x128',
        type: 'image/svg+xml',
        purpose: 'maskable any',
      },
      {
        src: '/icons/icon-144x144.svg',
        sizes: '144x144',
        type: 'image/svg+xml',
        purpose: 'maskable any',
      },
      {
        src: '/icons/icon-152x152.svg',
        sizes: '152x152',
        type: 'image/svg+xml',
        purpose: 'maskable any',
      },
      {
        src: '/icons/icon-192x192.svg',
        sizes: '192x192',
        type: 'image/svg+xml',
        purpose: 'maskable any',
      },
      {
        src: '/icons/icon-384x384.svg',
        sizes: '384x384',
        type: 'image/svg+xml',
        purpose: 'maskable any',
      },
      {
        src: '/icons/icon-512x512.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'maskable any',
      },
    ],
    categories: ['business', 'productivity', 'finance'],
    shortcuts: [
      {
        name: 'Dashboard',
        short_name: 'Dashboard',
        description: 'Acessar o painel principal',
        url: '/dashboard',
        icons: [{ src: '/icons/icon-96x96.png', sizes: '96x96' }],
      },
      {
        name: 'Vendas',
        short_name: 'Vendas',
        description: 'Gerenciar vendas',
        url: '/dashboard/sales',
        icons: [{ src: '/icons/icon-96x96.png', sizes: '96x96' }],
      },
      {
        name: 'Financeiro',
        short_name: 'Financeiro',
        description: 'Acessar o módulo financeiro',
        url: '/dashboard/finance',
        icons: [{ src: '/icons/icon-96x96.png', sizes: '96x96' }],
      },
    ],
  }
}
