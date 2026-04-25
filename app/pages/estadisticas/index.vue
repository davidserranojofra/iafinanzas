<script setup lang="ts">
import type { StatsPeriod, TicketCategoria } from '~/types'

definePageMeta({ middleware: 'auth' })

const { tickets, pending } = useTickets()

const periodos: { key: StatsPeriod; label: string }[] = [
  { key: 'dia', label: 'Hoy' },
  { key: 'semana', label: 'Semana' },
  { key: 'mes', label: 'Mes' },
  { key: 'año', label: 'Año' },
]
const periodo = ref<StatsPeriod>('semana')

const now = new Date()

const ticketsPeriodo = computed(() => {
  return tickets.value.filter(t => {
    const d = new Date(t.fecha)
    switch (periodo.value) {
      case 'dia':
        return d.toDateString() === now.toDateString()
      case 'semana': {
        const inicio = new Date(now)
        inicio.setDate(now.getDate() - 6)
        inicio.setHours(0, 0, 0, 0)
        return d >= inicio
      }
      case 'mes':
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      case 'año':
        return d.getFullYear() === now.getFullYear()
    }
  })
})

const total = computed(() => ticketsPeriodo.value.reduce((s, t) => s + t.total, 0))
const count = computed(() => ticketsPeriodo.value.length)

const chartData = computed(() => {
  if (periodo.value === 'semana') {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now)
      d.setDate(now.getDate() - (6 - i))
      const label = d.toLocaleDateString('es-ES', { weekday: 'short' })
      const value = tickets.value
        .filter(t => new Date(t.fecha).toDateString() === d.toDateString())
        .reduce((s, t) => s + t.total, 0)
      return { label, value }
    })
  }
  if (periodo.value === 'mes') {
    return Array.from({ length: 4 }, (_, w) => {
      const startDay = w * 7 + 1
      const endDay = Math.min(startDay + 6, new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate())
      const value = ticketsPeriodo.value
        .filter(t => {
          const day = new Date(t.fecha).getDate()
          return day >= startDay && day <= endDay
        })
        .reduce((s, t) => s + t.total, 0)
      return { label: `S${w + 1}`, value }
    })
  }
  if (periodo.value === 'año') {
    return Array.from({ length: 12 }, (_, m) => {
      const label = new Date(now.getFullYear(), m, 1).toLocaleDateString('es-ES', { month: 'short' })
      const value = tickets.value
        .filter(t => {
          const d = new Date(t.fecha)
          return d.getMonth() === m && d.getFullYear() === now.getFullYear()
        })
        .reduce((s, t) => s + t.total, 0)
      return { label, value }
    })
  }
  return []
})

const maxChart = computed(() => Math.max(...chartData.value.map(d => d.value), 1))

const COLORES: Record<TicketCategoria, string> = {
  'Alimentación':  '#50fa7b',
  'Transporte':    '#8be9fd',
  'Ropa':          '#ff79c6',
  'Restaurantes':  '#ffb86c',
  'Suscripciones': '#bd93f9',
  'Salud':         '#ff5555',
  'Hogar':         '#f1fa8c',
  'Ocio':          '#ff79c6',
  'Tecnología':    '#8be9fd',
  'Otro':          '#6272a4',
}

const catStats = computed(() => {
  const map = new Map<TicketCategoria, number>()
  for (const t of ticketsPeriodo.value) {
    map.set(t.categoria, (map.get(t.categoria) ?? 0) + t.total)
  }
  const tot = total.value || 1
  return Array.from(map.entries())
    .map(([categoria, amount]) => ({
      categoria,
      amount,
      pct: Math.round((amount / tot) * 100),
      color: COLORES[categoria],
    }))
    .sort((a, b) => b.amount - a.amount)
})
</script>

