<script setup lang="ts">
const { isRefreshing, isOfflineData } = useTickets()
const { estadoRed } = useColaTickets()

// Se muestra solo si está refrescando de la red y el dispositivo tiene conexión a internet
const visible = computed(() => isRefreshing.value && estadoRed.value === 'online')

const mensaje = computed(() => {
  if (isOfflineData.value) {
    return 'Buscando actualizaciones…'
  }
  return 'Actualizando datos…'
})
</script>

<template>
  <Transition name="fade-down">
    <div
      v-if="visible"
      class="pointer-events-none fixed top-[max(0.75rem,env(safe-area-inset-top))] left-4 right-4 z-50 flex justify-center"
      role="status"
      aria-live="polite"
    >
      <div class="inline-flex max-w-sm items-center gap-2 rounded-full border border-dracula-cyan/25 bg-dracula-card2/95 px-3.5 py-2 text-xs font-medium text-dracula-text shadow-lg backdrop-blur-sm">
        <span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-dracula-cyan/12 text-dracula-cyan">
          <svg class="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="2" x2="12" y2="6" />
            <line x1="12" y1="18" x2="12" y2="22" />
            <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
            <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
            <line x1="2" y1="12" x2="6" y2="12" />
            <line x1="18" y1="12" x2="22" y2="12" />
            <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
            <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
          </svg>
        </span>

        <p class="truncate font-medium text-dracula-text/90">
          {{ mensaje }}
        </p>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.fade-down-enter-active,
.fade-down-leave-active {
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease;
}

.fade-down-enter-from,
.fade-down-leave-to {
  transform: translateY(-0.5rem);
  opacity: 0;
}
</style>
