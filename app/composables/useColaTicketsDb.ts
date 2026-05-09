import { openDB } from 'idb'
import type { CreateTicketDto } from '~/types'

export interface TicketSincronizable extends CreateTicketDto {
  id: string
}

export interface TicketPendiente {
  id: string
  payload: TicketSincronizable
  encoladoEn: string
}

const NOMBRE_DB = 'iafianza-offline-db'
const VERSION_DB = 1
const ALMACEN_TICKETS = 'tickets-pendientes'

async function abrirBaseOffline() {
  return openDB(NOMBRE_DB, VERSION_DB, {
    upgrade(base) {
      if (!base.objectStoreNames.contains(ALMACEN_TICKETS)) {
        base.createObjectStore(ALMACEN_TICKETS, { keyPath: 'id' })
      }
    },
  })
}

export async function guardarTicketPendiente(ticket: TicketPendiente) {
  const base = await abrirBaseOffline()
  await base.put(ALMACEN_TICKETS, ticket)
}

export async function listarTicketsPendientes() {
  const base = await abrirBaseOffline()
  return base.getAll(ALMACEN_TICKETS) as Promise<TicketPendiente[]>
}

export async function eliminarTicketPendiente(id: string) {
  const base = await abrirBaseOffline()
  await base.delete(ALMACEN_TICKETS, id)
}

export async function contarTicketsPendientes() {
  const base = await abrirBaseOffline()
  return base.count(ALMACEN_TICKETS)
}
