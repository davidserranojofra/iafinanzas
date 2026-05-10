<script setup lang="ts">
import type { StatsPeriod, TicketCategoria } from '~/types'

definePageMeta({ middleware: 'auth' })

const { tickets, pending, shouldShowSkeleton, shouldShowError, isRefreshing, isOfflineData } = useTickets()

const periodos: { key: StatsPeriod; label: string }[] = [
  { key: 'dia', label: 'Hoy' },
  { key: 'semana', label: 'Semana' },
  { key: 'mes', label: 'Mes' },
  { key: 'año', label: 'Año' },
]

const periodo = ref<StatsPeriod>('semana')

function createDate(
  year: number,
  month: number,
  day: number,
  hours = 12,
  minutes = 0,
  seconds = 0,
  milliseconds = 0,
) {
  return new Date(year, month, day, hours, minutes, seconds, milliseconds)
}

function parseTicketDate(value: string) {
  const [year = 0, month = 1, day = 1] = value
    .slice(0, 10)
    .split('-')
    .map(part => Number(part || '0'))

  return createDate(year, month - 1, day)
}

function normalizeDate(value: Date) {
  return createDate(value.getFullYear(), value.getMonth(), value.getDate())
}

function getStartOfDay(date: Date) {
  return createDate(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0)
}

function getEndOfDay(date: Date) {
  return createDate(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999)
}

function getStartOfWeek(date: Date) {
  const start = getStartOfDay(date)
  const day = start.getDay()
  const diff = day === 0 ? 6 : day - 1
  start.setDate(start.getDate() - diff)
  return start
}

function getEndOfWeek(date: Date) {
  const end = getStartOfWeek(date)
  end.setDate(end.getDate() + 6)
  return getEndOfDay(end)
}

function getStartOfMonth(date: Date) {
  return createDate(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0)
}

function getEndOfMonth(date: Date) {
  return createDate(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999)
}

function getStartOfYear(date: Date) {
  return createDate(date.getFullYear(), 0, 1, 0, 0, 0, 0)
}

function getEndOfYear(date: Date) {
  return createDate(date.getFullYear(), 11, 31, 23, 59, 59, 999)
}

function getPeriodBounds(date: Date, selected: StatsPeriod) {
  switch (selected) {
    case 'dia':
      return { start: getStartOfDay(date), end: getEndOfDay(date) }
    case 'semana':
      return { start: getStartOfWeek(date), end: getEndOfWeek(date) }
    case 'mes':
      return { start: getStartOfMonth(date), end: getEndOfMonth(date) }
    case 'año':
      return { start: getStartOfYear(date), end: getEndOfYear(date) }
  }

  throw new Error('Período no soportado')
}

function formatDate(date: Date, options: Intl.DateTimeFormatOptions) {
  return date.toLocaleDateString('es-ES', options)
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate()
}

const today = normalizeDate(new Date())

function clampToToday(value: Date) {
  return value.getTime() > today.getTime() ? new Date(today) : normalizeDate(value)
}

function shiftViewedDate(date: Date, selected: StatsPeriod, amount: number) {
  const next = normalizeDate(date)

  switch (selected) {
    case 'dia':
      next.setDate(next.getDate() + amount)
      return clampToToday(next)
    case 'semana':
      next.setDate(next.getDate() + (amount * 7))
      return clampToToday(next)
    case 'mes': {
      const day = next.getDate()
      next.setDate(1)
      next.setMonth(next.getMonth() + amount)
      const daysInTargetMonth = createDate(next.getFullYear(), next.getMonth() + 1, 0).getDate()
      next.setDate(Math.min(day, daysInTargetMonth))
      return clampToToday(next)
    }
    case 'año': {
      const month = next.getMonth()
      const day = next.getDate()
      next.setDate(1)
      next.setFullYear(next.getFullYear() + amount)
      const daysInTargetMonth = createDate(next.getFullYear(), month + 1, 0).getDate()
      next.setMonth(month, Math.min(day, daysInTargetMonth))
      return clampToToday(next)
    }
  }

  throw new Error('Período no soportado')
}

