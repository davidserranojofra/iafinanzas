export type TicketCategoria =
  | 'Alimentación'
  | 'Transporte'
  | 'Ropa'
  | 'Restaurantes'
  | 'Suscripciones'
  | 'Salud'
  | 'Hogar'
  | 'Ocio'
  | 'Tecnología'
  | 'Otro'

export interface TicketItem {
  nombre: string
  precio: number
  cantidad?: number
}

export interface Ticket {
  id: string
  userId: string
  comercio: string
  fecha: string // ISO 8601
  total: number
  iva?: number
  categoria: TicketCategoria
  metodoPago?: string
  notas?: string
  imageUrl?: string // URL Supabase Storage
  items?: TicketItem[]
  extractedByAI: boolean
  aiConfidence?: number // 0–1
  createdAt: string
}

export type CreateTicketDto = Omit<Ticket, 'id' | 'userId' | 'createdAt'>

export interface ExtractedTicket {
  comercio: string
  fecha: string
  total: number
  iva?: number
  items: TicketItem[]
  metodoPago?: string
  categoria: TicketCategoria
  confianza: number
}

export interface UserProfile {
  id: string
  nombre: string
  email: string
  telefono?: string
  ciudad?: string
  divisa: 'EUR' | 'USD' | 'GBP' | 'JPY' | 'MXN'
  avatarUrl?: string
  createdAt: string
}

export type StatsPeriod = 'dia' | 'semana' | 'mes' | 'año'

export interface CategoryStat {
  categoria: TicketCategoria
  amount: number
  pct: number
  color: string
}

export interface ChartDataPoint {
  label: string
  value: number
  color: string
}
