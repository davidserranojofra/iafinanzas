import { describe, it, expect, beforeEach } from 'vitest'
import { abrirBaseOffline } from '~/composables/useOfflineDb'
import {
  guardarLecturaPendiente,
  listarLecturasPendientes,
  eliminarLecturaPendiente,
  contarLecturasPendientes,
  type LecturaPendiente
} from '~/composables/useColaLecturasDb'

describe('useColaLecturasDb', () => {
  beforeEach(async () => {
    const db = await abrirBaseOffline()
    await db.clear('lecturas-pendientes')
    db.close()
  })

  const mockLectura: LecturaPendiente = {
    id: 'l-1',
    file: new Blob(['mock content'], { type: 'image/png' }),
    fileName: 'ticket.png',
    fileType: 'image/png',
    creadoEn: '2026-06-28T18:00:00Z',
    userId: 'user-123'
  }

  it('debería contar 0 lecturas inicialmente', async () => {
    const count = await contarLecturasPendientes()
    expect(count).toBe(0)
  })

  it('debería guardar una lectura en la cola', async () => {
    await guardarLecturaPendiente(mockLectura)
    const count = await contarLecturasPendientes()
    expect(count).toBe(1)

    const list = await listarLecturasPendientes()
    expect(list).toHaveLength(1)
    expect(list[0].id).toBe(mockLectura.id)
    expect(list[0].fileName).toBe(mockLectura.fileName)
  })

  it('debería eliminar una lectura de la cola', async () => {
    await guardarLecturaPendiente(mockLectura)
    let count = await contarLecturasPendientes()
    expect(count).toBe(1)

    await eliminarLecturaPendiente('l-1')
    count = await contarLecturasPendientes()
    expect(count).toBe(0)
  })
})
