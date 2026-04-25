<script setup lang="ts">
import type { TicketCategoria } from '~/types'

definePageMeta({ middleware: 'auth' })

const { createTicket } = useTickets()
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const saving = ref(false)
const errors = ref<Record<string, string>>({})

const pendingTicket = useState<Record<string, unknown> | null>('pending-ticket', () => null)

const prefill = pendingTicket.value
pendingTicket.value = null

const form = ref({
  comercio:   String(prefill?.comercio ?? ''),
  fecha:      String(prefill?.fecha ?? new Date().toISOString().slice(0, 10)),
  total:      prefill?.total ? String(prefill.total) : '',
  categoria:  (prefill?.categoria ?? '') as TicketCategoria | '',
  metodoPago: String(prefill?.metodoPago ?? ''),
  notas:      String(prefill?.notas ?? ''),
})

const categorias: TicketCategoria[] = [
  'Alimentación', 'Transporte', 'Ropa', 'Restaurantes',
  'Suscripciones', 'Salud', 'Hogar', 'Ocio', 'Tecnología', 'Otro',
]

const TODOS_LOS_METODOS = ['Efectivo', 'Tarjeta débito', 'Tarjeta crédito', 'Transferencia', 'Otro']
const metodos = ref<string[]>([])

const { pending: loadingMetodos } = useAsyncData(
  'metodos-pago-manual',
  async () => {
    if (!user.value) return null
    const { data, error } = await supabase
      .from('profiles')
      .select('metodos_pago')
      .single()
    if (error) throw error
    return data
  },
  {
    watch: [user],
    transform: (data) => {
      const activos = data?.metodos_pago
      metodos.value = activos?.length ? activos : TODOS_LOS_METODOS
      return data
    },
  },
)

const canSubmit = computed(() =>
  form.value.comercio.trim() &&
  form.value.fecha &&
  Number(form.value.total) > 0 &&
  form.value.categoria,
)

function validate() {
  const e: Record<string, string> = {}
  if (!form.value.comercio.trim()) e.comercio = 'Requerido'
  if (!form.value.fecha) e.fecha = 'Requerido'
  if (!form.value.total || Number(form.value.total) <= 0) e.total = 'Debe ser mayor a 0'
  if (!form.value.categoria) e.categoria = 'Elegí una categoría'
  errors.value = e
  return Object.keys(e).length === 0
}

