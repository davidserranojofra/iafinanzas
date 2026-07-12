/// <reference lib="webworker" />

import { clientsClaim } from 'workbox-core'
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'
import { eliminarTicketPendiente, listarTicketsPendientes } from './composables/useColaTicketsDb'

declare let self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ url: string; revision: string | null }>
}

interface EventoSync extends ExtendableEvent {
  tag: string
}

const ETIQUETA_SYNC = 'sincronizar-cola-tickets'

precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()
clientsClaim()

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

self.addEventListener('sync', (event: Event) => {
  const eventoSync = event as EventoSync

  if (eventoSync.tag !== ETIQUETA_SYNC) return

  eventoSync.waitUntil(sincronizarTicketsPendientes())
})

async function sincronizarTicketsPendientes() {
  const pendientes = await listarTicketsPendientes()

  if (!pendientes.length) {
    await avisarClientes()
    return
  }

  const response = await fetch('/api/tickets/sync', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      tickets: pendientes.map(({ payload }) => payload),
    }),
  })

  if (!response.ok) {
    throw new Error('No se pudo sincronizar la cola offline desde el service worker.')
  }

  const data = await response.json() as { idsSincronizados?: string[] }

  await Promise.all((data.idsSincronizados ?? []).map(id => eliminarTicketPendiente(id)))
  await avisarClientes()
}

async function avisarClientes() {
  const clientes = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })

  for (const cliente of clientes) {
    cliente.postMessage({ type: 'cola-tickets-actualizada' })
  }
}

// Escuchar eventos de Web Push enviados por el servidor
self.addEventListener('push', (event: any) => {
  let data = { title: 'Cartera 📊', body: 'Tenés novedades sobre tus finanzas.' }
  if (event.data) {
    try {
      data = event.data.json()
    } catch (e) {
      data = { title: 'Cartera 📊', body: event.data.text() }
    }
  }

  // 'vibrate' no forma parte del NotificationOptions estándar (solo Chrome Android lo respeta)
  const options: NotificationOptions & { vibrate?: number[] } = {
    body: data.body,
    icon: '/icono.png',
    badge: '/pwa-64x64.png',
    vibrate: [100, 50, 100],
    data: {
      url: '/'
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})

// Escuchar el clic sobre la notificación del sistema
self.addEventListener('notificationclick', (event: any) => {
  event.notification.close()

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList: any) => {
      // Si ya hay una ventana abierta de la app (mismo origin), enfocarla
      for (const client of clientList) {
        if (client.url?.includes(self.location.origin) && 'focus' in client) {
          return client.focus()
        }
      }
      // Si no, abrir una nueva ventana
      if (self.clients.openWindow) {
        return self.clients.openWindow('/')
      }
    })
  )
})
