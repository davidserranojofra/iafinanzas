import type { CreateTicketDto, MensajeCola } from '~/types'
import {
  contarTicketsPendientes,
  guardarTicketPendiente,
  listarTicketsPendientes,
  eliminarTicketPendiente,
} from './useColaTicketsDb'
import {
  contarLecturasPendientes,
  guardarLecturaPendiente,
  listarLecturasPendientes,
  eliminarLecturaPendiente,
} from './useColaLecturasDb'

const CATEGORIA_MAP: Record<string, any> = {
  'alimentación': 'Alimentación',
  'alimentacion': 'Alimentación',
  'transporte':   'Transporte',
  'salud':        'Salud',
  'tecnología':   'Tecnología',
  'tecnologia':   'Tecnología',
  'ropa':         'Ropa',
  'hogar':        'Hogar',
  'entretenimiento': 'Ocio',
  'ocio':         'Ocio',
  'restaurante':  'Restaurantes',
  'restaurantes': 'Restaurantes',
  'suscripciones':'Suscripciones',
  'cuidado personal': 'Cuidado Personal',
  'cuidado_personal': 'Cuidado Personal',
  'estética': 'Cuidado Personal',
  'estetica': 'Cuidado Personal',
  'peluquería': 'Cuidado Personal',
  'peluqueria': 'Cuidado Personal',
  'otro':         'Otro',
}

function mapCategoria(raw: unknown): string {
  if (!raw) return 'Otro'
  const key = String(raw).toLowerCase().trim()
  return CATEGORIA_MAP[key] ?? 'Otro'
}

type EstadoRed = 'online' | 'offline'

interface RegistroConSync extends ServiceWorkerRegistration {
  sync: {
    register(etiqueta: string): Promise<void>
  }
}

function tieneBackgroundSync(registro: ServiceWorkerRegistration): registro is RegistroConSync {
  return 'sync' in registro && typeof (registro as RegistroConSync).sync?.register === 'function'
}

function pluralizarTickets(cantidad: number) {
  return `${cantidad} ticket${cantidad === 1 ? '' : 's'}`
}

export function esErrorDeRed(error: unknown) {
  const mensaje = error instanceof Error ? error.message : String(error ?? '')
  return /Failed to fetch|Load failed|NetworkError|network|fetch/i.test(mensaje)
}

