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
    refreshSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
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
    mockSupabase.auth.refreshSession.mockResolvedValue({
      data: { session: { user: { id: 'user-123' } } },
      error: null
    })
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'user-123' } } },
      error: null
    })
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null
    })

    // En el beforeEach, añade stubs de Supabase Storage:
    mockSupabase.storage = {
      from: vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({ data: { path: 'path' }, error: null }),
        getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://supabase.co/storage/v1/object/public/tickets/mock-path.jpg' } })),
      }))
    } as any

    // Stub global de $fetch:
    const mockDollarFetch = vi.fn().mockResolvedValue({
      comercio: 'Mercadona',
      total: 25.5,
      categoria: 'alimentacion',
      confianza: 0.95,
      idsSincronizados: ['l-100']
    })
    vi.stubGlobal('$fetch', mockDollarFetch)

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

    const { mensajeCola } = useColaTickets()

    const id = await encolarTicket(ticket)
    expect(id).toBeDefined()

    // Verificar guardado local
    const count = await contarTicketsPendientes()
    expect(count).toBe(1)

    // Verificar que no se llamó a la API remota
    expect(fetchSpy).not.toHaveBeenCalled()

    // El feedback de encolado pasa a ser el chip contador, no un mensaje
    expect(mensajeCola.value).toBeNull()
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
    mockSupabase.auth.refreshSession.mockResolvedValue({
      data: { session: null },
      error: null
    })
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
    expect(mensajeCola.value?.tipo).toBe('error')
    expect(mensajeCola.value?.texto).toContain('Tu sesión venció')
  })

  it('debería encolar una lectura de imagen offline y procesarla/sincronizarla exitosamente en segundo plano al estar online', async () => {
    const { encolarLectura, sincronizarCola, lecturasPendientes } = useColaTickets()

    // 1. Encolar offline
    vi.stubGlobal('navigator', { ...navigator, onLine: false })
    const { estadoRed } = useColaTickets()
    estadoRed.value = 'offline'

    const mockFile = new File(['image-bytes'], 'recibo.png', { type: 'image/png' })
    const id = 'l-100'

    await encolarLectura(mockFile, 'user-123', id)

    // Comprobar que está encolado
    const { contarLecturasPendientes } = await import('~/composables/useColaLecturasDb')
    expect(await contarLecturasPendientes()).toBe(1)
    expect(lecturasPendientes.value).toBe(1)

    // 2. Simular recuperación de conexión
    vi.stubGlobal('navigator', { ...navigator, onLine: true })
    estadoRed.value = 'online'

    // Ejecutar sincronización
    const result = await sincronizarCola()
    expect(result.sincronizados).toBe(1)

    // La lectura debió ser eliminada de la cola local tras éxito
    expect(await contarLecturasPendientes()).toBe(0)
    expect(lecturasPendientes.value).toBe(0)
  })
})
