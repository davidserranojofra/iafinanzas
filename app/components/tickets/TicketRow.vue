<script setup lang="ts">
import type { Ticket } from '~/types'

const props = defineProps<{
  ticket: Ticket
  compact?: boolean
}>()

const emit = defineEmits<{
  click: [ticket: Ticket]
}>()

const categoryColors: Record<string, string> = {
  Alimentación: '#50fa7b',
  Transporte:   '#8be9fd',
  Ropa:         '#ff79c6',
  Restaurantes: '#ffb86c',
  Suscripciones:'#bd93f9',
  Salud:        '#ff5555',
  Hogar:        '#f1fa8c',
  Ocio:         '#bd93f9',
  Tecnología:   '#8be9fd',
  Otro:         '#6272a4',
}

const categoryIcons: Record<string, string> = {
  Alimentación:  '🛒',
  Transporte:    '🚗',
  Ropa:          '👗',
  Restaurantes:  '🍽️',
  Suscripciones: '📺',
  Salud:         '💊',
  Hogar:         '🏠',
  Ocio:          '🎮',
  Tecnología:    '💻',
  Otro:          '📄',
}

const color = computed(() => categoryColors[props.ticket.categoria] ?? '#6272a4')
const icon = computed(() => categoryIcons[props.ticket.categoria] ?? '📄')

const formattedDate = computed(() => {
  return new Date(props.ticket.fecha).toLocaleDateString('es-ES', {
    day: 'numeric', month: 'short',
  })
})
</script>

<template>
  <button
    class="w-full flex items-center gap-3 px-4 rounded-2xl bg-dracula-card2 border border-dracula-muted/10 transition-colors hover:border-dracula-muted/30 active:bg-dracula-card text-left"
    :class="compact ? 'py-3' : 'py-3.5'"
    @click="emit('click', ticket)"
  >
    <!-- Icono categoría -->
    <div class="flex items-center justify-center w-10 h-10 rounded-xl text-lg flex-shrink-0" :style="{ background: color + '20' }">
      {{ icon }}
    </div>

    <!-- Info -->
    <div class="flex-1 min-w-0">
      <p class="text-sm font-semibold text-dracula-text truncate">{{ ticket.comercio }}</p>
      <div class="flex items-center gap-2 mt-0.5">
        <span class="text-xs font-medium px-2 py-0.5 rounded-full" :style="{ color, background: color + '20' }">
          {{ ticket.categoria }}
        </span>
        <span class="text-xs text-dracula-muted">{{ formattedDate }}</span>
      </div>
    </div>

    <!-- Total -->
    <div class="flex flex-col items-end flex-shrink-0">
      <span class="text-sm font-bold text-dracula-text">{{ ticket.total.toFixed(2) }} €</span>
      <span v-if="ticket.extractedByAI" class="text-xs text-dracula-green mt-0.5">IA ✓</span>
    </div>
  </button>
</template>