export function useColaTickets() {
  const supabase = useSupabaseClient()

  const estadoRed = useState<EstadoRed>('estado-red', () => import.meta.client && navigator.onLine ? 'online' : 'offline')
  const ticketsPendientes = useState<number>('tickets-pendientes', () => 0)
  const lecturasPendientes = useState<number>('lecturas-pendientes', () => 0)
  const sincronizandoCola = useState<boolean>('sincronizando-cola', () => false)
  const mensajeCola = useState<MensajeCola | null>('mensaje-cola', () => null)
  const colaInicializada = useState<boolean>('cola-inicializada', () => false)

  async function actualizarTicketsPendientes() {
    if (!import.meta.client) return 0
    ticketsPendientes.value = await contarTicketsPendientes()
    lecturasPendientes.value = await contarLecturasPendientes()
    return ticketsPendientes.value + lecturasPendientes.value
  }

  async function registrarSincronizacionBackground() {
    if (!import.meta.client || !('serviceWorker' in navigator)) return false

    try {
      const registro = await navigator.serviceWorker.ready

      if (!tieneBackgroundSync(registro)) return false

      await registro.sync.register('sincronizar-cola-tickets')
      return true
    } catch {
      return false
    }
  }

  async function encolarTicket(payload: CreateTicketDto, id = payload.id ?? crypto.randomUUID()) {
    await guardarTicketPendiente({
      id,
      payload: {
        ...payload,
        id,
      },
      encoladoEn: new Date().toISOString(),
    })

    await actualizarTicketsPendientes()

    await registrarSincronizacionBackground()

    if (estadoRed.value === 'online') {
      void sincronizarCola()
    }

    return id
  }

  async function encolarLectura(file: File | Blob, userId: string, id = crypto.randomUUID()) {
    // Convertir File a Blob plano para evitar DataCloneError al serializar en IndexedDB (iOS/Android)
    const fileBlob = file instanceof File ? new Blob([file], { type: file.type }) : file

    await guardarLecturaPendiente({
      id,
      file: fileBlob,
      fileName: file instanceof File ? file.name : `ticket-${id}.jpg`,
      fileType: file.type || 'image/jpeg',
      creadoEn: new Date().toISOString(),
      userId,
    })

    await actualizarTicketsPendientes()

    await registrarSincronizacionBackground()

    if (estadoRed.value === 'online') {
      void sincronizarCola()
    }

    return id
  }

  async function sincronizarCola() {
    if (!import.meta.client) return { sincronizados: 0 }
    if (sincronizandoCola.value) return { sincronizados: 0 }

    estadoRed.value = navigator.onLine ? 'online' : 'offline'

    if (estadoRed.value === 'offline') {
      return { sincronizados: 0 }
    }

    const pendientes = await listarTicketsPendientes()
    const lecturas = await listarLecturasPendientes()

    if (!pendientes.length && !lecturas.length) {
      ticketsPendientes.value = 0
      lecturasPendientes.value = 0
      return { sincronizados: 0 }
    }

    sincronizandoCola.value = true
    let sincronizadosTotal = 0

    try {
      // Intentar refrescar la sesión para forzar la actualización de las cookies en el navegador
      let session = null
      try {
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
        if (!refreshError && refreshData.session) {
          session = refreshData.session
        }
      } catch (err) {
        console.warn('[useColaTickets] Error al refrescar sesión, intentando getSession:', err)
      }

      if (!session) {
        const { data: sesionData, error: sesionError } = await supabase.auth.getSession()
        if (sesionError) throw sesionError
        if (!sesionData.session) {
          mensajeCola.value = { tipo: 'error', texto: 'Tu sesión venció. Volvé a iniciar sesión para sincronizar los tickets pendientes.' }
          return { sincronizados: 0, requiereSesion: true }
        }
      }

      // 1. Sincronizar primero los tickets ya procesados
      if (pendientes.length > 0) {
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

        if (response.status === 401) {
          mensajeCola.value = { tipo: 'error', texto: 'Tu sesión ya no es válida. Iniciá sesión de nuevo para sincronizar los tickets pendientes.' }
          return { sincronizados: 0, requiereSesion: true }
        }

        if (!response.ok) {
          throw new Error('No se pudo sincronizar la cola offline.')
        }

        const data = await response.json() as { idsSincronizados?: string[] }
        const idsSincronizados = data.idsSincronizados ?? []

        await Promise.all(idsSincronizados.map(id => eliminarTicketPendiente(id)))
        sincronizadosTotal += idsSincronizados.length
      }

      // 2. Procesar lecturas de imágenes offline pendientes con la IA
      if (lecturas.length > 0) {
        let index = 0
        for (const lectura of lecturas) {
          mensajeCola.value = { tipo: 'progreso', texto: `Procesando ticket ${index + 1} de ${lecturas.length} con IA...` }
          try {
            // Subir imagen a Supabase Storage
            const ext = lectura.fileName ? (lectura.fileName.split('.').pop() ?? 'jpg') : 'jpg'
            const path = `${lectura.userId}/${Date.now()}-${lectura.id}.${ext}`
            const { error: uploadError } = await supabase.storage.from('tickets').upload(path, lectura.file, {
              contentType: lectura.fileType,
            })

            if (uploadError) throw uploadError

            const { data: publicUrlData } = supabase.storage.from('tickets').getPublicUrl(path)
            const imageUrl = publicUrlData.publicUrl

            // Extraer info con IA
            let ticketFinalPayload: any

            try {
              const formData = new FormData()
              formData.append('image', lectura.file)
              
              const activeModel = localStorage.getItem('ia_model') || 'meta-llama/llama-4-scout-17b-16e-instruct'

              const raw = await $fetch<any>('/api/process-ticket', {
                method: 'POST',
                body: formData,
                headers: {
                  'x-ia-model': activeModel
                }
              })

              ticketFinalPayload = {
                id: lectura.id,
                comercio: String(raw.comercio ?? 'Ticket Offline'),
                fecha: String(raw.fecha ?? new Date().toISOString().slice(0, 10)),
                total: Number(raw.total ?? 0),
                iva: raw.iva != null ? Number(raw.iva) : undefined,
                categoria: mapCategoria(raw.categoria),
                metodoPago: raw.metodo_pago ?? raw.metodoPago ?? undefined,
                notas: `🤖 [Auto] ` + (raw.notas ?? 'Procesado automáticamente desde la cola offline.'),
                imageUrl,
                items: Array.isArray(raw.items) ? raw.items : [],
                extractedByAI: true,
                aiConfidence: raw.confianza ?? 0.85,
              }
            } catch (iaError) {
              console.warn('[useColaTickets] Error al procesar imagen con IA, creando ticket para revisión:', iaError)
              // Fallback para evitar pérdida de datos: Guardamos un ticket de revisión
              ticketFinalPayload = {
                id: lectura.id,
                comercio: `Revisar Ticket Offline`,
                fecha: lectura.creadoEn.slice(0, 10),
                total: 0,
                categoria: 'Otro',
                imageUrl,
                notas: 'La extracción por IA falló en segundo plano. Completá los datos manualmente.',
                extractedByAI: false,
              }
            }

            // Guardar en la DB remota
            const syncResponse = await $fetch<any>('/api/tickets/sync', {
              method: 'POST',
              body: {
                tickets: [ticketFinalPayload]
              }
            })

            if (syncResponse && syncResponse.idsSincronizados?.includes(lectura.id)) {
              await eliminarLecturaPendiente(lectura.id)
              sincronizadosTotal++
            }

          } catch (procError: any) {
            console.error('[useColaTickets] Error en proceso de lectura offline:', procError)
            // El motivo real del fallo viaja en el body de la respuesta (statusMessage),
            // no en el mensaje del FetchError, que solo trae "[POST] url: 500"
            const errorMsg = procError?.data?.statusMessage
              ?? procError?.data?.message
              ?? (procError instanceof Error ? procError.message : String(procError))
            mensajeCola.value = { tipo: 'error', texto: `Error en sincronización: ${errorMsg}` }
            
            if (esErrorDeRed(procError)) {
              await registrarSincronizacionBackground()
              break // Detenemos la cola temporalmente si hay error de red
            }
          }
          index++
        }
      }

      await actualizarTicketsPendientes()

      if (sincronizadosTotal > 0) {
        clearNuxtData('tickets')
        const totalRestantes = ticketsPendientes.value + lecturasPendientes.value
        mensajeCola.value = {
          tipo: 'exito',
          texto: totalRestantes > 0
            ? `Se sincronizaron ${pluralizarTickets(sincronizadosTotal)}. Quedan ${pluralizarTickets(totalRestantes)} pendientes.`
            : 'Todos los tickets y lecturas pendientes ya se sincronizaron.',
        }
      } else {
        const totalRestantes = ticketsPendientes.value + lecturasPendientes.value
        if (totalRestantes === 0) {
          mensajeCola.value = null
        }
      }

      return { sincronizados: sincronizadosTotal }
    } catch (error: any) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      if (esErrorDeRed(error)) {
        await registrarSincronizacionBackground()
        mensajeCola.value = { tipo: 'info', texto: 'Conexión inestable. Se reintentará al recuperar cobertura.' }
      } else {
        mensajeCola.value = { tipo: 'error', texto: `Error al sincronizar: ${errorMsg}` }
      }

      return { sincronizados: 0, error }
    } finally {
      sincronizandoCola.value = false
    }
  }

  async function inicializarCola() {
    if (!import.meta.client || colaInicializada.value) return

    const manejarOnline = () => {
      estadoRed.value = 'online'
      void sincronizarCola()
    }

    const manejarOffline = () => {
      estadoRed.value = 'offline'
    }

    const manejarVisibilidad = () => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        estadoRed.value = 'online'
        void sincronizarCola()
      }
    }

    const manejarMensajeWorker = (event: MessageEvent<{ type?: string }>) => {
      if (event.data?.type === 'cola-tickets-actualizada') {
        void actualizarTicketsPendientes()
      }
    }

    estadoRed.value = navigator.onLine ? 'online' : 'offline'
    await actualizarTicketsPendientes()

    window.addEventListener('online', manejarOnline)
    window.addEventListener('offline', manejarOffline)
    document.addEventListener('visibilitychange', manejarVisibilidad)

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', manejarMensajeWorker)
    }

    colaInicializada.value = true

    if (estadoRed.value === 'online' && (ticketsPendientes.value > 0 || lecturasPendientes.value > 0)) {
      void sincronizarCola()
    }
  }

  function limpiarMensajeCola() {
    mensajeCola.value = null
  }

  async function vaciarCola() {
    if (!import.meta.client) return
    const { abrirBaseOffline } = await import('./useOfflineDb')
    const db = await abrirBaseOffline()
    await db.clear('tickets-pendientes')
    await db.clear('lecturas-pendientes')
    db.close()
    
    await actualizarTicketsPendientes()
    mensajeCola.value = null
  }

  return {
    estadoRed,
    ticketsPendientes,
    lecturasPendientes,
    sincronizandoCola,
    mensajeCola,
    actualizarTicketsPendientes,
    inicializarCola,
    limpiarMensajeCola,
    encolarTicket,
    encolarLectura,
    sincronizarCola,
    vaciarCola,
  }
}
