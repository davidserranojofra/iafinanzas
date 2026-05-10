import type { CreateTicketDto } from '~/types'
import {
  abrirBaseOffline,
  ALMACEN_TICKETS_PENDIENTES,
} from './useOfflineDb'

export interface TicketSincronizable extends CreateTicketDto {
  id: string
}

export interface TicketPendiente {
  id: string
  payload: TicketSincronizable
  encoladoEn: string
}

export async function guardarTicketPendiente(ticket: TicketPendiente) {
  const base = await abrirBaseOffline()
  await base.put(ALMACEN_TICKETS_PENDIENTES, ticket)
}

export async function listarTicketsPendientes() {
  const base = await abrirBaseOffline()
  return base.getAll(ALMACEN_TICKETS_PENDIENTES) as Promise<TicketPendiente[]>
}

export async function eliminarTicketPendiente(id: string) {
  const base = await abrirBaseOffline()
  await base.delete(ALMACEN_TICKETS_PENDIENTES, id)
}

export async function contarTicketsPendientes() {
  const base = await abrirBaseOffline()
  return base.count(ALMACEN_TICKETS_PENDIENTES)
}
