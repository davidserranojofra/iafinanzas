<script setup lang="ts">
import type { Ticket } from '~/types'

const props = defineProps<{
  ticket: Ticket
  compact?: boolean
}>()

const emit = defineEmits<{
  click: [ticket: Ticket]
}>()

const { getCategoryColor, getCategoryBg, getCategoryIcon } = useCategories()

const color = computed(() => getCategoryColor(props.ticket.categoria))
const bg    = computed(() => getCategoryBg(props.ticket.categoria))
const icon  = computed(() => getCategoryIcon(props.ticket.categoria))

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
    <div class="flex items-center justify-center w-10 h-10 rounded-xl text-lg flex-shrink-0" :style="{ background: bg }">
      {{ icon }}
    </div>

    <!-- Info -->
    <div class="flex-1 min-w-0">
      <p class="text-sm font-semibold text-dracula-text truncate">{{ ticket.comercio }}</p>
      <div class="flex items-center gap-2 mt-0.5">
        <span class="text-xs font-medium px-2 py-0.5 rounded-full" :style="{ color, background: bg }">
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
