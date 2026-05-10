import type { Ticket, CreateTicketDto } from '~/types'
import { esErrorDeRed, useColaTickets } from './useColaTickets'
import {
  eliminarSnapshotTickets,
  guardarSnapshotTickets,
  obtenerSnapshotTickets,
} from './useTicketsSnapshotDb'

type EstadoSesionTickets = 'ready' | 'retry-later' | 'signed-out'

// camelCase → snake_case para INSERT (user_id lo pone la DB via auth.uid())
function toRow(dto: CreateTicketDto) {
  return {
    id: dto.id,
    comercio: dto.comercio,
    fecha: dto.fecha,
    total: dto.total,
    iva: dto.iva,
    categoria: dto.categoria,
    metodo_pago: dto.metodoPago,
    notas: dto.notas,
    image_url: dto.imageUrl,
    items: dto.items,
    extracted_by_ai: dto.extractedByAI,
    ai_confidence: dto.aiConfidence,
  }
}

// snake_case → camelCase para la interfaz Ticket
function fromRow(row: Record<string, unknown>): Ticket {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    comercio: row.comercio as string,
    fecha: row.fecha as string,
    total: Number(row.total),
    iva: row.iva != null ? Number(row.iva) : undefined,
    categoria: row.categoria as Ticket['categoria'],
    metodoPago: row.metodo_pago as string | undefined,
    notas: row.notas as string | undefined,
    imageUrl: row.image_url as string | undefined,
    items: (row.items as Ticket['items']) ?? [],
    extractedByAI: Boolean(row.extracted_by_ai),
    aiConfidence: row.ai_confidence != null ? Number(row.ai_confidence) : undefined,
    createdAt: row.created_at as string,
  }
}

function ordenarTickets(tickets: Ticket[]) {
  return [...tickets].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
}

async function obtenerTicketsRemotos(supabase: ReturnType<typeof useSupabaseClient>) {
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .order('fecha', { ascending: false })

  if (error) throw error

  return (data as Record<string, unknown>[]).map(fromRow)
}

