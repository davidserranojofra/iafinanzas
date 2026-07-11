<script setup lang="ts">
const route = useRoute()
const showNav = computed(() => route.path !== '/login')
const { isAndroid, isIOS, showPrompt, installAndroid, dismiss } = usePwaInstaller()
</script>

<template>
  <ClientOnly>
    <Transition name="slide-up">
      <div
        v-if="showPrompt"
        class="fixed left-4 right-4 z-50 bg-dracula-card2 border border-dracula-muted/20 rounded-3xl p-5 shadow-2xl flex flex-col gap-4 max-w-sm mx-auto"
        :class="showNav ? 'bottom-24' : 'bottom-6'"
      >
        <!-- Header -->
        <div class="flex items-start justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl flex items-center justify-center bg-dracula-purple/10 text-xl">
              📲
            </div>
            <div>
              <h3 class="text-sm font-bold text-dracula-text">Instalar IAFinanzas</h3>
              <p class="text-xs text-dracula-muted">Tus finanzas, siempre contigo</p>
            </div>
          </div>
          <button
            aria-label="Cerrar aviso"
            class="w-8 h-8 rounded-full flex items-center justify-center hover:bg-dracula-card transition-colors text-dracula-muted"
            @click="dismiss"
          >
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <!-- Android Prompt -->
        <div v-if="isAndroid" class="flex flex-col gap-3">
          <p class="text-xs text-dracula-muted leading-relaxed">
            Instalá la app en tu teléfono Android para acceder rápido desde tu pantalla de inicio y utilizar el soporte offline.
          </p>
          <button
            class="w-full py-3 rounded-2xl text-xs font-bold text-white transition-opacity active:opacity-80 shadow-md"
            style="background: linear-gradient(135deg, #bd93f9, #ff79c6)"
            @click="installAndroid"
          >
            Instalar aplicación
          </button>
        </div>

        <!-- iOS Prompt -->
        <div v-else-if="isIOS" class="flex flex-col gap-3">
          <p class="text-xs text-dracula-muted leading-relaxed">
            Para instalar en tu iPhone:
          </p>
          <div class="flex flex-col gap-2 bg-dracula-bg/40 rounded-2xl p-3 border border-dracula-muted/5">
            <div class="flex items-center gap-2.5 text-xs text-dracula-text">
              <span class="w-5 h-5 rounded-full bg-dracula-muted/20 flex items-center justify-center font-bold text-[10px] shrink-0">1</span>
              <span>Pulsá el botón de compartir <span class="inline-block align-middle font-semibold text-dracula-purple">
                <svg aria-hidden="true" class="inline-block -mt-1" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>
                </svg>
              </span> en Safari.</span>
            </div>
            <div class="flex items-center gap-2.5 text-xs text-dracula-text">
              <span class="w-5 h-5 rounded-full bg-dracula-muted/20 flex items-center justify-center font-bold text-[10px] shrink-0">2</span>
              <span>Elegí <span class="font-semibold text-dracula-pink">"Añadir a la pantalla de inicio"</span>.</span>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </ClientOnly>
</template>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.4s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.3s ease;
}
.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(20px);
  opacity: 0;
}
</style>
