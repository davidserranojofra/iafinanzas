<script setup lang="ts">
import type { Ticket } from '~/types'

definePageMeta({ middleware: 'auth' })

const route = useRoute()
const supabase = useSupabaseClient()
const router = useRouter()

const { data: ticket, pending, error } = await useAsyncData<Ticket>(
  `ticket-${route.params.id}`,
  async () => {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', route.params.id)
      .single()
    if (error) throw error
    const row = data as Record<string, unknown>
    return {
      id:            row.id,
      userId:        row.user_id,
      comercio:      row.comercio,
      fecha:         row.fecha,
      total:         Number(row.total),
      iva:           row.iva != null ? Number(row.iva) : undefined,
      categoria:     row.categoria,
      metodoPago:    row.metodo_pago,
      notas:         row.notas,
      imageUrl:      row.image_url,
      items:         row.items ?? [],
      extractedByAI: Boolean(row.extracted_by_ai),
      aiConfidence:  row.ai_confidence != null ? Number(row.ai_confidence) : undefined,
      createdAt:     row.created_at,
    } as Ticket
  },
)

const tab = ref<'detalles' | 'imagen'>('detalles')

const categoryColors: Record<string, string> = {
  Alimentación: '#50fa7b', Transporte: '#8be9fd', Ropa: '#ff79c6',
  Restaurantes: '#ffb86c', Suscripciones: '#bd93f9', Salud: '#ff5555',
  Hogar: '#f1fa8c', Ocio: '#bd93f9', Tecnología: '#8be9fd', Otro: '#6272a4',
}

const color = computed(() => ticket.value ? categoryColors[ticket.value.categoria] ?? '#6272a4' : '#6272a4')

const formattedDate = computed(() => {
  if (!ticket.value) return ''
  return new Date(ticket.value.fecha).toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
})

