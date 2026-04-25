<script setup lang="ts">
const show = useState('show-nuevo-sheet', () => false)

function close() {
  show.value = false
}

function goTo(path: string) {
  show.value = false
  navigateTo(path)
}
</script>

<template>
  <Teleport to="body">
    <Transition name="overlay">
      <div v-if="show" class="fixed inset-0 z-40 bg-black/60" @click="close" />
    </Transition>

    <Transition name="sheet">
      <div
        v-if="show"
        class="fixed bottom-0 left-0 right-0 z-50 bg-dracula-card2 rounded-t-3xl px-4 pt-5 pb-10 border-t border-dracula-muted/20"
      >
        <div class="w-10 h-1 rounded-full bg-dracula-muted/40 mx-auto mb-6" />

        <h2 class="text-lg font-bold text-dracula-text mb-2">Añadir ticket</h2>
        <p class="text-sm text-dracula-muted mb-6">¿Cómo querés registrarlo?</p>

        <div class="flex flex-col gap-3">
          <button
            class="flex items-center gap-4 p-4 rounded-2xl border w-full text-left transition-colors active:opacity-80"
            style="background: rgba(80,250,123,0.08); border-color: rgba(80,250,123,0.3)"
            @click="goTo('/tickets/escanear')"
          >
            <div class="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0" style="background: rgba(80,250,123,0.15)">
              📸
            </div>
            <div class="flex-1">
              <div class="flex items-center gap-2">
                <p class="text-sm font-semibold text-dracula-text">Escanear con IA</p>
                <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-dracula-green/20 text-dracula-green">RECOMENDADO</span>
              </div>
              <p class="text-xs text-dracula-muted mt-0.5">Sacá una foto y la IA extrae los datos automáticamente</p>
            </div>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-dracula-green flex-shrink-0">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>

          <button
            class="flex items-center gap-4 p-4 rounded-2xl bg-dracula-card border border-dracula-muted/20 w-full text-left transition-colors active:opacity-80"
            @click="goTo('/tickets/manual')"
          >
            <div class="w-12 h-12 rounded-2xl bg-dracula-muted/15 flex items-center justify-center text-2xl flex-shrink-0">
              ✏️
            </div>
            <div class="flex-1">
              <p class="text-sm font-semibold text-dracula-text">Formulario manual</p>
              <p class="text-xs text-dracula-muted mt-0.5">Ingresá los datos a mano</p>
            </div>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-dracula-muted flex-shrink-0">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.overlay-enter-active,
.overlay-leave-active {
  transition: opacity 0.3s ease;
}
.overlay-enter-from,
.overlay-leave-to {
  opacity: 0;
}

.sheet-enter-active {
  transition: transform 0.38s cubic-bezier(0.32, 0.72, 0, 1);
}
.sheet-leave-active {
  transition: transform 0.28s cubic-bezier(0.4, 0, 1, 1);
}
.sheet-enter-from,
.sheet-leave-to {
  transform: translateY(100%);
}
</style>
