<script setup lang="ts">
const { estadoRed, ticketsPendientes, lecturasPendientes } = useColaTickets()

const visible = computed(() => estadoRed.value === 'offline')

const descripcion = computed(() => {
  const total = ticketsPendientes.value + (lecturasPendientes?.value ?? 0)
  if (total > 0) {
    return `${total} cambio${total === 1 ? '' : 's'} guardado${total === 1 ? '' : 's'} en cola`
  }

  return 'Modo offline activo'
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
      <div class="inline-flex max-w-sm items-center gap-2 rounded-full border border-dracula-yellow/25 bg-dracula-card2/95 px-3 py-2 text-xs font-medium text-dracula-text shadow-lg backdrop-blur-sm">
        <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-dracula-yellow/12 text-dracula-yellow">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M2 8.82a15 15 0 0 1 20 0" />
            <path d="M5 12.86a10 10 0 0 1 14 0" />
            <path d="M8.5 16.43a5 5 0 0 1 7 0" />
            <path d="M12 20h.01" />
            <path d="M2 2l20 20" />
          </svg>
        </span>

        <p class="truncate">
          <span class="font-semibold text-dracula-yellow">Sin conexión</span>
          <span class="text-dracula-text/80"> · {{ descripcion }}</span>
        </p>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.fade-down-enter-active,
.fade-down-leave-active {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.fade-down-enter-from,
.fade-down-leave-to {
  transform: translateY(-0.5rem);
  opacity: 0;
}
</style>
