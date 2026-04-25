<script setup lang="ts">
import type { Ticket, TicketCategoria } from '~/types'

definePageMeta({ middleware: 'auth' })

const route = useRoute()
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const router = useRouter()
const { updateTicket, deleteTicket } = useTickets()

const { data: ticket, pending, error, refresh } = await useAsyncData<Ticket>(
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

// ── ELIMINAR ────────────────────────────────────────────────────────────────
const showDelete = ref(false)
const deleting = ref(false)
const deleteError = ref('')

async function confirmDelete() {
  if (!ticket.value) return
  deleting.value = true
  deleteError.value = ''
  try {
    await deleteTicket(ticket.value.id)
    await navigateTo('/tickets', { replace: true })
  } catch (e: unknown) {
    deleteError.value = e instanceof Error ? e.message : 'Error al eliminar.'
    deleting.value = false
  }
}

// ── EDITAR ───────────────────────────────────────────────────────────────────
const showEdit = ref(false)
const saving = ref(false)
const saveError = ref('')

const categorias: TicketCategoria[] = [
  'Alimentación', 'Transporte', 'Ropa', 'Restaurantes',
  'Suscripciones', 'Salud', 'Hogar', 'Ocio', 'Tecnología', 'Otro',
]

const TODOS_METODOS = ['Efectivo', 'Tarjeta débito', 'Tarjeta crédito', 'Transferencia', 'Otro']
const metodos = ref<string[]>([])

const { pending: loadingMetodos } = useAsyncData('metodos-pago-detail', async () => {
  if (!user.value) return null
  const { data } = await supabase.from('profiles').select('metodos_pago').single()
  const activos = data?.metodos_pago
  metodos.value = activos?.length ? activos : TODOS_METODOS
  return data
})

const editForm = ref({
  comercio:   '',
  fecha:      '',
  total:      '',
  categoria:  '' as TicketCategoria,
  metodoPago: '',
  notas:      '',
})

function openEdit() {
  if (!ticket.value) return
  editForm.value = {
    comercio:   ticket.value.comercio,
    fecha:      ticket.value.fecha,
    total:      String(ticket.value.total),
    categoria:  ticket.value.categoria,
    metodoPago: ticket.value.metodoPago ?? '',
    notas:      ticket.value.notas ?? '',
  }
  saveError.value = ''
  showEdit.value = true
}

async function submitEdit() {
  if (!ticket.value) return
  saving.value = true
  saveError.value = ''
  try {
    await updateTicket(ticket.value.id, {
      comercio:   editForm.value.comercio.trim(),
      fecha:      editForm.value.fecha,
      total:      Number(editForm.value.total),
      categoria:  editForm.value.categoria,
      metodoPago: editForm.value.metodoPago || undefined,
      notas:      editForm.value.notas.trim() || undefined,
    })
    await refresh()
    showEdit.value = false
  } catch (e: unknown) {
    saveError.value = e instanceof Error ? e.message : 'Error al guardar.'
  } finally {
    saving.value = false
  }
}

const categoryColors: Record<string, string> = {
  Alimentación: '#50fa7b', Transporte: '#8be9fd', Ropa: '#ff79c6',
  Restaurantes: '#ffb86c', Suscripciones: '#bd93f9', Salud: '#ff5555',
  Hogar: '#f1fa8c', Ocio: '#bd93f9', Tecnología: '#8be9fd', Otro: '#6272a4',
}

const color = computed(() => ticket.value ? categoryColors[ticket.value.categoria] ?? '#6272a4' : '#6272a4')

const formattedDate = computed(() => {
  if (!ticket.value) return ''
  return new Date(ticket.value.fecha + 'T12:00:00').toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
})

function downloadPNG() {
  if (!ticket.value) return
  const t = ticket.value

  const W = 600
  const PAD = 40
  const LINE_H = 28
  const items = t.items ?? []

  let rows = 6
  if (items.length > 0) rows += items.length + 2
  if (t.notas) rows += 1
  const H = PAD * 2 + 60 + rows * LINE_H + 60

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, W, H)

  ctx.setLineDash([6, 4])
  ctx.strokeStyle = '#cccccc'
  ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(PAD, PAD); ctx.lineTo(W - PAD, PAD); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(PAD, H - PAD); ctx.lineTo(W - PAD, H - PAD); ctx.stroke()
  ctx.setLineDash([])

  let y = PAD + 44

  ctx.font = 'bold 28px monospace'
  ctx.fillStyle = '#1a1a2e'
  ctx.textAlign = 'center'
  ctx.fillText(t.comercio.toUpperCase(), W / 2, y)
  y += 10

  ctx.strokeStyle = '#eeeeee'; ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(PAD, y); ctx.lineTo(W - PAD, y); ctx.stroke()
  y += LINE_H

  ctx.font = '18px monospace'
  ctx.textAlign = 'left'
  const meta = [
    ['Fecha',     new Date(t.fecha + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })],
    ['Categoría', t.categoria],
    ['Método',    formatMetodoPago(t.metodoPago)],
  ]
  for (const [label, val] of meta) {
    ctx.fillStyle = '#888888'; ctx.fillText(label, PAD, y)
    ctx.fillStyle = '#333333'; ctx.textAlign = 'right'; ctx.fillText(val, W - PAD, y)
    ctx.textAlign = 'left'; y += LINE_H
  }

  ctx.setLineDash([4, 4]); ctx.strokeStyle = '#cccccc'
  ctx.beginPath(); ctx.moveTo(PAD, y); ctx.lineTo(W - PAD, y); ctx.stroke()
  ctx.setLineDash([]); y += LINE_H

  if (items.length > 0) {
    ctx.font = 'bold 14px monospace'; ctx.fillStyle = '#aaaaaa'; ctx.textAlign = 'left'
    ctx.fillText('PRODUCTOS', PAD, y); y += LINE_H
    ctx.font = '17px monospace'
    for (const item of items) {
      const label = item.cantidad && item.cantidad > 1 ? `${item.cantidad}x ${item.nombre}` : item.nombre
      ctx.fillStyle = '#444444'; ctx.textAlign = 'left'; ctx.fillText(label, PAD, y)
      ctx.fillStyle = '#333333'; ctx.textAlign = 'right'; ctx.fillText(`${item.precio.toFixed(2)} €`, W - PAD, y)
      ctx.textAlign = 'left'; y += LINE_H
    }
    ctx.setLineDash([4, 4]); ctx.strokeStyle = '#cccccc'
    ctx.beginPath(); ctx.moveTo(PAD, y); ctx.lineTo(W - PAD, y); ctx.stroke()
    ctx.setLineDash([]); y += LINE_H
  }

  ctx.font = 'bold 26px monospace'
  ctx.fillStyle = '#555555'; ctx.textAlign = 'left'; ctx.fillText('TOTAL', PAD, y)
  ctx.fillStyle = '#1a1a2e'; ctx.textAlign = 'right'; ctx.fillText(`${t.total.toFixed(2)} €`, W - PAD, y)
  y += LINE_H + 6

  if (t.notas) {
    ctx.font = 'italic 15px monospace'; ctx.fillStyle = '#aaaaaa'
    ctx.textAlign = 'center'; ctx.fillText(t.notas, W / 2, y); y += LINE_H
  }

  y += 10
  const barW = 3; const barCount = 60
  const totalBarsW = barCount * barW * 2
  let bx = (W - totalBarsW) / 2
  for (let i = 0; i < barCount; i++) {
    ctx.fillStyle = '#333333'
    const bh = i % 5 === 0 ? 40 : i % 3 === 0 ? 32 : 24
    ctx.fillRect(bx, y, barW, bh); bx += barW * 2
  }
  y += 50

  ctx.font = '13px monospace'; ctx.fillStyle = '#bbbbbb'
  ctx.textAlign = 'center'; ctx.fillText('IAFinanzas — generado automáticamente', W / 2, y)

  canvas.toBlob((blob) => {
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `ticket-${t.comercio}-${t.fecha}.png`; a.click()
    URL.revokeObjectURL(url)
  }, 'image/png')
}
</script>

