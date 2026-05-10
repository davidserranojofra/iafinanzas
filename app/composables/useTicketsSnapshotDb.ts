import type { Ticket } from '~/types'
import {
  abrirBaseOffline,
  ALMACEN_SNAPSHOTS_TICKETS,
} from './useOfflineDb'

interface TicketsSnapshot {
  userId: string
  tickets: Ticket[]
  updatedAt: string
}

export async function guardarSnapshotTickets(userId: string, tickets: Ticket[]) {
  const base = await abrirBaseOffline()
  const snapshot: TicketsSnapshot = {
    userId,
    tickets,
    updatedAt: new Date().toISOString(),
  }

  await base.put(ALMACEN_SNAPSHOTS_TICKETS, snapshot)
}

export async function obtenerSnapshotTickets(userId: string) {
  const base = await abrirBaseOffline()
  return (await base.get(ALMACEN_SNAPSHOTS_TICKETS, userId) as TicketsSnapshot | undefined) ?? null
}

export async function eliminarSnapshotTickets(userId: string) {
  const base = await abrirBaseOffline()
  await base.delete(ALMACEN_SNAPSHOTS_TICKETS, userId)
}