export function useTickets() {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()
  const { estadoRed } = useColaTickets()

  const tickets = useState<Ticket[]>('tickets-state', () => [])
  const pending = useState<boolean>('tickets-pending', () => false)
  const isRefreshing = useState<boolean>('tickets-refreshing', () => false)
  const hasSnapshot = useState<boolean>('tickets-has-snapshot', () => false)
  const isOfflineData = useState<boolean>('tickets-is-offline-data', () => false)
  const snapshotUpdatedAt = useState<string | null>('tickets-snapshot-updated-at', () => null)
  const error = useState<unknown>('tickets-error', () => null)
  const hydrationDone = useState<boolean>('tickets-hydration-done', () => false)
  const authReady = useState<boolean>('tickets-auth-ready', () => !import.meta.client)
  const loadId = useState<number>('tickets-load-id', () => 0)
  const authListenerReady = useState<boolean>('tickets-auth-listener-ready', () => false)

  const hasData = computed(() => tickets.value.length > 0)
  const shouldShowSkeleton = computed(() => (pending.value || !authReady.value) && !hasData.value && !hasSnapshot.value)
  const shouldShowEmpty = computed(() => authReady.value && !pending.value && tickets.value.length === 0)
  const shouldShowError = computed(() => authReady.value && Boolean(error.value) && !pending.value && !hasData.value && !hasSnapshot.value)

  function esCargaActual(id: number) {
    return loadId.value === id
  }

  function reiniciarEstadoSesionCerrada() {
    tickets.value = []
    pending.value = false
    isRefreshing.value = false
    error.value = null
    hydrationDone.value = true
    authReady.value = true
    limpiarEstadoSnapshot()
  }

  function limpiarEstadoSnapshot() {
    hasSnapshot.value = false
    snapshotUpdatedAt.value = null
    isOfflineData.value = false
  }

  async function hidratarSnapshot(userId: string, idCarga: number) {
    if (!import.meta.client) return false

    const snapshot = await obtenerSnapshotTickets(userId)

    if (!esCargaActual(idCarga)) {
      return false
    }

    if (!snapshot || snapshot.tickets.length === 0) {
      limpiarEstadoSnapshot()
      return false
    }

    tickets.value = ordenarTickets(snapshot.tickets)
    hasSnapshot.value = true
    isOfflineData.value = true
    snapshotUpdatedAt.value = snapshot.updatedAt
    return true
  }

  async function persistirSnapshot(userId: string, nextTickets: Ticket[]) {
    if (!import.meta.client) return

    if (nextTickets.length === 0) {
      await eliminarSnapshotTickets(userId)
      limpiarEstadoSnapshot()
      return
    }

    await guardarSnapshotTickets(userId, ordenarTickets(nextTickets))
    hasSnapshot.value = true
    snapshotUpdatedAt.value = new Date().toISOString()
  }

  async function intentarHidratarSnapshot(userId: string, idCarga: number) {
    try {
      return await hidratarSnapshot(userId, idCarga)
    } catch (snapshotError) {
      console.warn('[useTickets] No pudimos hidratar el snapshot local.', snapshotError)
      limpiarEstadoSnapshot()
      return false
    }
  }

  async function intentarPersistirSnapshot(userId: string, nextTickets: Ticket[]) {
    try {
      await persistirSnapshot(userId, nextTickets)
    } catch (snapshotError) {
      console.warn('[useTickets] No pudimos persistir el snapshot local.', snapshotError)
    }
  }

  async function esperarSesionCliente(timeoutMs = 1500) {
    if (!import.meta.client) return null

    return await new Promise<string | null>((resolve) => {
      let settled = false

      const finish = (nextUserId: string | null) => {
        if (settled) return
        settled = true
        window.clearTimeout(timeoutId)
        subscription.unsubscribe()
        resolve(nextUserId)
      }

      const timeoutId = window.setTimeout(() => finish(null), timeoutMs)
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, nextSession) => {
        if (nextSession?.user?.id) {
          finish(nextSession.user.id)
        }
      })
    })
  }

  async function resolverSesionLista(userId: string): Promise<EstadoSesionTickets> {
    if (!import.meta.client) {
      authReady.value = true
      return 'ready'
    }

    const { data: sesionActual, error: sesionError } = await supabase.auth.getSession()
    if (sesionError) throw sesionError

    if (sesionActual.session?.user?.id === userId) {
      authReady.value = true
      return 'ready'
    }

    const { data: usuarioActual, error: usuarioError } = await supabase.auth.getUser()
    if (usuarioError) throw usuarioError

    if (usuarioActual.user?.id === userId) {
      const sesionEsperadaId = await esperarSesionCliente()

      if (sesionEsperadaId === userId) {
        authReady.value = true
        return 'ready'
      }

      const { data: sesionReintentada, error: sesionReintentadaError } = await supabase.auth.getSession()
      if (sesionReintentadaError) throw sesionReintentadaError

      if (sesionReintentada.session?.user?.id === userId) {
        authReady.value = true
        return 'ready'
      }

      authReady.value = false
      return 'retry-later'
    }

    authReady.value = true
    return 'signed-out'
  }

  async function cargarTickets(options: { background?: boolean, force?: boolean, userId?: string } = {}) {
    const usuarioId = options.userId ?? user.value?.id ?? null
    const idCarga = ++loadId.value
    let mantenerPending = false

    if (!usuarioId) {
      reiniciarEstadoSesionCerrada()
      return tickets.value
    }

    const mostrarCargaInicial = !hydrationDone.value || options.force

    if (mostrarCargaInicial) {
      pending.value = true
    }

    if (options.background) {
      isRefreshing.value = true
    }

    error.value = null
    authReady.value = !import.meta.client

    const snapshotCargado = await intentarHidratarSnapshot(usuarioId, idCarga)

    if (!esCargaActual(idCarga)) {
      return tickets.value
    }

    hydrationDone.value = true

    const estadoSesion = await resolverSesionLista(usuarioId)

    if (!esCargaActual(idCarga)) {
      return tickets.value
    }

    if (estadoSesion === 'signed-out') {
      reiniciarEstadoSesionCerrada()
      return tickets.value
    }

    if (estadoSesion === 'retry-later') {
      mantenerPending = !snapshotCargado && tickets.value.length === 0
      error.value = null
      return tickets.value
    }

    try {
      const remotos = await obtenerTicketsRemotos(supabase)

      if (!esCargaActual(idCarga)) {
        return tickets.value
      }

      tickets.value = ordenarTickets(remotos)
      isOfflineData.value = false
      authReady.value = true
      await intentarPersistirSnapshot(usuarioId, remotos)
      return tickets.value
    } catch (fetchError) {
      if (!esCargaActual(idCarga)) {
        return tickets.value
      }

      error.value = fetchError
      authReady.value = true

      if (!snapshotCargado || !esErrorDeRed(fetchError)) {
        throw fetchError
      }

      return tickets.value
    } finally {
      if (esCargaActual(idCarga)) {
        pending.value = mantenerPending
        isRefreshing.value = false
      }
    }
  }

  async function refresh() {
    return cargarTickets({ background: true, force: !hasData.value && !hasSnapshot.value })
  }

  watch(
    () => user.value?.id ?? null,
    async (userId) => {
      hydrationDone.value = false
      error.value = null

      if (!userId) {
        if (import.meta.client) {
          try {
            const { data: sesionActual, error: sesionError } = await supabase.auth.getSession()

            if (sesionError) throw sesionError

            if (sesionActual.session?.user?.id) {
              await cargarTickets({ background: true, userId: sesionActual.session.user.id })
              return
            }
          } catch {
            pending.value = false
          }
        }

        reiniciarEstadoSesionCerrada()
        return
      }

      try {
        await cargarTickets({ background: true, userId })
      } catch {
        pending.value = false
      }
    },
    { immediate: true },
  )

  if (import.meta.client && !authListenerReady.value) {
    authListenerReady.value = true

    supabase.auth.onAuthStateChange((_evento, sesionActual) => {
      if (sesionActual?.user?.id) {
        void cargarTickets({ background: true, userId: sesionActual.user.id })
        return
      }

      reiniciarEstadoSesionCerrada()
    })
  }

  watch(
    () => estadoRed.value,
    async (estadoActual, estadoAnterior) => {
      if (estadoActual === 'online' && estadoAnterior === 'offline' && user.value) {
        try {
          await refresh()
        } catch {
          // mantenemos snapshot stale hasta lograr revalidar
        }
      }
    },
  )

  const createTicket = async (dto: CreateTicketDto): Promise<Ticket> => {
    const fila = toRow(dto)

    const query = dto.id
      ? supabase
          .from('tickets')
          .upsert(fila as never, { onConflict: 'id' })
          .select()
          .single()
      : supabase
          .from('tickets')
          .insert(fila as never)
          .select()
          .single()

    const { data, error: queryError } = await query
    if (queryError) throw queryError

    const ticket = fromRow(data as Record<string, unknown>)
    const nextTickets = ordenarTickets([ticket, ...tickets.value.filter(item => item.id !== ticket.id)])

    tickets.value = nextTickets
    isOfflineData.value = false

    if (user.value?.id && import.meta.client) {
      await intentarPersistirSnapshot(user.value.id, nextTickets)
    }

    return ticket
  }

  const updateTicket = async (id: string, dto: Partial<CreateTicketDto>): Promise<Ticket> => {
    const partial: Record<string, unknown> = {}
    if (dto.comercio !== undefined) partial.comercio = dto.comercio
    if (dto.fecha !== undefined) partial.fecha = dto.fecha
    if (dto.total !== undefined) partial.total = dto.total
    if (dto.categoria !== undefined) partial.categoria = dto.categoria
    if (dto.metodoPago !== undefined) partial.metodo_pago = dto.metodoPago || null
    if (dto.notas !== undefined) partial.notas = dto.notas || null

    const { data, error: queryError } = await supabase
      .from('tickets')
      .update(partial as never)
      .eq('id', id)
      .select()
      .single()

    if (queryError) throw queryError

    const ticket = fromRow(data as Record<string, unknown>)
    const nextTickets = ordenarTickets(tickets.value.map(item => item.id === id ? ticket : item))

    tickets.value = nextTickets
    isOfflineData.value = false

    if (user.value?.id && import.meta.client) {
      await intentarPersistirSnapshot(user.value.id, nextTickets)
    }

    clearNuxtData(`ticket-${id}`)
    return ticket
  }

  const deleteTicket = async (id: string) => {
    const { error: queryError } = await supabase.from('tickets').delete().eq('id', id)
    if (queryError) throw queryError

    const nextTickets = tickets.value.filter(ticket => ticket.id !== id)
    tickets.value = nextTickets
    isOfflineData.value = false

    if (user.value?.id && import.meta.client) {
      await intentarPersistirSnapshot(user.value.id, nextTickets)
    }

    clearNuxtData(`ticket-${id}`)
  }

  return {
    tickets,
    pending,
    error,
    hasSnapshot,
    hasData,
    isRefreshing,
    isOfflineData,
    snapshotUpdatedAt,
    shouldShowEmpty,
    shouldShowError,
    shouldShowSkeleton,
    createTicket,
    updateTicket,
    deleteTicket,
    refresh,
  }
}