<template>
  <div class="flex flex-col min-h-screen bg-dracula-bg pb-24">
    <!-- Header -->
    <div class="px-4 pt-12 pb-4">
      <h1 class="text-xl font-bold text-dracula-text">Estadísticas</h1>
    </div>

    <!-- Selector de período -->
    <div class="flex gap-2 px-4 pb-4">
      <button
        v-for="p in periodos"
        :key="p.key"
        class="flex-1 py-2 rounded-2xl text-xs font-semibold transition-colors"
        :class="periodo === p.key
          ? 'bg-dracula-purple text-dracula-bg'
          : 'bg-dracula-card text-dracula-muted'"
        @click="periodo = p.key"
      >
        {{ p.label }}
      </button>
    </div>

    <div class="flex flex-col gap-4 px-4">
      <template v-if="pending">
        <div class="h-24 rounded-3xl bg-dracula-card2 animate-pulse" />
        <div class="h-32 rounded-3xl bg-dracula-card2 animate-pulse" />
        <div class="h-40 rounded-3xl bg-dracula-card2 animate-pulse" />
      </template>

      <template v-else>
        <!-- Total del período -->
        <div class="rounded-3xl p-5" style="background: linear-gradient(135deg, rgba(189,147,249,0.2), rgba(255,121,198,0.1)); border: 1px solid rgba(189,147,249,0.25)">
          <p class="text-xs font-semibold uppercase tracking-wider text-dracula-muted mb-1">Total</p>
          <p class="text-4xl font-bold text-dracula-text">
            {{ total.toFixed(2) }} <span class="text-2xl text-dracula-muted">€</span>
          </p>
          <p class="text-sm text-dracula-muted mt-1">
            {{ count }} ticket{{ count !== 1 ? 's' : '' }}
          </p>
        </div>

        <!-- Sin datos -->
        <div v-if="ticketsPeriodo.length === 0" class="flex flex-col items-center py-10 gap-3">
          <div class="w-14 h-14 rounded-2xl bg-dracula-card2 flex items-center justify-center text-2xl">📊</div>
          <p class="text-sm text-dracula-muted text-center">Sin tickets en este período</p>
        </div>

        <template v-else>
          <!-- Gráfico de barras -->
          <div v-if="periodo !== 'dia'" class="bg-dracula-card2 rounded-3xl p-4 border border-dracula-muted/10">
            <p class="text-xs font-semibold uppercase tracking-wider text-dracula-muted mb-4">
              {{ periodo === 'semana' ? 'Por día' : periodo === 'mes' ? 'Por semana' : 'Por mes' }}
            </p>
            <div class="flex items-end justify-between gap-1.5 h-24">
              <div
                v-for="(bar, i) in chartData"
                :key="i"
                class="flex flex-col items-center gap-1.5 flex-1"
              >
                <div
                  class="w-full rounded-lg transition-all"
                  :style="{
                    height: `${Math.max((bar.value / maxChart) * 80, bar.value > 0 ? 6 : 2)}px`,
                    background: bar.value > 0
                      ? 'linear-gradient(180deg, #bd93f9, #ff79c6)'
                      : 'rgba(98,114,164,0.2)',
                  }"
                />
                <span class="text-[10px] text-dracula-muted capitalize truncate w-full text-center">{{ bar.label }}</span>
              </div>
            </div>
          </div>

          <!-- Desglose por categoría -->
          <div class="bg-dracula-card2 rounded-3xl p-4 border border-dracula-muted/10">
            <p class="text-xs font-semibold uppercase tracking-wider text-dracula-muted mb-4">Por categoría</p>
            <div class="flex flex-col gap-3">
              <div v-for="stat in catStats" :key="stat.categoria" class="flex flex-col gap-1.5">
                <div class="flex items-center justify-between">
                  <span class="text-sm font-medium text-dracula-text">{{ stat.categoria }}</span>
                  <div class="flex items-center gap-2">
                    <span class="text-xs text-dracula-muted">{{ stat.pct }}%</span>
                    <span class="text-sm font-semibold text-dracula-text">{{ stat.amount.toFixed(2) }} €</span>
                  </div>
                </div>
                <div class="h-1.5 rounded-full bg-dracula-card overflow-hidden">
                  <div
                    class="h-full rounded-full transition-all"
                    :style="{ width: `${stat.pct}%`, background: stat.color }"
                  />
                </div>
              </div>
            </div>
          </div>
        </template>
      </template>
    </div>
  </div>
</template>
