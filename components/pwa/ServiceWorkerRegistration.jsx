'use client'

import { useEffect } from 'react'

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Registrar Service Worker
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('Service Worker registrado com sucesso:', registration.scope)
            
            // Verificar atualizações periodicamente
            setInterval(() => {
              registration.update()
            }, 60000) // A cada 1 minuto
          })
          .catch((error) => {
            console.log('Erro ao registrar Service Worker:', error)
          })
      })
    }
  }, [])

  return null
}
