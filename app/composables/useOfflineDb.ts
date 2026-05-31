import { openDB } from 'idb'

export const NOMBRE_DB_OFFLINE = 'iafianza-offline-db'
export const VERSION_DB_OFFLINE = 4
export const ALMACEN_TICKETS_PENDIENTES = 'tickets-pendientes'
export const ALMACEN_SNAPSHOTS_TICKETS = 'tickets-snapshots'
export const ALMACEN_LECTURAS_PENDIENTES = 'lecturas-pendientes'

export async function abrirBaseOffline() {
  return openDB(NOMBRE_DB_OFFLINE, VERSION_DB_OFFLINE, {
    upgrade(base) {
      if (!base.objectStoreNames.contains(ALMACEN_TICKETS_PENDIENTES)) {
        base.createObjectStore(ALMACEN_TICKETS_PENDIENTES, { keyPath: 'id' })
      }

      if (!base.objectStoreNames.contains(ALMACEN_SNAPSHOTS_TICKETS)) {
        base.createObjectStore(ALMACEN_SNAPSHOTS_TICKETS, { keyPath: 'userId' })
      }

      if (!base.objectStoreNames.contains(ALMACEN_LECTURAS_PENDIENTES)) {
        base.createObjectStore(ALMACEN_LECTURAS_PENDIENTES, { keyPath: 'id' })
      }
    },
  })
}
