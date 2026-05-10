<script setup lang="ts">
const {
  estadoRed,
  ticketsPendientes,
  sincronizandoCola,
  mensajeCola,
  limpiarMensajeCola,
  sincronizarCola,
} = useColaTickets()

const route = useRoute()

const visible = computed(() =>
  route.path !== '/login' && (
    ticketsPendientes.value > 0
    || Boolean(mensajeCola.value)
  ),
)

const descripcion = computed(() => {
  if (mensajeCola.value) return mensajeCola.value

  if (estadoRed.value === 'offline' && ticketsPendientes.value > 0) {
    return `Sin conexión. Tenés ${ticketsPendientes.value} ticket${ticketsPendientes.value === 1 ? '' : 's'} esperando sincronización.`
  }

  if (estadoRed.value === 'offline') {
    return 'Sin conexión. Los tickets nuevos se van a guardar localmente.'
  }

  return `Hay ${ticketsPendientes.value} ticket${ticketsPendientes.value === 1 ? '' : 's'} pendiente${ticketsPendientes.value === 1 ? '' : 's'} de sincronización.`
})
</script>

<template>
  <Transition name="slide-up">
    <div
      v-if="visible"
      class="fixed bottom-40 left-4 right-4 z-50 rounded-2xl border border-dracula-cyan/20 bg-dracula-card2 px-4 py-3 shadow-xl"
    >
      <div class="flex items-start gap-3">
        <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-dracula-cyan/10 text-dracula-cyan">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 16.58A5 5 0 0018 7h-1.26A8 8 0 104 16.25"/>
            <path d="M8 16l4 4 4-4"/>
            <path d="M12 12v8"/>
          </svg>
        </div>

        <div class="min-w-0 flex-1">
          <p class="text-sm font-semibold text-dracula-cyan">Cola offline activa</p>
          <p class="mt-1 text-xs leading-5 text-dracula-text">
            {{ descripcion }}
          </p>

          <div v-if="estadoRed === 'online' && ticketsPendientes > 0" class="mt-3">
            <button
              class="min-h-[44px] rounded-xl bg-dracula-cyan px-3 py-2 text-xs font-semibold text-dracula-bg transition-opacity disabled:opacity-50"
              :disabled="sincronizandoCola"
              @click="sincronizarCola"
            >
              {{ sincronizandoCola ? 'Sincronizando...' : 'Sincronizar ahora' }}
            </button>
          </div>
        </div>

        <button
          v-if="mensajeCola"
          class="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-dracula-muted transition-colors hover:bg-dracula-card"
          @click="limpiarMensajeCola"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 6L6 18"/>
            <path d="M6 6l12 12"/>
          </svg>
        </button>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
</style>
