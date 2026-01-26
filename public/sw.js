// Service Worker para PWA
const CACHE_NAME = 'dynamicsadm-v2' // Incrementado para forçar atualização
const urlsToCache = [
  '/',
  '/dashboard',
  '/login',
  '/manifest.json',
  '/icons/icon-192x192.svg',
  '/icons/icon-512x512.svg',
]

// NÃO cachear arquivos estáticos do Next.js
const shouldCache = (url) => {
  return !url.includes('/_next/static') && 
         !url.includes('/_next/image') &&
         !url.includes('/api/') &&
         !url.endsWith('.js') &&
         !url.endsWith('.css') &&
         !url.endsWith('.woff') &&
         !url.endsWith('.woff2')
}

// Instalar Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Cachear apenas URLs que devem ser cacheadas
      const urlsToCacheFiltered = urlsToCache.filter(shouldCache)
      return cache.addAll(urlsToCacheFiltered).catch((error) => {
        console.log('Erro ao cachear URLs:', error)
        // Continuar mesmo se algumas URLs falharem
      })
    })
  )
  // Forçar ativação imediata do novo service worker
  self.skipWaiting()
})

// Ativar Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  // Assumir controle imediato de todas as páginas
  return self.clients.claim()
})

// Interceptar requisições
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  
  // NÃO interceptar arquivos estáticos do Next.js (chunks, assets, etc)
  // Esses arquivos devem sempre vir da rede para garantir versões atualizadas
  if (
    url.pathname.startsWith('/_next/static') ||
    url.pathname.startsWith('/_next/image') ||
    url.pathname.startsWith('/api/') ||
    url.pathname.includes('.js') ||
    url.pathname.includes('.css') ||
    url.pathname.includes('.woff') ||
    url.pathname.includes('.woff2')
  ) {
    // Sempre buscar da rede para arquivos estáticos
    return fetch(event.request)
  }
  
  // Para outras requisições, usar estratégia cache-first
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Retornar do cache se disponível, senão buscar da rede
      return response || fetch(event.request)
    })
  )
})