async function submit() {
  if (!validate()) return
  saving.value = true
  try {
    const ticket = await createTicket({
      comercio:      form.value.comercio.trim(),
      fecha:         form.value.fecha,
      total:         Number(form.value.total),
      categoria:     form.value.categoria as TicketCategoria,
      metodoPago:    form.value.metodoPago || undefined,
      notas:         form.value.notas.trim() || undefined,
      extractedByAI: false,
    })
    await navigateTo(`/tickets/${ticket.id}`, { replace: true })
  } catch (e: unknown) {
    errors.value.global = e instanceof Error ? e.message : 'Error al guardar el ticket.'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="flex flex-col min-h-screen bg-dracula-bg pb-28">
    <div class="flex items-center justify-between px-4 pt-12 pb-4">
      <button
        class="flex items-center justify-center w-10 h-10 rounded-2xl bg-dracula-card2 text-dracula-text"
        @click="navigateTo('/tickets')"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </button>
      <h1 class="text-base font-semibold text-dracula-text">Ticket manual</h1>
      <div class="w-10" />
    </div>

    <form class="flex flex-col gap-4 px-4" @submit.prevent="submit">

      <!-- Comercio -->
      <div class="flex flex-col gap-1.5">
        <label class="text-xs font-semibold uppercase tracking-wider text-dracula-muted">Comercio *</label>
        <div class="relative">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 text-dracula-muted" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          <input
            v-model="form.comercio"
            type="text"
            placeholder="Nombre del comercio"
            class="w-full bg-dracula-card2 rounded-2xl pl-10 pr-4 py-3.5 text-sm text-dracula-text placeholder-dracula-muted/60 border transition-colors focus:outline-none"
            :class="errors.comercio ? 'border-dracula-red' : 'border-dracula-muted/20 focus:border-dracula-purple'"
            @input="delete errors.comercio"
          >
        </div>
        <p v-if="errors.comercio" class="text-xs text-dracula-red">{{ errors.comercio }}</p>
      </div>

      <!-- Fecha -->
      <div class="flex flex-col gap-1.5">
        <label class="text-xs font-semibold uppercase tracking-wider text-dracula-muted">Fecha *</label>
        <div class="relative">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 text-dracula-muted" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <input
            v-model="form.fecha"
            type="date"
            class="w-full bg-dracula-card2 rounded-2xl pl-10 pr-4 py-3.5 text-sm text-dracula-text border transition-colors focus:outline-none appearance-none"
            :class="errors.fecha ? 'border-dracula-red' : 'border-dracula-muted/20 focus:border-dracula-purple'"
            @input="delete errors.fecha"
          >
        </div>
        <p v-if="errors.fecha" class="text-xs text-dracula-red">{{ errors.fecha }}</p>
      </div>

      <!-- Total -->
      <div class="flex flex-col gap-1.5">
        <label class="text-xs font-semibold uppercase tracking-wider text-dracula-muted">Total *</label>
        <div class="relative">
          <span class="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-dracula-muted">€</span>
          <input
            v-model="form.total"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            class="w-full bg-dracula-card2 rounded-2xl pl-9 pr-4 py-3.5 text-sm text-dracula-text placeholder-dracula-muted/60 border transition-colors focus:outline-none"
            :class="errors.total ? 'border-dracula-red' : 'border-dracula-muted/20 focus:border-dracula-purple'"
            @input="delete errors.total"
          >
        </div>
        <p v-if="errors.total" class="text-xs text-dracula-red">{{ errors.total }}</p>
      </div>

      <!-- Categoría -->
      <div class="flex flex-col gap-1.5">
        <label class="text-xs font-semibold uppercase tracking-wider text-dracula-muted">Categoría *</label>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="cat in categorias"
            :key="cat"
            type="button"
            class="px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
            :class="form.categoria === cat
              ? 'bg-dracula-purple text-dracula-bg'
              : 'bg-dracula-card text-dracula-muted hover:text-dracula-text'"
            @click="form.categoria = cat; delete errors.categoria"
          >
            {{ cat }}
          </button>
        </div>
        <p v-if="errors.categoria" class="text-xs text-dracula-red">{{ errors.categoria }}</p>
      </div>

      <!-- Método de pago -->
      <div class="flex flex-col gap-1.5">
        <label class="text-xs font-semibold uppercase tracking-wider text-dracula-muted">Método de pago</label>
        <div v-if="loadingMetodos" class="flex gap-2">
          <div v-for="i in 3" :key="i" class="h-7 w-24 rounded-full bg-dracula-card animate-pulse" />
        </div>
        <div v-else class="flex flex-wrap gap-2">
          <button
            v-for="m in metodos"
            :key="m"
            type="button"
            class="px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
            :class="form.metodoPago === m
              ? 'bg-dracula-muted text-dracula-text'
              : 'bg-dracula-card text-dracula-muted hover:text-dracula-text'"
            @click="form.metodoPago = form.metodoPago === m ? '' : m"
          >
            {{ m }}
          </button>
        </div>
      </div>

      <!-- Notas -->
      <div class="flex flex-col gap-1.5">
        <label class="text-xs font-semibold uppercase tracking-wider text-dracula-muted">Notas</label>
        <textarea
          v-model="form.notas"
          rows="3"
          placeholder="Observaciones opcionales..."
          class="w-full bg-dracula-card2 rounded-2xl px-4 py-3.5 text-sm text-dracula-text placeholder-dracula-muted/60 border border-dracula-muted/20 focus:border-dracula-purple focus:outline-none transition-colors resize-none"
        />
      </div>

      <p v-if="errors.global" class="text-xs text-dracula-red bg-dracula-red/10 rounded-xl px-3 py-2">
        {{ errors.global }}
      </p>

      <button
        type="submit"
        :disabled="!canSubmit || saving"
        class="w-full py-4 rounded-2xl text-sm font-semibold text-white transition-opacity mt-2"
        :class="canSubmit && !saving ? 'opacity-100' : 'opacity-40 cursor-not-allowed'"
        style="background: linear-gradient(135deg, #bd93f9, #ff79c6)"
      >
        {{ saving ? 'Guardando...' : 'Guardar ticket' }}
      </button>

    </form>
  </div>
</template>