<template>
  <div class="flex flex-col min-h-screen bg-dracula-bg pb-24">
    <!-- Header -->
    <div class="flex items-center justify-between px-4 pt-12 pb-4">
      <button
        class="flex items-center justify-center w-10 h-10 rounded-2xl bg-dracula-card2 text-dracula-text"
        @click="router.back()"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </button>
      <h1 class="text-base font-semibold text-dracula-text">Detalle</h1>
      <div class="flex items-center gap-2">
        <button
          class="flex items-center justify-center w-10 h-10 rounded-2xl bg-dracula-card2 text-dracula-purple transition-colors active:bg-dracula-card"
          @click="openEdit"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <button
          class="flex items-center justify-center w-10 h-10 rounded-2xl bg-dracula-card2 text-dracula-red transition-colors active:bg-dracula-card"
          @click="showDelete = true"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
            <path d="M10 11v6M14 11v6"/>
            <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="pending" class="flex flex-col gap-4 px-4">
      <div class="h-32 rounded-3xl bg-dracula-card2 animate-pulse" />
      <div class="h-48 rounded-3xl bg-dracula-card2 animate-pulse" />
    </div>

    <!-- Error -->
    <div v-else-if="error" class="flex flex-col items-center py-16 px-4 gap-3">
      <p class="text-sm text-dracula-red">No se pudo cargar el ticket.</p>
      <button class="text-xs text-dracula-purple" @click="router.back()">Volver</button>
    </div>

    <template v-else-if="ticket">
      <!-- Hero -->
      <div
        class="mx-4 rounded-3xl p-6 flex flex-col items-center gap-3 mb-4"
        :style="{ background: color + '15', border: `1.5px solid ${color}30` }"
      >
        <TicketsCategoryIllustration :categoria="ticket.categoria" :size="90" />
        <h2 class="text-xl font-bold text-dracula-text">{{ ticket.comercio }}</h2>
        <div class="flex items-center gap-2 flex-wrap justify-center">
          <span
            class="text-xs font-semibold px-2.5 py-1 rounded-full"
            :style="{ color, background: color + '20' }"
          >{{ ticket.categoria }}</span>
          <span v-if="ticket.extractedByAI" class="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-dracula-green/15 text-dracula-green">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            Verificado por IA
          </span>
        </div>
        <p class="text-3xl font-bold text-dracula-text">{{ ticket.total.toFixed(2) }} <span class="text-xl text-dracula-muted">€</span></p>
      </div>

      <!-- Tabs -->
      <div class="flex mx-4 mb-4 bg-dracula-card2 rounded-2xl p-1">
        <button
          class="flex-1 py-2 rounded-xl text-sm font-semibold transition-colors"
          :class="tab === 'detalles' ? 'bg-dracula-card text-dracula-text' : 'text-dracula-muted'"
          @click="tab = 'detalles'"
        >
          Detalles
        </button>
        <button
          class="flex-1 py-2 rounded-xl text-sm font-semibold transition-colors"
          :class="tab === 'imagen' ? 'bg-dracula-card text-dracula-text' : 'text-dracula-muted'"
          @click="tab = 'imagen'"
        >
          Ticket
        </button>
      </div>

      <!-- Tab: Detalles -->
      <div v-if="tab === 'detalles'" class="flex flex-col gap-3 px-4">
        <div class="bg-dracula-card2 rounded-2xl p-4 border border-dracula-muted/10">
          <div v-for="({ label, value }) in [
            { label: 'Fecha', value: formattedDate },
            { label: 'Método de pago', value: formatMetodoPago(ticket.metodoPago) },
            { label: 'IVA', value: ticket.iva != null ? `${ticket.iva.toFixed(2)} €` : '—' },
            { label: 'Notas', value: ticket.notas ?? '—' },
          ]" :key="label" class="flex justify-between py-3 border-b border-dracula-muted/10 last:border-0">
            <span class="text-xs font-semibold uppercase tracking-wider text-dracula-muted">{{ label }}</span>
            <span class="text-sm text-dracula-text text-right max-w-[60%]">{{ value }}</span>
          </div>
        </div>

        <div v-if="ticket.items && ticket.items.length > 0" class="bg-dracula-card2 rounded-2xl p-4 border border-dracula-muted/10">
          <p class="text-xs font-semibold uppercase tracking-wider text-dracula-muted mb-3">Productos</p>
          <div
            v-for="(item, i) in ticket.items"
            :key="i"
            class="flex justify-between items-center py-2 border-b border-dracula-muted/10 last:border-0"
          >
            <div>
              <p class="text-sm text-dracula-text">{{ item.nombre }}</p>
              <p v-if="item.cantidad && item.cantidad > 1" class="text-xs text-dracula-muted">x{{ item.cantidad }}</p>
            </div>
            <span class="text-sm font-semibold text-dracula-text">{{ item.precio.toFixed(2) }} €</span>
          </div>
        </div>
      </div>

      <!-- Tab: Imagen/Ticket -->
      <div v-else class="flex flex-col items-center gap-4 px-4">
        <!-- El ticket preview siempre es blanco — es un recibo de papel -->
        <div class="w-full bg-white rounded-2xl p-5 text-gray-800 font-mono text-sm">
          <p class="text-lg font-bold text-center mb-1">{{ ticket.comercio }}</p>
          <p class="text-xs text-center text-gray-400 mb-4">{{ formattedDate }}</p>
          <hr class="border-dashed border-gray-300 mb-4">
          <div v-if="ticket.items && ticket.items.length > 0" class="flex flex-col gap-1 mb-4">
            <div v-for="(item, i) in ticket.items" :key="i" class="flex justify-between text-xs">
              <span>{{ item.nombre }}</span>
              <span>{{ item.precio.toFixed(2) }} €</span>
            </div>
          </div>
          <hr class="border-dashed border-gray-300 mb-3">
          <div class="flex justify-between font-bold">
            <span>TOTAL</span>
            <span>{{ ticket.total.toFixed(2) }} €</span>
          </div>
          <p v-if="ticket.metodoPago" class="text-xs text-center text-gray-400 mt-3">{{ formatMetodoPago(ticket.metodoPago) }}</p>
          <div class="flex justify-center gap-px mt-4">
            <div v-for="i in 40" :key="i" class="bg-gray-800" :style="{ width: '2px', height: i % 3 === 0 ? '28px' : '20px' }" />
          </div>
        </div>

        <button
          class="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-semibold text-white transition-opacity active:opacity-80"
          style="background: linear-gradient(135deg, #bd93f9, #ff79c6)"
          @click="downloadPNG"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Descargar como PNG
        </button>
      </div>
    </template>
  </div>

  <!-- ── SHEET: ELIMINAR ───────────────────────────────────────────────── -->
  <Teleport to="body">
    <Transition name="overlay">
      <div v-if="showDelete" class="fixed inset-0 z-40 bg-black/60" @click="showDelete = false" />
    </Transition>
    <Transition name="sheet">
      <div v-if="showDelete" class="fixed bottom-0 left-0 right-0 z-50 bg-dracula-card2 rounded-t-3xl px-4 pt-5 pb-10 border-t border-dracula-muted/20">
        <div class="w-10 h-1 rounded-full bg-dracula-muted/40 mx-auto mb-6" />

        <div class="flex flex-col items-center gap-3 mb-6">
          <div class="w-14 h-14 rounded-2xl bg-dracula-red/15 flex items-center justify-center">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-dracula-red">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
              <path d="M10 11v6M14 11v6"/>
              <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
            </svg>
          </div>
          <h2 class="text-lg font-bold text-dracula-text">Eliminar ticket</h2>
          <p class="text-sm text-dracula-muted text-center">
            ¿Eliminás <span class="text-dracula-text font-semibold">{{ ticket?.comercio }}</span>?
            Esta acción no se puede deshacer.
          </p>
        </div>

        <p v-if="deleteError" class="text-xs text-dracula-red bg-dracula-red/10 rounded-xl px-3 py-2 mb-3 text-center">{{ deleteError }}</p>

        <div class="flex flex-col gap-2">
          <button
            :disabled="deleting"
            class="w-full py-4 rounded-2xl text-sm font-semibold text-white bg-dracula-red transition-opacity disabled:opacity-50"
            @click="confirmDelete"
          >
            {{ deleting ? 'Eliminando...' : 'Sí, eliminar' }}
          </button>
          <button
            class="w-full py-3 rounded-2xl text-sm font-medium text-dracula-muted bg-dracula-card"
            @click="showDelete = false"
          >
            Cancelar
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- ── SHEET: EDITAR ─────────────────────────────────────────────────── -->
  <Teleport to="body">
    <Transition name="overlay">
      <div v-if="showEdit" class="fixed inset-0 z-40 bg-black/60" @click="showEdit = false" />
    </Transition>
    <Transition name="sheet">
      <div v-if="showEdit" class="fixed bottom-0 left-0 right-0 z-50 bg-dracula-card2 rounded-t-3xl border-t border-dracula-muted/20 flex flex-col max-h-[90dvh]">
        <div class="px-4 pt-5 pb-4 flex-shrink-0">
          <div class="w-10 h-1 rounded-full bg-dracula-muted/40 mx-auto mb-4" />
          <h2 class="text-lg font-bold text-dracula-text">Editar ticket</h2>
        </div>

        <div class="overflow-y-auto flex-1 px-4 pb-10 flex flex-col gap-4">
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-semibold uppercase tracking-wider text-dracula-muted">Comercio</label>
            <input
              v-model="editForm.comercio"
              type="text"
              class="w-full bg-dracula-bg rounded-2xl px-4 py-3.5 text-sm text-dracula-text border border-dracula-muted/20 focus:border-dracula-purple focus:outline-none transition-colors"
            >
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-semibold uppercase tracking-wider text-dracula-muted">Fecha</label>
            <input
              v-model="editForm.fecha"
              type="date"
              class="w-full bg-dracula-bg rounded-2xl px-4 py-3.5 text-sm text-dracula-text border border-dracula-muted/20 focus:border-dracula-purple focus:outline-none transition-colors appearance-none"
            >
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-semibold uppercase tracking-wider text-dracula-muted">Total</label>
            <div class="relative">
              <span class="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-dracula-muted">€</span>
              <input
                v-model="editForm.total"
                type="number"
                min="0"
                step="0.01"
                class="w-full bg-dracula-bg rounded-2xl pl-9 pr-4 py-3.5 text-sm text-dracula-text border border-dracula-muted/20 focus:border-dracula-purple focus:outline-none transition-colors"
              >
            </div>
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-semibold uppercase tracking-wider text-dracula-muted">Categoría</label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="cat in categorias"
                :key="cat"
                type="button"
                class="px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
                :class="editForm.categoria === cat ? 'bg-dracula-purple text-dracula-bg' : 'bg-dracula-bg text-dracula-muted'"
                @click="editForm.categoria = cat"
              >
                {{ cat }}
              </button>
            </div>
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-semibold uppercase tracking-wider text-dracula-muted">Método de pago</label>
            <div v-if="loadingMetodos" class="flex gap-2">
              <div v-for="i in 3" :key="i" class="h-7 w-20 rounded-full bg-dracula-bg animate-pulse" />
            </div>
            <div v-else class="flex flex-wrap gap-2">
              <button
                v-for="m in metodos"
                :key="m"
                type="button"
                class="px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
                :class="editForm.metodoPago === m ? 'bg-dracula-muted text-dracula-text' : 'bg-dracula-bg text-dracula-muted'"
                @click="editForm.metodoPago = editForm.metodoPago === m ? '' : m"
              >
                {{ m }}
              </button>
            </div>
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-semibold uppercase tracking-wider text-dracula-muted">Notas</label>
            <textarea
              v-model="editForm.notas"
              rows="3"
              class="w-full bg-dracula-bg rounded-2xl px-4 py-3.5 text-sm text-dracula-text border border-dracula-muted/20 focus:border-dracula-purple focus:outline-none transition-colors resize-none"
            />
          </div>

          <p v-if="saveError" class="text-xs text-dracula-red bg-dracula-red/10 rounded-xl px-3 py-2 text-center">{{ saveError }}</p>

          <button
            :disabled="saving"
            class="w-full py-4 rounded-2xl text-sm font-semibold text-white transition-opacity disabled:opacity-50"
            style="background: linear-gradient(135deg, #bd93f9, #ff79c6)"
            @click="submitEdit"
          >
            {{ saving ? 'Guardando...' : 'Guardar cambios' }}
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.overlay-enter-active,
.overlay-leave-active {
  transition: opacity 0.3s ease;
}
.overlay-enter-from,
.overlay-leave-to {
  opacity: 0;
}

.sheet-enter-active {
  transition: transform 0.38s cubic-bezier(0.32, 0.72, 0, 1);
}
.sheet-leave-active {
  transition: transform 0.28s cubic-bezier(0.4, 0, 1, 1);
}
.sheet-enter-from,
.sheet-leave-to {
  transform: translateY(100%);
}
</style>
