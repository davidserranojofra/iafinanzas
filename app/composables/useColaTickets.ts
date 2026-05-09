import type { CreateTicketDto } from '~/types'
import {
  contarTicketsPendientes,
  guardarTicketPendiente,
  listarTicketsPendientes,
  eliminarTicketPendiente,
} from './useColaTicketsDb'

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
  const sincronizandoCola = useState<boolean>('sincronizando-cola', () => false)
  const mensajeCola = useState<string | null>('mensaje-cola', () => null)
  const colaInicializada = useState<boolean>('cola-inicializada', () => false)

  async function actualizarTicketsPendientes() {
    if (!import.meta.client) return 0
    ticketsPendientes.value = await contarTicketsPendientes()
    return ticketsPendientes.value
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
    mensajeCola.value = 'Ticket guardado sin conexión. Se va a sincronizar automáticamente.'

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

    if (!pendientes.length) {
      ticketsPendientes.value = 0
      return { sincronizados: 0 }
    }

    sincronizandoCola.value = true

    try {
      const { data: sesionData, error: sesionError } = await supabase.auth.getSession()

      if (sesionError) throw sesionError
      if (!sesionData.session) {
        mensajeCola.value = 'Tu sesión venció. Volvé a iniciar sesión para sincronizar los tickets pendientes.'
        return { sincronizados: 0, requiereSesion: true }
      }

      const { data: usuarioData, error: usuarioError } = await supabase.auth.getUser()

      if (usuarioError || !usuarioData.user) {
        mensajeCola.value = 'No pudimos validar tu sesión. Volvé a iniciar sesión para sincronizar la cola.'
        return { sincronizados: 0, requiereSesion: true }
      }

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
        mensajeCola.value = 'Tu sesión ya no es válida. Iniciá sesión de nuevo para sincronizar los tickets pendientes.'
        return { sincronizados: 0, requiereSesion: true }
      }

      if (!response.ok) {
        throw new Error('No se pudo sincronizar la cola offline.')
      }

      const data = await response.json() as { idsSincronizados?: string[] }
      const idsSincronizados = data.idsSincronizados ?? []

      await Promise.all(idsSincronizados.map(id => eliminarTicketPendiente(id)))
      await actualizarTicketsPendientes()

      if (idsSincronizados.length > 0) {
        clearNuxtData('tickets')
        mensajeCola.value = ticketsPendientes.value > 0
          ? `Se sincronizaron ${pluralizarTickets(idsSincronizados.length)}. Quedan ${pluralizarTickets(ticketsPendientes.value)} en cola.`
          : 'Todos los tickets pendientes ya se sincronizaron.'
      }

      return { sincronizados: idsSincronizados.length }
    } catch (error) {
      if (esErrorDeRed(error)) {
        await registrarSincronizacionBackground()
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

    const manejarMensajeWorker = (event: MessageEvent<{ type?: string }>) => {
      if (event.data?.type === 'cola-tickets-actualizada') {
        void actualizarTicketsPendientes()
      }
    }

    estadoRed.value = navigator.onLine ? 'online' : 'offline'
    await actualizarTicketsPendientes()

    window.addEventListener('online', manejarOnline)
    window.addEventListener('offline', manejarOffline)

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', manejarMensajeWorker)
    }

    colaInicializada.value = true

    if (estadoRed.value === 'online' && ticketsPendientes.value > 0) {
      void sincronizarCola()
    }
  }

  function limpiarMensajeCola() {
    mensajeCola.value = null
  }

  return {
    estadoRed,
    ticketsPendientes,
    sincronizandoCola,
    mensajeCola,
    actualizarTicketsPendientes,
    inicializarCola,
    limpiarMensajeCola,
    encolarTicket,
    sincronizarCola,
  }
}