const viewedDates = reactive<Record<StatsPeriod, Date>>({
  dia: new Date(today),
  semana: new Date(today),
  mes: new Date(today),
  año: new Date(today),
})

const viewedDate = computed({
  get: () => viewedDates[periodo.value],
  set: (value: Date) => {
    viewedDates[periodo.value] = clampToToday(value)
  },
})

const bounds = computed(() => getPeriodBounds(viewedDate.value, periodo.value))
const latestBounds = computed(() => getPeriodBounds(today, periodo.value))

const canGoPrev = computed(() => true)

const canGoNext = computed(() => {
  return bounds.value.start.getTime() < latestBounds.value.start.getTime()
})

function goToPreviousPeriod() {
  if (!canGoPrev.value) return
  viewedDate.value = shiftViewedDate(viewedDate.value, periodo.value, -1)
}

function goToNextPeriod() {
  if (!canGoNext.value) return
  viewedDate.value = shiftViewedDate(viewedDate.value, periodo.value, 1)
}

const periodTypeLabel = computed(() => {
  switch (periodo.value) {
    case 'dia':
      return 'Día'
    case 'semana':
      return 'Semana'
    case 'mes':
      return 'Mes'
    case 'año':
      return 'Año'
  }

  throw new Error('Período no soportado')
})

const visiblePeriodLabel = computed(() => {
  switch (periodo.value) {
    case 'dia':
      return formatDate(viewedDate.value, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    case 'semana': {
      const { start, end } = bounds.value

      if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
        return `${start.getDate()}–${end.getDate()} de ${formatDate(end, { month: 'long', year: 'numeric' })}`
      }

      if (start.getFullYear() === end.getFullYear()) {
        return `${formatDate(start, { day: 'numeric', month: 'short' })} – ${formatDate(end, { day: 'numeric', month: 'short', year: 'numeric' })}`
      }

      return `${formatDate(start, { day: 'numeric', month: 'short', year: 'numeric' })} – ${formatDate(end, { day: 'numeric', month: 'short', year: 'numeric' })}`
    }
    case 'mes':
      return formatDate(viewedDate.value, { month: 'long', year: 'numeric' })
    case 'año':
      return String(viewedDate.value.getFullYear())
  }

  throw new Error('Período no soportado')
})

const totalLabel = computed(() => {
  switch (periodo.value) {
    case 'dia':
      return 'Total del día'
    case 'semana':
      return 'Total de la semana'
    case 'mes':
      return 'Total del mes'
    case 'año':
      return 'Total del año'
  }

  throw new Error('Período no soportado')
})

const ticketsPeriodo = computed(() => {
  return tickets.value.filter(ticket => {
    const date = parseTicketDate(ticket.fecha)
    return date >= bounds.value.start && date <= bounds.value.end
  })
})

const total = computed(() => ticketsPeriodo.value.reduce((sum, ticket) => sum + ticket.total, 0))
const count = computed(() => ticketsPeriodo.value.length)

const chartData = computed(() => {
  if (periodo.value === 'semana') {
    const start = getStartOfWeek(viewedDate.value)

    return Array.from({ length: 7 }, (_, index) => {
      const day = normalizeDate(start)
      day.setDate(start.getDate() + index)

      const value = ticketsPeriodo.value
        .filter(ticket => isSameDay(parseTicketDate(ticket.fecha), day))
        .reduce((sum, ticket) => sum + ticket.total, 0)

      return {
        label: formatDate(day, { weekday: 'short' }),
        value,
      }
    })
  }

  if (periodo.value === 'mes') {
    const daysInMonth = getEndOfMonth(viewedDate.value).getDate()
    const totalWeeks = Math.ceil(daysInMonth / 7)

    return Array.from({ length: totalWeeks }, (_, weekIndex) => {
      const startDay = weekIndex * 7 + 1
      const endDay = Math.min(startDay + 6, daysInMonth)
      const value = ticketsPeriodo.value
        .filter(ticket => {
          const day = parseTicketDate(ticket.fecha).getDate()
          return day >= startDay && day <= endDay
        })
        .reduce((sum, ticket) => sum + ticket.total, 0)

      return {
        label: `S${weekIndex + 1}`,
        value,
      }
    })
  }

  if (periodo.value === 'año') {
    const year = viewedDate.value.getFullYear()

    return Array.from({ length: 12 }, (_, month) => {
      const value = ticketsPeriodo.value
        .filter(ticket => parseTicketDate(ticket.fecha).getMonth() === month)
        .reduce((sum, ticket) => sum + ticket.total, 0)

      return {
        label: formatDate(createDate(year, month, 1), { month: 'short' }),
        value,
      }
    })
  }

  return []
})

