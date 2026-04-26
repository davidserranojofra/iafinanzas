<script setup lang="ts">
import type { CreateTicketDto } from '~/types'

definePageMeta({ middleware: 'auth' })

const { phase, progress, result, errorMsg, extract, reset } = useAIExtraction()
const { createTicket } = useTickets()
const supabase = useSupabaseClient()
const user = useSupabaseUser()

const fileInput = useTemplateRef<HTMLInputElement>('fileInput')
const preview = ref<string | null>(null)
const saving = ref(false)
const saveError = ref<string | null>(null)
const selectedFile = ref<File | null>(null)

const pendingFile = useState<File | null>('pending-scan-file', () => null)

onMounted(() => {
  if (pendingFile.value) {
    const file = pendingFile.value
    pendingFile.value = null
    selectedFile.value = file
    preview.value = URL.createObjectURL(file)
    extract(file)
  }
})

const form = ref({
  comercio: '', fecha: '', total: 0,
  categoria: 'Otro' as CreateTicketDto['categoria'],
  metodoPago: '', notas: '',
})

watch(result, (r) => {
  if (!r) return
  form.value = {
    comercio:   r.comercio,
    fecha:      r.fecha,
    total:      r.total,
    categoria:  r.categoria,
    metodoPago: r.metodoPago ?? '',
    notas:      r.notas ?? '',
  }
})

watch(phase, (p) => {
  if (p === 'done') save()
})

function onFileSelected(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  selectedFile.value = file
  preview.value = URL.createObjectURL(file)
  extract(file)
}

function openPicker(capture?: boolean) {
  if (!fileInput.value) return
  fileInput.value.setAttribute('capture', capture ? 'environment' : '')
  fileInput.value.click()
}

