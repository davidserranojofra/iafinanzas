<script setup lang="ts">
import type { TicketCategoria } from '~/types'

definePageMeta({ middleware: 'auth' })

const { tickets, pending } = useTickets()
const router = useRouter()

const categorias: TicketCategoria[] = [
  'Alimentación', 'Transporte', 'Ropa', 'Restaurantes',
  'Suscripciones', 'Salud', 'Hogar', 'Ocio', 'Tecnología', 'Otro',
]

const filtroActivo = ref<TicketCategoria | null>(null)

const ticketsFiltrados = computed(() =>
  filtroActivo.value
    ? tickets.value.filter(t => t.categoria === filtroActivo.value)
    : tickets.value,
)

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

    <!-- Lista -->
    <div class="flex flex-col gap-2 px-4">
      <template v-if="pending">
        <div v-for="i in 6" :key="i" class="h-16 rounded-2xl bg-dracula-card2 animate-pulse" />
      </template>

      <div v-else-if="ticketsFiltrados.length === 0" class="flex flex-col items-center py-16 gap-3">
        <div class="w-14 h-14 rounded-2xl bg-dracula-card2 flex items-center justify-center text-2xl">🧾</div>
        <p class="text-sm text-dracula-muted text-center">
          {{ filtroActivo ? `No hay tickets de "${filtroActivo}"` : 'Todavía no hay tickets' }}
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