function downloadSVG() {
  if (!ticket.value) return
  const t = ticket.value
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400" font-family="monospace">
    <rect width="300" height="400" fill="#f8f8f2" rx="8"/>
    <text x="150" y="40" text-anchor="middle" font-size="18" font-weight="bold">${t.comercio}</text>
    <line x1="20" y1="55" x2="280" y2="55" stroke="#ccc" stroke-width="1"/>
    <text x="20" y="80" font-size="12" fill="#555">Fecha: ${t.fecha}</text>
    <text x="20" y="100" font-size="12" fill="#555">Categoría: ${t.categoria}</text>
    <text x="20" y="120" font-size="12" fill="#555">Método: ${t.metodoPago ?? '—'}</text>
    <line x1="20" y1="140" x2="280" y2="140" stroke="#ccc" stroke-dasharray="4"/>
    <text x="20" y="165" font-size="20" font-weight="bold">Total: ${t.total.toFixed(2)} €</text>
    ${t.notas ? `<text x="20" y="195" font-size="11" fill="#888">${t.notas}</text>` : ''}
    <text x="150" y="380" text-anchor="middle" font-size="9" fill="#aaa">Generado por Cartera</text>
  </svg>`
  const blob = new Blob([svg], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `ticket-${t.comercio}-${t.fecha}.svg`
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="flex flex-col min-h-screen bg-[#282a36] pb-24">
    <!-- Header -->
    <div class="flex items-center justify-between px-4 pt-12 pb-4">
      <button
        class="flex items-center justify-center w-10 h-10 rounded-2xl bg-[#383a4a] text-[#f8f8f2]"
        @click="router.back()"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </button>
      <h1 class="text-base font-semibold text-[#f8f8f2]">Detalle</h1>
      <div class="w-10" />
    </div>

    <!-- Loading -->
    <div v-if="pending" class="flex flex-col gap-4 px-4">
      <div class="h-32 rounded-3xl bg-[#383a4a] animate-pulse" />
      <div class="h-48 rounded-3xl bg-[#383a4a] animate-pulse" />
    </div>

    <!-- Error -->
    <div v-else-if="error" class="flex flex-col items-center py-16 px-4 gap-3">
      <p class="text-sm text-[#ff5555]">No se pudo cargar el ticket.</p>
      <button class="text-xs text-[#bd93f9]" @click="router.back()">Volver</button>
    </div>

    <template v-else-if="ticket">
      <!-- Hero con ilustración -->
      <div
        class="mx-4 rounded-3xl p-6 flex flex-col items-center gap-3 mb-4"
        :style="{ background: color + '15', border: `1.5px solid ${color}30` }"
      >
        <TicketsCategoryIllustration :categoria="ticket.categoria" :size="90" />
        <h2 class="text-xl font-bold text-[#f8f8f2]">{{ ticket.comercio }}</h2>
        <div class="flex items-center gap-2 flex-wrap justify-center">
          <span
            class="text-xs font-semibold px-2.5 py-1 rounded-full"
            :style="{ color, background: color + '20' }"
          >{{ ticket.categoria }}</span>
          <span v-if="ticket.extractedByAI" class="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-[#50fa7b]/15 text-[#50fa7b]">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            Verificado por IA
          </span>
        </div>
        <p class="text-3xl font-bold text-[#f8f8f2]">{{ ticket.total.toFixed(2) }} <span class="text-xl text-[#6272a4]">€</span></p>
      </div>

      <!-- Tabs -->
      <div class="flex mx-4 mb-4 bg-[#383a4a] rounded-2xl p-1">
        <button
          class="flex-1 py-2 rounded-xl text-sm font-semibold transition-colors"
          :class="tab === 'detalles' ? 'bg-[#44475a] text-[#f8f8f2]' : 'text-[#6272a4]'"
          @click="tab = 'detalles'"
        >
          Detalles
        </button>
        <button
          class="flex-1 py-2 rounded-xl text-sm font-semibold transition-colors"
          :class="tab === 'imagen' ? 'bg-[#44475a] text-[#f8f8f2]' : 'text-[#6272a4]'"
          @click="tab = 'imagen'"
        >
          Ticket
        </button>
      </div>

      <!-- Tab: Detalles -->
      <div v-if="tab === 'detalles'" class="flex flex-col gap-3 px-4">
        <div class="bg-[#383a4a] rounded-2xl p-4 border border-[#6272a4]/10">
          <div v-for="({ label, value }) in [
            { label: 'Fecha', value: formattedDate },
            { label: 'Método de pago', value: ticket.metodoPago ?? '—' },
            { label: 'IVA', value: ticket.iva != null ? `${ticket.iva.toFixed(2)} €` : '—' },
            { label: 'Notas', value: ticket.notas ?? '—' },
          ]" :key="label" class="flex justify-between py-3 border-b border-[#6272a4]/10 last:border-0">
            <span class="text-xs font-semibold uppercase tracking-wider text-[#6272a4]">{{ label }}</span>
            <span class="text-sm text-[#f8f8f2] text-right max-w-[60%]">{{ value }}</span>
          </div>
        </div>

        <!-- Líneas de productos -->
        <div v-if="ticket.items && ticket.items.length > 0" class="bg-[#383a4a] rounded-2xl p-4 border border-[#6272a4]/10">
          <p class="text-xs font-semibold uppercase tracking-wider text-[#6272a4] mb-3">Productos</p>
          <div
            v-for="(item, i) in ticket.items"
            :key="i"
            class="flex justify-between items-center py-2 border-b border-[#6272a4]/10 last:border-0"
          >
            <div>
              <p class="text-sm text-[#f8f8f2]">{{ item.nombre }}</p>
              <p v-if="item.cantidad && item.cantidad > 1" class="text-xs text-[#6272a4]">x{{ item.cantidad }}</p>
            </div>
            <span class="text-sm font-semibold text-[#f8f8f2]">{{ item.precio.toFixed(2) }} €</span>
          </div>
        </div>
      </div>

      <!-- Tab: Imagen/Ticket -->
      <div v-else class="flex flex-col items-center gap-4 px-4">
        <!-- Preview del ticket como SVG -->
        <div class="w-full bg-[#f8f8f2] rounded-2xl p-5 text-[#282a36] font-mono text-sm">
          <p class="text-lg font-bold text-center mb-1">{{ ticket.comercio }}</p>
          <p class="text-xs text-center text-[#6272a4] mb-4">{{ formattedDate }}</p>
          <hr class="border-dashed border-[#6272a4]/40 mb-4">
          <div v-if="ticket.items && ticket.items.length > 0" class="flex flex-col gap-1 mb-4">
            <div v-for="(item, i) in ticket.items" :key="i" class="flex justify-between text-xs">
              <span>{{ item.nombre }}</span>
              <span>{{ item.precio.toFixed(2) }} €</span>
            </div>
          </div>
          <hr class="border-dashed border-[#6272a4]/40 mb-3">
          <div class="flex justify-between font-bold">
            <span>TOTAL</span>
            <span>{{ ticket.total.toFixed(2) }} €</span>
          </div>
          <p v-if="ticket.metodoPago" class="text-xs text-center text-[#6272a4] mt-3">{{ ticket.metodoPago }}</p>
          <!-- Código de barras simulado -->
          <div class="flex justify-center gap-px mt-4">
            <div v-for="i in 40" :key="i" class="bg-[#282a36]" :style="{ width: '2px', height: i % 3 === 0 ? '28px' : '20px' }" />
          </div>
        </div>

        <!-- Botón descargar -->
        <button
          class="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-semibold text-[#282a36] transition-opacity active:opacity-80"
          style="background: linear-gradient(135deg, #bd93f9, #ff79c6)"
          @click="downloadSVG"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Descargar como SVG
        </button>
      </div>
    </template>
  </div>
</template>
