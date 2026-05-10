import { openDB } from 'idb'

export const NOMBRE_DB_OFFLINE = 'iafianza-offline-db'
export const VERSION_DB_OFFLINE = 3
export const ALMACEN_TICKETS_PENDIENTES = 'tickets-pendientes'
export const ALMACEN_SNAPSHOTS_TICKETS = 'tickets-snapshots'

export async function abrirBaseOffline() {
  return openDB(NOMBRE_DB_OFFLINE, VERSION_DB_OFFLINE, {
    upgrade(base) {
      if (!base.objectStoreNames.contains(ALMACEN_TICKETS_PENDIENTES)) {
        base.createObjectStore(ALMACEN_TICKETS_PENDIENTES, { keyPath: 'id' })
      }

      if (!base.objectStoreNames.contains(ALMACEN_SNAPSHOTS_TICKETS)) {
        base.createObjectStore(ALMACEN_SNAPSHOTS_TICKETS, { keyPath: 'userId' })
      }
    },
  })
}
