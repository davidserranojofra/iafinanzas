import { describe, it, expect, beforeEach } from 'vitest'
import { abrirBaseOffline, NOMBRE_DB_OFFLINE, VERSION_DB_OFFLINE } from '~/composables/useOfflineDb'

describe('useOfflineDb', () => {
  it('debería abrir la base de datos con el nombre y versión correctos', async () => {
    const db = await abrirBaseOffline()
    expect(db.name).toBe(NOMBRE_DB_OFFLINE)
    expect(db.version).toBe(VERSION_DB_OFFLINE)
    db.close()
  })

  it('debería contener todos los almacenes de objetos requeridos', async () => {
    const db = await abrirBaseOffline()
    const stores = Array.from(db.objectStoreNames)
    expect(stores).toContain('tickets-pendientes')
    expect(stores).toContain('tickets-snapshots')
    expect(stores).toContain('lecturas-pendientes')
    db.close()
  })
})
