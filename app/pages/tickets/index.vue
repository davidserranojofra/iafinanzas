<script setup lang="ts">
import type { TicketCategoria } from '~/types'

definePageMeta({ middleware: 'auth' })

const { tickets, shouldShowSkeleton, shouldShowError, isRefreshing, isOfflineData } = useTickets()
const router = useRouter()

const categorias: TicketCategoria[] = [
  'Alimentación', 'Transporte', 'Ropa', 'Restaurantes',
  'Suscripciones', 'Salud', 'Hogar', 'Ocio', 'Tecnología', 'Otro',
]

const filtroActivo = ref<TicketCategoria | null>(null)
const searchQuery = ref('')
const sortField = ref<'fecha' | 'createdAt'>('createdAt')
const sortDirection = ref<'asc' | 'desc'>('desc')

const ticketsFiltrados = computed(() => {
  let list = [...tickets.value]

  // 1. Filtrar por categoría
  if (filtroActivo.value) {
    list = list.filter(t => t.categoria === filtroActivo.value)
  }

  // 2. Filtrar por buscador
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim()
    list = list.filter(t => 
      t.comercio.toLowerCase().includes(query) || 
      (t.notas && t.notas.toLowerCase().includes(query)) ||
      t.categoria.toLowerCase().includes(query)
    )
  }

  // 3. Ordenar
  list.sort((a, b) => {
    const valA = a[sortField.value] || ''
    const valB = b[sortField.value] || ''
    
    let comparison = 0
    if (valA < valB) comparison = -1
    if (valA > valB) comparison = 1
    
    return sortDirection.value === 'desc' ? -comparison : comparison
  })

  return list
})

const totalFiltrado = computed(() =>
  ticketsFiltrados.value.reduce((s, t) => s + t.total, 0),
)
</script>

<template>
  <div class="flex flex-col min-h-screen bg-dracula-bg pb-24">
    <!-- Header -->
    <div class="px-4 pt-12 pb-4">
      <h1 class="text-xl font-bold text-dracula-text">Mis tickets</h1>
      <p class="text-sm text-dracula-muted mt-0.5">
        {{ tickets.length }} ticket{{ tickets.length !== 1 ? 's' : '' }} · {{ totalFiltrado.toFixed(2) }} €
      </p>
    </div>

    <!-- Buscador Premium -->
    <div class="px-4 pb-4">
      <div class="relative">
        <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-dracula-muted text-sm">🔍</span>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Buscar comercio, notas..."
          class="w-full bg-dracula-card2 rounded-2xl pl-10 pr-10 py-3 text-sm text-dracula-text placeholder-dracula-muted/50 border border-dracula-muted/10 transition-colors focus:border-dracula-purple focus:outline-none"
        >
        <button
          v-if="searchQuery"
          class="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-dracula-muted p-1 hover:text-dracula-text active:opacity-70"
          @click="searchQuery = ''"
        >
          ✕
        </button>
      </div>
    </div>

    <!-- Filtros por categoría -->
    <div class="flex gap-2 px-4 pb-4 overflow-x-auto scrollbar-hide">
      <button
        class="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
        :class="filtroActivo === null
          ? 'bg-dracula-purple text-dracula-bg'
          : 'bg-dracula-card text-dracula-muted'"
        @click="filtroActivo = null"
      >
        Todos
      </button>
      <button
        v-for="cat in categorias"
        :key="cat"
        class="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
        :class="filtroActivo === cat
          ? 'bg-dracula-purple text-dracula-bg'
          : 'bg-dracula-card text-dracula-muted'"
        @click="filtroActivo = filtroActivo === cat ? null : cat"
      >
        {{ cat }}
      </button>
    </div>

    <!-- Barra de Ordenación Premium -->
    <div class="flex items-center justify-between px-4 pb-4 text-xs">
      <div class="flex items-center gap-1.5">
        <span class="text-dracula-muted">Ordenar por:</span>
        <button
          class="px-2.5 py-1 rounded-lg border transition-colors font-medium cursor-pointer"
          :class="sortField === 'createdAt' 
            ? 'bg-dracula-purple/10 border-dracula-purple text-dracula-purple' 
            : 'border-dracula-muted/10 text-dracula-muted hover:text-dracula-text'"
          @click="sortField = 'createdAt'"
        >
          Registro
        </button>
        <button
          class="px-2.5 py-1 rounded-lg border transition-colors font-medium cursor-pointer"
          :class="sortField === 'fecha' 
            ? 'bg-dracula-purple/10 border-dracula-purple text-dracula-purple' 
            : 'border-dracula-muted/10 text-dracula-muted hover:text-dracula-text'"
          @click="sortField = 'fecha'"
        >
          Compra
        </button>
      </div>
      
      <button
        class="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-dracula-card2 border border-dracula-muted/10 text-dracula-text active:opacity-85 cursor-pointer"
        @click="sortDirection = sortDirection === 'desc' ? 'asc' : 'desc'"
      >
        <span>{{ sortDirection === 'desc' ? 'Más recientes' : 'Más antiguos' }}</span>
        <span class="text-[10px]">{{ sortDirection === 'desc' ? '▼' : '▲' }}</span>
      </button>
    </div>

    <!-- Lista -->
    <div class="flex flex-col gap-2 px-4">
      <template v-if="shouldShowSkeleton">
        <div v-for="i in 6" :key="i" class="h-16 rounded-2xl bg-dracula-card2 animate-pulse" />
      </template>

      <div v-else-if="shouldShowError" class="flex flex-col items-center py-16 gap-3">
        <div class="w-14 h-14 rounded-2xl bg-dracula-card2 flex items-center justify-center text-2xl">⚠️</div>
        <p class="text-sm text-dracula-muted text-center">
          No pudimos cargar los tickets. Reintentá en un rato.
        </p>
      </div>

      <div v-else-if="ticketsFiltrados.length === 0" class="flex flex-col items-center py-16 gap-3">
        <div class="w-14 h-14 rounded-2xl bg-dracula-card2 flex items-center justify-center text-2xl">🧾</div>
        <p class="text-sm text-dracula-muted text-center">
          {{ filtroActivo || searchQuery ? 'No se encontraron tickets con los filtros actuales' : 'Todavía no hay tickets' }}
        </p>
      </div>

      <TicketsTicketRow
        v-for="ticket in ticketsFiltrados"
        :key="ticket.id"
        :ticket="ticket"
        @click="router.push(`/tickets/${ticket.id}`)"
      />
    </div>
  </div>
</template>
