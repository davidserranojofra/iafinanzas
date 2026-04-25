<script setup lang="ts">
const route = useRoute()
const showNav = computed(() => route.path !== '/login')

const { $pwa } = useNuxtApp()
</script>

<template>
  <div class="min-h-screen bg-dracula-bg text-dracula-text font-sans">
    <VitePwaManifest />
    <NuxtPage />
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
