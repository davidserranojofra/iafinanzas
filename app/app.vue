<script setup lang="ts">
const route = useRoute()
const showNav = computed(() => route.path !== '/login')

const { $pwa } = useNuxtApp()

// Mapeo dinámico de Splash Screens para iPhones e iPads (iOS PWA)
const appleSplashSizes = [
  { w: 640,  h: 1136, scale: 2 },
  { w: 750,  h: 1334, scale: 2 },
  { w: 828,  h: 1792, scale: 2 },
  { w: 1080, h: 2340, scale: 3 },
  { w: 1125, h: 2436, scale: 3 },
  { w: 1170, h: 2532, scale: 3 },
  { w: 1179, h: 2556, scale: 3 },
  { w: 1206, h: 2622, scale: 3 },
  { w: 1242, h: 2208, scale: 3 },
  { w: 1242, h: 2688, scale: 3 },
  { w: 1284, h: 2778, scale: 3 },
  { w: 1290, h: 2796, scale: 3 },
  { w: 1320, h: 2868, scale: 3 },
  { w: 1488, h: 2266, scale: 2 },
  { w: 1536, h: 2048, scale: 2 },
  { w: 1620, h: 2160, scale: 2 },
  { w: 1668, h: 2224, scale: 2 },
  { w: 1668, h: 2388, scale: 2 },
  { w: 2048, h: 2732, scale: 2 },
  { w: 2064, h: 2752, scale: 2 },
]

const appleSplashLinks = appleSplashSizes.flatMap(({ w, h, scale }) => {
  const logicalW = w / scale
  const logicalH = h / scale
  
  return [
    {
      rel: 'apple-touch-startup-image',
      href: `/apple-splash-portrait-${w}x${h}.png`,
      media: `screen and (device-width: ${logicalW}px) and (device-height: ${logicalH}px) and (-webkit-device-pixel-ratio: ${scale}) and (orientation: portrait)`
    },
    {
      rel: 'apple-touch-startup-image',
      href: `/apple-splash-landscape-${h}x${w}.png`,
      media: `screen and (device-width: ${logicalW}px) and (device-height: ${logicalH}px) and (-webkit-device-pixel-ratio: ${scale}) and (orientation: landscape)`
    }
  ]
})

useHead({
  link: appleSplashLinks
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
