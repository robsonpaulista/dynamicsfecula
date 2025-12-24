import './globals.css'
import { Inter } from 'next/font/google'
import { Toaster } from '@/components/ui/toaster'
import { AuthProvider } from '@/lib/auth'
import ServiceWorkerRegistration from '@/components/pwa/ServiceWorkerRegistration'
import InstallPrompt from '@/components/pwa/InstallPrompt'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'DynamicsADM - Sistema de Gestão',
  description: 'Sistema completo de gestão empresarial - Compras, Estoque, Vendas e Financeiro',
  manifest: '/manifest.json',
  themeColor: '#00B299',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'DynamicsADM',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/icons/icon-192x192.svg', sizes: '192x192', type: 'image/svg+xml' },
      { url: '/icons/icon-512x512.svg', sizes: '512x512', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/icons/icon-192x192.svg', sizes: '192x192', type: 'image/svg+xml' },
    ],
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: 'cover',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#00B299" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="DynamicsADM" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.svg" />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <ServiceWorkerRegistration />
        <AuthProvider>
          {children}
          <Toaster />
          <InstallPrompt />
        </AuthProvider>
      </body>
    </html>
  )
}

