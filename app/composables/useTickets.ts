import type { Ticket, CreateTicketDto } from '~/types'

// camelCase → snake_case para INSERT (user_id lo pone la DB via auth.uid())
function toRow(dto: CreateTicketDto) {
  return {
    comercio:       dto.comercio,
    fecha:          dto.fecha,
    total:          dto.total,
    iva:            dto.iva,
    categoria:      dto.categoria,
    metodo_pago:    dto.metodoPago,
    notas:          dto.notas,
    image_url:      dto.imageUrl,
    items:          dto.items,
    extracted_by_ai: dto.extractedByAI,
    ai_confidence:  dto.aiConfidence,
  }
}

// snake_case → camelCase para la interfaz Ticket
function fromRow(row: Record<string, unknown>): Ticket {
  return {
    id:            row.id as string,
    userId:        row.user_id as string,
    comercio:      row.comercio as string,
    fecha:         row.fecha as string,
    total:         Number(row.total),
    iva:           row.iva != null ? Number(row.iva) : undefined,
    categoria:     row.categoria as Ticket['categoria'],
    metodoPago:    row.metodo_pago as string | undefined,
    notas:         row.notas as string | undefined,
    imageUrl:      row.image_url as string | undefined,
    items:         (row.items as Ticket['items']) ?? [],
    extractedByAI: Boolean(row.extracted_by_ai),
    aiConfidence:  row.ai_confidence != null ? Number(row.ai_confidence) : undefined,
    createdAt:     row.created_at as string,
  }
}

export function useTickets() {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  const { data: tickets, pending, refresh } = useAsyncData<Ticket[]>(
    'tickets',
    async () => {
      if (!user.value) return []
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('user_id', user.value.id)
        .order('fecha', { ascending: false })
      if (error) throw error
      return (data as Record<string, unknown>[]).map(fromRow)
    },
    { default: () => [] },
  )

  const createTicket = async (dto: CreateTicketDto): Promise<Ticket> => {
    const { data, error } = await supabase
      .from('tickets')
      .insert(toRow(dto))
      .select()
      .single()
    if (error) throw error
    await refresh()
    return fromRow(data as Record<string, unknown>)
  }

  const deleteTicket = async (id: string) => {
    const { error } = await supabase.from('tickets').delete().eq('id', id)
    if (error) throw error
    await refresh()
  }

  return { tickets, pending, createTicket, deleteTicket, refresh }
}