async function save() {
  if (!result.value) return
  saving.value = true
  saveError.value = null
  try {
    let imageUrl: string | undefined
    const file = selectedFile.value ?? fileInput.value?.files?.[0]
    if (file && user.value) {
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `${user.value.id}/${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('tickets').upload(path, file)
      if (!error) {
        const { data } = supabase.storage.from('tickets').getPublicUrl(path)
        imageUrl = data.publicUrl
      }
    }

    const ticket = await createTicket({
      comercio:       form.value.comercio,
      fecha:          form.value.fecha,
      total:          form.value.total,
      iva:            result.value.iva,
      categoria:      form.value.categoria,
      metodoPago:     form.value.metodoPago || undefined,
      notas:          form.value.notas || undefined,
      imageUrl,
      items:          result.value.items,
      extractedByAI:  true,
      aiConfidence:   result.value.confianza,
    })

    await navigateTo(`/tickets/${ticket.id}`, { replace: true })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Error al guardar el ticket.'
    console.error('[escanear] save error:', msg)
    saveError.value = msg
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="flex flex-col min-h-screen bg-dracula-bg pb-8">
    <div class="flex items-center justify-between px-4 pt-12 pb-4">
      <button
        class="flex items-center justify-center w-10 h-10 rounded-2xl bg-dracula-card2 text-dracula-text"
        @click="phase === 'idle' ? navigateTo('/tickets') : reset()"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </button>
      <h1 class="text-base font-semibold text-dracula-text">Escanear ticket</h1>
      <div class="w-10" />
    </div>

    <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onFileSelected">

    <!-- IDLE -->
    <div v-if="phase === 'idle'" class="flex flex-col items-center gap-6 px-4 pt-4">
      <div
        class="w-full aspect-[3/4] max-h-80 rounded-3xl border-2 border-dashed border-dracula-muted/40 flex flex-col items-center justify-center gap-4 cursor-pointer transition-colors hover:border-dracula-purple/60 hover:bg-dracula-purple/5"
        @click="openPicker(false)"
      >
        <div class="w-16 h-16 rounded-2xl bg-dracula-card2 flex items-center justify-center text-3xl">🧾</div>
        <div class="text-center">
          <p class="text-sm font-semibold text-dracula-text">Subir imagen</p>
          <p class="text-xs text-dracula-muted mt-1">JPG, PNG o HEIC</p>
        </div>
      </div>

      <button
        class="w-full flex items-center justify-center gap-3 py-4 rounded-2xl text-sm font-semibold text-white transition-opacity active:opacity-80"
        style="background: linear-gradient(135deg, #bd93f9, #ff79c6)"
        @click="openPicker(true)"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
          <circle cx="12" cy="13" r="4"/>
        </svg>
        Abrir cámara
      </button>
    </div>

    <!-- SCANNING / SAVING -->
    <div v-else-if="phase === 'extracting' || (phase === 'done' && saving)" class="flex flex-col items-center gap-6 px-4 pt-4">
      <div class="relative w-full aspect-[3/4] max-h-80 rounded-3xl overflow-hidden bg-dracula-bg2">
        <img v-if="preview" :src="preview" class="w-full h-full object-cover opacity-40" alt="Ticket">

        <div class="absolute inset-4 pointer-events-none">
          <div class="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-dracula-green rounded-tl-lg" />
          <div class="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-dracula-green rounded-tr-lg" />
          <div class="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-dracula-green rounded-bl-lg" />
          <div class="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-dracula-green rounded-br-lg" />
        </div>

        <div class="scan-line absolute left-4 right-4 h-0.5 bg-dracula-green shadow-[0_0_12px_#50fa7b]" />
      </div>

      <div class="w-full">
        <div class="flex justify-between text-xs text-dracula-muted mb-2">
          <span>{{ saving ? 'Guardando...' : 'Analizando con IA...' }}</span>
          <span>{{ saving ? '100' : progress }}%</span>
        </div>
        <div class="h-1.5 bg-dracula-card rounded-full overflow-hidden">
          <div
            class="h-full bg-dracula-green rounded-full transition-all duration-300"
            :class="saving ? 'animate-pulse' : ''"
            :style="{ width: saving ? '100%' : `${progress}%` }"
          />
        </div>
      </div>
    </div>

    <!-- SAVE ERROR -->
    <div v-else-if="phase === 'done' && saveError" class="flex flex-col items-center gap-4 px-4 pt-8">
      <div class="w-16 h-16 rounded-2xl bg-dracula-red/15 flex items-center justify-center text-3xl">❌</div>
      <p class="text-sm text-dracula-red text-center">{{ saveError }}</p>
      <button
        class="px-6 py-3 rounded-2xl text-sm font-semibold text-white"
        style="background: linear-gradient(135deg, #bd93f9, #ff79c6)"
        @click="save"
      >
        Reintentar
      </button>
      <button class="text-sm text-dracula-muted" @click="reset">Escanear de nuevo</button>
    </div>

    <!-- EXTRACTION ERROR -->
    <div v-else-if="phase === 'error'" class="flex flex-col items-center gap-4 px-4 pt-8">
      <div class="w-16 h-16 rounded-2xl bg-dracula-red/15 flex items-center justify-center text-3xl">❌</div>
      <p class="text-sm text-dracula-red text-center">{{ errorMsg }}</p>
      <button
        class="px-6 py-3 rounded-2xl text-sm font-semibold text-white"
        style="background: linear-gradient(135deg, #bd93f9, #ff79c6)"
        @click="reset"
      >
        Intentar de nuevo
      </button>
    </div>
  </div>
</template>

<style scoped>
.scan-line {
  animation: scan 2s ease-in-out infinite;
  top: 10%;
}

@keyframes scan {
  0%   { top: 10%; opacity: 1; }
  45%  { top: 85%; opacity: 1; }
  50%  { top: 85%; opacity: 0; }
  51%  { top: 10%; opacity: 0; }
  55%  { top: 10%; opacity: 1; }
  100% { top: 10%; opacity: 1; }
}
</style>
