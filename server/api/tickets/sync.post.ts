import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import type { CreateTicketDto } from '~/types'

interface TicketSincronizable extends CreateTicketDto {
  id: string
}

function aFilaTicket(ticket: TicketSincronizable, userId: string) {
  return {
    id: ticket.id,
    user_id: userId,
    comercio: ticket.comercio,
    fecha: ticket.fecha,
    total: ticket.total,
    iva: ticket.iva,
    categoria: ticket.categoria,
    metodo_pago: ticket.metodoPago ?? null,
    notas: ticket.notas ?? null,
    image_url: ticket.imageUrl ?? null,
    items: ticket.items ?? [],
    extracted_by_ai: ticket.extractedByAI,
    ai_confidence: ticket.aiConfidence ?? null,
  }
}

function esTicketValido(ticket: Partial<TicketSincronizable>): ticket is TicketSincronizable {
  return Boolean(
    ticket.id
    && ticket.comercio?.trim()
    && ticket.fecha
    && typeof ticket.total === 'number'
    && ticket.categoria,
  )
}

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)

  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Sesión inválida o expirada.' })
  }

  const body = await readBody<{ tickets?: Partial<TicketSincronizable>[] }>(event)
  const tickets = Array.isArray(body?.tickets) ? body.tickets : []

  if (!tickets.length) {
    return { idsSincronizados: [] }
  }

  if (!tickets.every(esTicketValido)) {
    throw createError({ statusCode: 400, statusMessage: 'La cola contiene tickets inválidos.' })
  }

  const supabase = await serverSupabaseClient(event)
  const { data, error } = await supabase
    .from('tickets')
    .upsert(tickets.map(t => aFilaTicket(t, user.id)) as never, { onConflict: 'id' })
    .select('id')

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return {
    idsSincronizados: ((data ?? []) as Array<{ id: string }>).map(ticket => ticket.id),
  }
})
