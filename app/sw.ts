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
self.skipWaiting()

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
