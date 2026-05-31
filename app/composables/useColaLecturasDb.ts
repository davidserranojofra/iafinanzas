import {
  abrirBaseOffline,
  ALMACEN_LECTURAS_PENDIENTES,
} from './useOfflineDb'

export interface LecturaPendiente {
  id: string
  file: File | Blob
  fileName: string
  fileType: string
  creadoEn: string
  userId: string
}

export async function guardarLecturaPendiente(lectura: LecturaPendiente) {
  const base = await abrirBaseOffline()
  await base.put(ALMACEN_LECTURAS_PENDIENTES, lectura)
}

export async function listarLecturasPendientes() {
  const base = await abrirBaseOffline()
  return base.getAll(ALMACEN_LECTURAS_PENDIENTES) as Promise<LecturaPendiente[]>
}

export async function eliminarLecturaPendiente(id: string) {
  const base = await abrirBaseOffline()
  await base.delete(ALMACEN_LECTURAS_PENDIENTES, id)
}

export async function contarLecturasPendientes() {
  const base = await abrirBaseOffline()
  return base.count(ALMACEN_LECTURAS_PENDIENTES)
}
