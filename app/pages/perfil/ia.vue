<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const confianzaMinima = ref(0.6)
const autoCategoria = ref(true)
const sugerirNotas = ref(true)

const labelConfianza = computed(() => {
  if (confianzaMinima.value < 0.5) return 'Baja — acepta más resultados, menos precisión'
  if (confianzaMinima.value < 0.8) return 'Media — balance entre velocidad y precisión'
  return 'Alta — solo resultados muy seguros'
})
</script>

<template>
  <div class="flex flex-col min-h-screen bg-[#282a36] pb-10">
    <!-- Header -->
    <div class="flex items-center gap-3 px-4 pt-12 pb-6">
      <button
        class="flex items-center justify-center w-10 h-10 rounded-2xl bg-[#383a4a] text-[#f8f8f2]"
        @click="navigateTo('/perfil')"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </button>
      <h1 class="text-lg font-bold text-[#f8f8f2]">Motor de IA</h1>
    </div>

    <div class="flex flex-col gap-4 px-4">
      <!-- Modelo -->
      <div class="bg-[#383a4a] rounded-3xl p-4 border border-[#6272a4]/10">
        <div class="flex items-center gap-3 mb-1">
          <span class="text-lg">🤖</span>
          <p class="text-sm font-semibold text-[#f8f8f2]">Modelo activo</p>
        </div>
        <p class="text-xs text-[#6272a4] pl-8">Gemini 2.0 Flash — Google AI</p>
        <div class="mt-2 pl-8">
          <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#50fa7b]/20 text-[#50fa7b]">Activo</span>
        </div>
      </div>

      <!-- Confianza mínima -->
      <div class="bg-[#383a4a] rounded-3xl p-4 border border-[#6272a4]/10">
        <p class="text-sm font-semibold text-[#f8f8f2] mb-1">Confianza mínima</p>
        <p class="text-xs text-[#6272a4] mb-4">{{ labelConfianza }}</p>
        <input
          v-model.number="confianzaMinima"
          type="range"
          min="0.3"
          max="0.95"
          step="0.05"
          class="w-full accent-[#bd93f9]"
        >
        <div class="flex justify-between mt-1">
          <span class="text-[10px] text-[#6272a4]">Baja</span>
          <span class="text-[10px] text-[#bd93f9] font-semibold">{{ Math.round(confianzaMinima * 100) }}%</span>
          <span class="text-[10px] text-[#6272a4]">Alta</span>
        </div>
      </div>

      <!-- Toggles -->
      <div class="bg-[#383a4a] rounded-3xl p-4 border border-[#6272a4]/10 flex flex-col gap-4">
        <!-- Auto categoría -->
        <div class="flex items-center justify-between gap-4" @click="autoCategoria = !autoCategoria">
          <div>
            <p class="text-sm font-medium text-[#f8f8f2]">Categoría automática</p>
            <p class="text-xs text-[#6272a4] mt-0.5">La IA asigna la categoría sin confirmación</p>
          </div>
          <div
            class="w-11 h-6 rounded-full transition-colors relative flex-shrink-0 cursor-pointer"
            :class="autoCategoria ? 'bg-[#bd93f9]' : 'bg-[#44475a]'"
          >
            <div
              class="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform"
              :class="autoCategoria ? 'translate-x-5' : 'translate-x-0.5'"
            />
          </div>
        </div>

        <div class="h-px bg-[#6272a4]/15" />

        <!-- Sugerir notas -->
        <div class="flex items-center justify-between gap-4" @click="sugerirNotas = !sugerirNotas">
          <div>
            <p class="text-sm font-medium text-[#f8f8f2]">Sugerir notas</p>
            <p class="text-xs text-[#6272a4] mt-0.5">La IA propone observaciones del ticket</p>
          </div>
          <div
            class="w-11 h-6 rounded-full transition-colors relative flex-shrink-0 cursor-pointer"
            :class="sugerirNotas ? 'bg-[#bd93f9]' : 'bg-[#44475a]'"
          >
            <div
              class="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform"
              :class="sugerirNotas ? 'translate-x-5' : 'translate-x-0.5'"
            />
          </div>
        </div>
      </div>

      <p class="text-center text-xs text-[#6272a4]/50 px-4">
        Las preferencias de IA se aplican localmente. La API de Gemini procesa las imágenes en los servidores de Google.
      </p>
    </div>
  </div>
</template>
