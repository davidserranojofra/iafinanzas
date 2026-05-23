<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const confianzaMinima = ref(0.6)
const autoCategoria = ref(true)
const sugerirNotas = ref(true)
const modeloActivo = ref('meta-llama/llama-4-scout-17b-16e-instruct')

const modelos = [
  { id: 'meta-llama/llama-4-scout-17b-16e-instruct', name: 'Llama 4 Scout (17B)', provider: 'Groq — Optimizado Vision' },
  { id: 'llama-3.2-11b-vision-preview', name: 'Llama 3.2 Vision (11B)', provider: 'Groq — Súper veloz' },
  { id: 'llama-3.2-90b-vision-preview', name: 'Llama 3.2 Vision (90B)', provider: 'Groq — Máxima precisión' }
]

const labelConfianza = computed(() => {
  if (confianzaMinima.value < 0.5) return 'Baja — acepta más resultados, menos precisión'
  if (confianzaMinima.value < 0.8) return 'Media — balance entre velocidad y precisión'
  return 'Alta — solo resultados muy seguros'
})

onMounted(() => {
  if (import.meta.client) {
    const savedConfianza = localStorage.getItem('ia_min_confidence')
    if (savedConfianza !== null) confianzaMinima.value = parseFloat(savedConfianza)

    const savedAuto = localStorage.getItem('ia_auto_categoria')
    if (savedAuto !== null) autoCategoria.value = savedAuto === 'true'

    const savedNotas = localStorage.getItem('ia_sugerir_notas')
    if (savedNotas !== null) sugerirNotas.value = savedNotas === 'true'

    const savedModel = localStorage.getItem('ia_model')
    if (savedModel !== null) modeloActivo.value = savedModel
  }
})

watch(confianzaMinima, (val) => {
  if (import.meta.client) {
    localStorage.setItem('ia_min_confidence', String(val))
  }
})

watch(autoCategoria, (val) => {
  if (import.meta.client) {
    localStorage.setItem('ia_auto_categoria', String(val))
  }
})

watch(sugerirNotas, (val) => {
  if (import.meta.client) {
    localStorage.setItem('ia_sugerir_notas', String(val))
  }
})

watch(modeloActivo, (val) => {
  if (import.meta.client) {
    localStorage.setItem('ia_model', val)
  }
})
</script>

<template>
  <div class="flex flex-col min-h-screen bg-dracula-bg pb-10">
    <div class="flex items-center gap-3 px-4 pt-12 pb-6">
      <button
        class="flex items-center justify-center w-10 h-10 rounded-2xl bg-dracula-card2 text-dracula-text"
        @click="navigateTo('/perfil')"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </button>
      <h1 class="text-lg font-bold text-dracula-text">Motor de IA</h1>
    </div>

    <div class="flex flex-col gap-4 px-4">
      <!-- Modelo -->
      <div class="bg-dracula-card2 rounded-3xl p-4 border border-dracula-muted/10">
        <div class="flex items-center gap-3 mb-3">
          <span class="text-lg">🤖</span>
          <p class="text-sm font-semibold text-dracula-text">Modelo activo</p>
        </div>
        <div class="flex flex-col gap-2 pl-2">
          <div
            v-for="m in modelos"
            :key="m.id"
            class="flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all"
            :class="modeloActivo === m.id 
              ? 'bg-dracula-purple/10 border-dracula-purple text-dracula-text' 
              : 'bg-dracula-card/30 border-transparent text-dracula-muted hover:bg-dracula-card/55'"
            @click="modeloActivo = m.id"
          >
            <div>
              <p class="text-xs font-semibold" :class="modeloActivo === m.id ? 'text-dracula-purple' : 'text-dracula-text'">{{ m.name }}</p>
              <p class="text-[10px] mt-0.5 opacity-80">{{ m.provider }}</p>
            </div>
            <div 
              class="w-4 h-4 rounded-full border flex items-center justify-center"
              :class="modeloActivo === m.id ? 'border-dracula-purple bg-dracula-purple' : 'border-dracula-muted'"
            >
              <div v-if="modeloActivo === m.id" class="w-1.5 h-1.5 rounded-full bg-dracula-bg" />
            </div>
          </div>
        </div>
      </div>

      <!-- Confianza mínima -->
      <div class="bg-dracula-card2 rounded-3xl p-4 border border-dracula-muted/10">
        <p class="text-sm font-semibold text-dracula-text mb-1">Confianza mínima</p>
        <p class="text-xs text-dracula-muted mb-4">{{ labelConfianza }}</p>
        <input
          v-model.number="confianzaMinima"
          type="range"
          min="0.3"
          max="0.95"
          step="0.05"
          class="w-full accent-dracula-purple"
        >
        <div class="flex justify-between mt-1">
          <span class="text-[10px] text-dracula-muted">Baja</span>
          <span class="text-[10px] text-dracula-purple font-semibold">{{ Math.round(confianzaMinima * 100) }}%</span>
          <span class="text-[10px] text-dracula-muted">Alta</span>
        </div>
      </div>

      <!-- Toggles -->
      <div class="bg-dracula-card2 rounded-3xl p-4 border border-dracula-muted/10 flex flex-col gap-4">
        <div class="flex items-center justify-between gap-4 cursor-pointer" @click="autoCategoria = !autoCategoria">
          <div>
            <p class="text-sm font-medium text-dracula-text">Categoría automática</p>
            <p class="text-xs text-dracula-muted mt-0.5">La IA asigna la categoría sin confirmación</p>
          </div>
          <div
            class="w-11 h-6 rounded-full transition-colors relative flex-shrink-0"
            :class="autoCategoria ? 'bg-dracula-purple' : 'bg-dracula-card'"
          >
            <div
              class="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform"
              :class="autoCategoria ? 'translate-x-5' : 'translate-x-0.5'"
            />
          </div>
        </div>

        <div class="h-px bg-dracula-muted/15" />

        <div class="flex items-center justify-between gap-4 cursor-pointer" @click="sugerirNotas = !sugerirNotas">
          <div>
            <p class="text-sm font-medium text-dracula-text">Sugerir notas</p>
            <p class="text-xs text-dracula-muted mt-0.5">La IA propone observaciones del ticket</p>
          </div>
          <div
            class="w-11 h-6 rounded-full transition-colors relative flex-shrink-0"
            :class="sugerirNotas ? 'bg-dracula-purple' : 'bg-dracula-card'"
          >
            <div
              class="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform"
              :class="sugerirNotas ? 'translate-x-5' : 'translate-x-0.5'"
            />
          </div>
        </div>
      </div>

      <p class="text-center text-xs text-dracula-muted/50 px-4">
        Las preferencias de IA se aplican localmente. Las imágenes se procesan de forma segura en los servidores correspondientes.
      </p>
    </div>
  </div>
</template>
