'use client'

import { useEffect } from 'react'

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Limpar service workers antigos que possam estar causando problemas
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          // Se o service worker não for o atual, desregistrar
          if (registration.active?.scriptURL && !registration.active.scriptURL.includes('sw.js')) {
            registration.unregister()
          }
        })
      })

      // Registrar Service Worker após a página carregar completamente
      const registerSW = () => {
        navigator.serviceWorker
          .register('/sw.js', { scope: '/' })
          .then((registration) => {
            console.log('Service Worker registrado com sucesso:', registration.scope)
            
            // Verificar atualizações quando houver mudanças
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    // Novo service worker disponível, recarregar página
                    window.location.reload()
                  }
                })
              }
            })
          })
          .catch((error) => {
            console.log('Erro ao registrar Service Worker:', error)
          })
      }

      // Aguardar página carregar completamente
      if (document.readyState === 'complete') {
        registerSW()
      } else {
        window.addEventListener('load', registerSW)
      }
    }
  }, [])

  return null
}







