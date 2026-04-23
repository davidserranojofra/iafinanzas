import type { ExtractedTicket, TicketCategoria } from '~/types'

const CATEGORIA_MAP: Record<string, TicketCategoria> = {
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
  'otro':         'Otro',
}

function mapCategoria(raw: unknown): TicketCategoria {
  if (!raw) return 'Otro'
  const key = String(raw).toLowerCase().trim()
  return CATEGORIA_MAP[key] ?? 'Otro'
}

export function useAIExtraction() {
  const phase = ref<'idle' | 'extracting' | 'done' | 'error'>('idle')
  const progress = ref(0)
  const result = ref<ExtractedTicket | null>(null)
  const errorMsg = ref<string | null>(null)
  let progressInterval: ReturnType<typeof setInterval> | null = null

  const extract = async (file: File) => {
    phase.value = 'extracting'
    progress.value = 0
    errorMsg.value = null

    progressInterval = setInterval(() => {
      if (progress.value < 85) progress.value += 7
    }, 300)

    try {
      const formData = new FormData()
      formData.append('image', file)

      const raw = await $fetch<Record<string, unknown>>('/api/process-ticket', {
        method: 'POST',
        body: formData,
      })

      // Mapear snake_case del endpoint a camelCase de la interfaz
      result.value = {
        comercio:   String(raw.comercio ?? ''),
        fecha:      String(raw.fecha ?? new Date().toISOString().slice(0, 10)),
        total:      Number(raw.total ?? 0),
        categoria:  mapCategoria(raw.categoria),
        metodoPago: String(raw.metodo_pago ?? raw.metodoPago ?? ''),
        notas:      raw.notas ? String(raw.notas) : undefined,
        items:      [],
        confianza:  0.9,
      }

      progress.value = 100
      phase.value = 'done'
    } catch (e: unknown) {
      phase.value = 'error'
      const msg = e instanceof Error ? e.message : ''
      if (msg.includes('429') || msg.includes('Límite')) {
        errorMsg.value = 'Límite de la API alcanzado. Esperá un minuto e intentá de nuevo.'
      } else if (msg.includes('400')) {
        errorMsg.value = 'La imagen no es válida o no se pudo leer. Probá con otra foto.'
      } else {
        errorMsg.value = 'No se pudo procesar la imagen. Intentá de nuevo.'
      }
    } finally {
      if (progressInterval) clearInterval(progressInterval)
    }
  }

  const reset = () => {
    phase.value = 'idle'
    progress.value = 0
    result.value = null
    errorMsg.value = null
    if (progressInterval) clearInterval(progressInterval)
  }

  return { phase, progress, result, errorMsg, extract, reset }
}
