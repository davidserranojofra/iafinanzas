import { describe, it, expect, beforeEach } from 'vitest'
import { abrirBaseOffline } from '~/composables/useOfflineDb'
import {
  guardarTicketPendiente,
  listarTicketsPendientes,
  eliminarTicketPendiente,
  contarTicketsPendientes,
  type TicketPendiente
} from '~/composables/useColaTicketsDb'

describe('useColaTicketsDb', () => {
  beforeEach(async () => {
    // Limpiamos la base de datos antes de cada test
    const db = await abrirBaseOffline()
    await db.clear('tickets-pendientes')
    db.close()
  })

  const mockTicket: TicketPendiente = {
    id: 't-1',
    payload: {
      id: 't-1',
      emisor: 'Restaurante Pepito',
      total: 25.5,
      fecha: '2026-06-28',
      categoria: 'Comida',
      notas: 'Almuerzo de trabajo'
    },
    encoladoEn: '2026-06-28T18:00:00Z'
  }

  it('debería contar 0 tickets inicialmente', async () => {
    const count = await contarTicketsPendientes()
    expect(count).toBe(0)
  })

  it('debería guardar un ticket en la cola', async () => {
    await guardarTicketPendiente(mockTicket)
    const count = await contarTicketsPendientes()
    expect(count).toBe(1)

    const list = await listarTicketsPendientes()
    expect(list).toHaveLength(1)
    expect(list[0]).toEqual(mockTicket)
  })

  it('debería eliminar un ticket de la cola', async () => {
    await guardarTicketPendiente(mockTicket)
    let count = await contarTicketsPendientes()
    expect(count).toBe(1)

    await eliminarTicketPendiente('t-1')
    count = await contarTicketsPendientes()
    expect(count).toBe(0)
  })
})
