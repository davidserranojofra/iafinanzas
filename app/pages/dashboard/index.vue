<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const user = useSupabaseUser()
const { tickets, pending } = useTickets()

const firstName = computed(() => {
  const name = user.value?.user_metadata?.nombre ?? user.value?.email ?? ''
  return name.split(' ')[0].split('@')[0]
})

const initials = computed(() => {
  const name = user.value?.user_metadata?.nombre ?? ''
  return name
    ? name.split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase()
    : user.value?.email?.[0]?.toUpperCase() ?? '?'
})

// Últimos 4 tickets para el dashboard
const recentTickets = computed(() => tickets.value.slice(0, 4))

// Balance del mes actual
const now = new Date()
const monthTickets = computed(() =>
  tickets.value.filter(t => {
    const d = new Date(t.fecha)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })
)
const monthTotal = computed(() =>
  monthTickets.value.reduce((s, t) => s + t.total, 0)
)
const ticketCount = computed(() => monthTickets.value.length)

// Gráfico semanal — últimos 7 días
const weeklyData = computed(() => {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d
  })
  return days.map(day => {
    const label = day.toLocaleDateString('es-ES', { weekday: 'short' })
    const total = tickets.value
      .filter(t => {
        const d = new Date(t.fecha)
        return d.toDateString() === day.toDateString()
      })
      .reduce((s, t) => s + t.total, 0)
    return { label, total }
  })
})

const maxWeekly = computed(() => Math.max(...weeklyData.value.map(d => d.total), 1))

const router = useRouter()
</script>

<template>
  <div class="flex flex-col min-h-screen bg-dracula-bg pb-24">
    <!-- Header -->
    <div class="flex items-center justify-between px-4 pt-12 pb-4">
      <div>
        <p class="text-xs text-dracula-muted font-medium uppercase tracking-wider">Buenos días</p>
        <h1 class="text-xl font-bold text-dracula-text capitalize">{{ firstName }}</h1>
      </div>
      <NuxtLink to="/perfil" class="flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold text-dracula-bg shadow-md" style="background: linear-gradient(135deg, #bd93f9, #ff79c6)">
        {{ initials }}
      </NuxtLink>
    </div>

    <div class="flex flex-col gap-4 px-4">
      <!-- Balance card -->
      <div class="rounded-3xl p-5 shadow-lg" style="background: linear-gradient(135deg, rgba(189,147,249,0.2), rgba(255,121,198,0.1)); border: 1px solid rgba(189,147,249,0.25)">
        <p class="text-xs font-semibold uppercase tracking-wider text-dracula-muted mb-1">Gasto este mes</p>
        <div class="flex items-end justify-between">
          <div>
            <p class="text-4xl font-bold text-dracula-text">{{ monthTotal.toFixed(2) }} <span class="text-2xl text-dracula-muted">€</span></p>
            <p class="text-sm text-dracula-muted mt-1">{{ ticketCount }} ticket{{ ticketCount !== 1 ? 's' : '' }} registrado{{ ticketCount !== 1 ? 's' : '' }}</p>
          </div>
          <div v-if="!pending" class="text-right">
            <span class="text-xs font-medium px-2.5 py-1 rounded-full bg-dracula-green/20 text-dracula-green">
              Mes actual
            </span>
          </div>
        </div>
      </div>

      <!-- Gráfico semanal -->
      <div class="bg-dracula-card2 rounded-3xl p-4 border border-dracula-muted/10">
        <p class="text-xs font-semibold uppercase tracking-wider text-dracula-muted mb-4">Últimos 7 días</p>
        <div class="flex items-end justify-between gap-1.5 h-20">
          <div
            v-for="(day, i) in weeklyData"
            :key="i"
            class="flex flex-col items-center gap-1.5 flex-1"
          >
            <div
              class="w-full rounded-lg transition-all"
              :style="{
                height: `${Math.max((day.total / maxWeekly) * 64, day.total > 0 ? 6 : 2)}px`,
                background: day.total > 0
                  ? 'linear-gradient(180deg, #bd93f9, #ff79c6)'
                  : 'rgba(98,114,164,0.2)',
              }"
            />
            <span class="text-[10px] text-dracula-muted capitalize">{{ day.label }}</span>
          </div>
        </div>
      </div>

      <!-- Últimos tickets -->
      <div>
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-sm font-semibold text-dracula-text">Últimos tickets</h2>
          <NuxtLink to="/tickets" class="text-xs text-dracula-purple font-medium">Ver todos</NuxtLink>
        </div>

        <div v-if="pending" class="flex flex-col gap-2">
          <div v-for="i in 3" :key="i" class="h-16 rounded-2xl bg-dracula-card2 animate-pulse" />
        </div>

        <div v-else-if="recentTickets.length === 0" class="flex flex-col items-center py-10 gap-3">
          <div class="w-14 h-14 rounded-2xl bg-dracula-card2 flex items-center justify-center text-2xl">🧾</div>
          <p class="text-sm text-dracula-muted text-center">Todavía no hay tickets.<br>Escaneá tu primero.</p>
          <NuxtLink to="/tickets/escanear" class="text-xs font-semibold text-dracula-purple">Escanear ahora →</NuxtLink>
        </div>

        <div v-else class="flex flex-col gap-2">
          <TicketsTicketRow
            v-for="ticket in recentTickets"
            :key="ticket.id"
            :ticket="ticket"
            compact
            @click="router.push(`/tickets/${ticket.id}`)"
          />
        </div>
      </div>

      <!-- Banner CTA escaneo -->
      <NuxtLink
        to="/tickets/escanear"
        class="flex items-center gap-4 rounded-3xl p-4 border border-dracula-green/30 transition-colors"
        style="background: rgba(80,250,123,0.08)"
      >
        <div class="w-11 h-11 rounded-2xl bg-dracula-green/20 flex items-center justify-center text-xl flex-shrink-0">
          📸
        </div>
        <div>
          <p class="text-sm font-semibold text-dracula-text">Escaneá un ticket</p>
          <p class="text-xs text-dracula-muted mt-0.5">La IA extrae los datos automáticamente</p>
        </div>
        <svg class="ml-auto text-dracula-green flex-shrink-0" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </NuxtLink>
    </div>
  </div>
</template>