const maxChart = computed(() => Math.max(...chartData.value.map(point => point.value), 1))

const { getCategoryColor } = useCategories()

const catStats = computed(() => {
  const map = new Map<TicketCategoria, number>()

  for (const ticket of ticketsPeriodo.value) {
    map.set(ticket.categoria, (map.get(ticket.categoria) ?? 0) + ticket.total)
  }

  const safeTotal = total.value || 1

  return Array.from(map.entries())
    .map(([categoria, amount]) => ({
      categoria,
      amount,
      pct: Math.round((amount / safeTotal) * 100),
      color: getCategoryColor(categoria),
    }))
    .sort((a, b) => b.amount - a.amount)
})

const estadoStats = computed(() => {
  if (isRefreshing.value && isOfflineData.value) return 'Mostrando snapshot guardado mientras actualizamos'
  if (isRefreshing.value) return 'Actualizando estadísticas…'
  if (isOfflineData.value) return 'Estadísticas basadas en datos guardados offline'
  return null
})
</script>

<template>
  <div class="flex flex-col min-h-screen bg-dracula-bg pb-24">
    <!-- Header -->
    <div class="px-4 pt-12 pb-4">
      <h1 class="text-xl font-bold text-dracula-text">Estadísticas</h1>
      <p v-if="estadoStats" class="mt-2 text-xs text-dracula-cyan">{{ estadoStats }}</p>
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

    <!-- Navegación temporal -->
    <div class="flex items-center gap-3 px-4 pb-4">
      <button
        class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-dracula-muted/10 bg-dracula-card2 text-xl font-semibold text-dracula-text transition-opacity disabled:cursor-not-allowed disabled:text-dracula-muted disabled:opacity-40"
        :disabled="!canGoPrev"
        aria-label="Ir al período anterior"
        @click="goToPreviousPeriod"
      >
        ‹
      </button>

      <div class="flex-1 rounded-3xl border border-dracula-muted/10 bg-dracula-card2 px-4 py-3 text-center">
        <p class="text-[10px] font-semibold uppercase tracking-wider text-dracula-muted">{{ periodTypeLabel }}</p>
        <p class="mt-1 text-sm font-semibold text-dracula-text">{{ visiblePeriodLabel }}</p>
      </div>

      <button
        class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-dracula-muted/10 bg-dracula-card2 text-xl font-semibold text-dracula-text transition-opacity disabled:cursor-not-allowed disabled:text-dracula-muted disabled:opacity-40"
        :disabled="!canGoNext"
        aria-label="Ir al período siguiente"
        @click="goToNextPeriod"
      >
        ›
      </button>
    </div>

    <div class="flex flex-col gap-4 px-4">
      <template v-if="shouldShowSkeleton">
        <div class="h-24 rounded-3xl bg-dracula-card2 animate-pulse" />
        <div class="h-32 rounded-3xl bg-dracula-card2 animate-pulse" />
        <div class="h-40 rounded-3xl bg-dracula-card2 animate-pulse" />
      </template>

      <div v-else-if="shouldShowError" class="flex flex-col items-center py-10 gap-3">
        <div class="w-14 h-14 rounded-2xl bg-dracula-card2 flex items-center justify-center text-2xl">⚠️</div>
        <p class="text-sm text-dracula-muted text-center">No pudimos cargar las estadísticas.</p>
      </div>

      <template v-else>
        <!-- Total del período -->
        <div class="rounded-3xl p-5" style="background: linear-gradient(135deg, rgba(189,147,249,0.2), rgba(255,121,198,0.1)); border: 1px solid rgba(189,147,249,0.25)">
          <p class="text-xs font-semibold uppercase tracking-wider text-dracula-muted mb-1">{{ totalLabel }}</p>
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
