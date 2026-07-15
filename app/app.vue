<script setup lang="ts">
const route = useRoute()
const showNav = computed(() => {
  const publicPaths = ['/', '/login', '/confirm']
  return !publicPaths.includes(route.path)
})

const { $pwa } = useNuxtApp()

onMounted(() => {
  if (import.meta.client && $pwa) {
    // Verificar si hay actualizaciones cuando el usuario vuelve a enfocar la app
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        navigator.serviceWorker.getRegistration().then((reg) => {
          reg?.update()
        })
      }
    })
  }
})
</script>

<template>
  <div class="min-h-screen bg-dracula-bg text-dracula-text font-sans">
    <NuxtPwaAssets />
    <VitePwaManifest />
    <NuxtPage />
    <ClientOnly>
      <LayoutAvisoOffline />
    </ClientOnly>
    <ClientOnly>
      <LayoutActualizadorDatos />
    </ClientOnly>
    <ClientOnly>
      <LayoutEstadoColaTickets />
    </ClientOnly>
    <LayoutBottomNav v-if="showNav" />
    <LayoutAddTicketSheet />

    <Transition name="slide-up">
      <div
        v-if="$pwa?.needRefresh"
        class="fixed bottom-24 left-4 right-4 z-50 flex items-center justify-between gap-3 rounded-2xl bg-dracula-card px-4 py-3 shadow-xl"
      >
        <span class="text-sm text-dracula-text">Nueva versión disponible</span>
        <button
          class="rounded-xl bg-dracula-purple px-4 py-1.5 text-sm font-medium text-dracula-bg"
          @click="$pwa?.updateServiceWorker()"
        >
          Actualizar
        </button>
      </div>
    </Transition>
  </div>
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
