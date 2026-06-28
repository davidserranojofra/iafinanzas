import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { abrirBaseOffline } from '~/composables/useOfflineDb'
import { useColaTickets } from '~/composables/useColaTickets'
import { contarTicketsPendientes } from '~/composables/useColaTicketsDb'

// 1. Mocks de Nuxt y Supabase
const mockSupabase = {
  auth: {
    getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
  },
  storage: {
    from: vi.fn(),
  },
}

mockNuxtImport('useSupabaseClient', () => {
  return () => mockSupabase
})

// Mock de clearNuxtData
mockNuxtImport('clearNuxtData', () => {
  return vi.fn()
})

describe('useColaTickets', () => {
  let originalOnLine: boolean
  let originalServiceWorker: any
  let fetchSpy: any

  beforeEach(async () => {
    // Guardamos propiedades del navegador originales
    originalOnLine = navigator.onLine
    originalServiceWorker = navigator.serviceWorker

    // Limpiamos base de datos
    const db = await abrirBaseOffline()
    await db.clear('tickets-pendientes')
    await db.clear('lecturas-pendientes')
    db.close()

    // Stub de fetch global para evitar problemas con h3Fetch
    fetchSpy = vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      json: () => Promise.resolve({ idsSincronizados: [] })
    })
    vi.stubGlobal('fetch', fetchSpy)

    // Stub de navigator.serviceWorker
    vi.stubGlobal('navigator', {
      ...navigator,
      onLine: true,
      serviceWorker: {
        ready: Promise.resolve({
          sync: {
            register: vi.fn().mockResolvedValue(true)
          }
        })
      }
    })

    // Valores por defecto para Supabase
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'user-123' } } },
      error: null
    })
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null
    })

    // Reseteamos estados compartidos de Nuxt (useState)
    const { estadoRed, ticketsPendientes, lecturasPendientes, sincronizandoCola, mensajeCola } = useColaTickets()
    estadoRed.value = 'online'
    ticketsPendientes.value = 0
    lecturasPendientes.value = 0
    sincronizandoCola.value = false
    mensajeCola.value = null
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('debería encolar un ticket y guardarlo en la cola local si está offline sin llamar a fetch', async () => {
    // Configuramos navegador offline
    vi.stubGlobal('navigator', {
      ...navigator,
      onLine: false,
    })

    const { encolarTicket, estadoRed } = useColaTickets()
    
    // Seteamos el estado local del composable a offline
    estadoRed.value = 'offline'

    const ticket = {
      emisor: 'Supermercado Sol',
      total: 15.75,
      fecha: '2026-06-28',
      categoria: 'Alimentación'
    }

    const id = await encolarTicket(ticket)
    expect(id).toBeDefined()

    // Verificar guardado local
    const count = await contarTicketsPendientes()
    expect(count).toBe(1)

    // Verificar que no se llamó a la API remota
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('debería llamar a la API y vaciar la cola local si está online y el servidor responde exitoso', async () => {
    // Mock de respuesta exitosa del endpoint de sincronización
    fetchSpy.mockResolvedValue({
      status: 200,
      ok: true,
      json: () => Promise.resolve({ idsSincronizados: ['t-100'] })
    })

    const { encolarTicket, sincronizarCola } = useColaTickets()

    const ticket = {
      id: 't-100',
      emisor: 'Gasolinera Cepsa',
      total: 60.0,
      fecha: '2026-06-28',
      categoria: 'Transporte'
    }

    // Al encolar estando online, encolamos y ejecutamos la sincronización de forma controlada
    await encolarTicket(ticket, 't-100')
    await sincronizarCola()

    // Debería haberse llamado a fetch con el endpoint correcto
    expect(fetchSpy).toHaveBeenCalledWith('/api/tickets/sync', expect.any(Object))

    // El ticket se tuvo que haber eliminado de la cola local tras sincronizarse
    const count = await contarTicketsPendientes()
    expect(count).toBe(0)
  })

  it('no debería eliminar el ticket de la cola local si la sesión de Supabase ha caducado', async () => {
    // Simulamos sesión vencida en Supabase
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null
    })

    const { encolarTicket, sincronizarCola, mensajeCola } = useColaTickets()

    const ticket = {
      id: 't-200',
      emisor: 'Papelería ABC',
      total: 5.0,
      fecha: '2026-06-28',
      categoria: 'Oficina'
    }

    await encolarTicket(ticket, 't-200')
    await sincronizarCola()

    // El ticket debe seguir en la cola local para no perder datos
    const count = await contarTicketsPendientes()
    expect(count).toBe(1)

    // Debe mostrarse el aviso correspondiente
    expect(mensajeCola.value).toContain('Tu sesión venció')
  })
})
