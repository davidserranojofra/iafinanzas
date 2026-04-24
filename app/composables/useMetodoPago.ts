const METODO_LABELS: Record<string, string> = {
  efectivo:        'Efectivo',
  tarjeta_debito:  'Tarjeta de débito',
  tarjeta_credito: 'Tarjeta de crédito',
  transferencia:   'Transferencia',
  desconocido:     'Desconocido',
}

export function formatMetodoPago(raw?: string) {
  if (!raw) return '—'
  return METODO_LABELS[raw.toLowerCase()] ?? raw
}
