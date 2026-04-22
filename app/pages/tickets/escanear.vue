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

// Campos editables tras la extracción
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

function onFileSelected(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  preview.value = URL.createObjectURL(file)
  extract(file)
}

function openPicker(capture?: boolean) {
  if (!fileInput.value) return
  fileInput.value.setAttribute('capture', capture ? 'environment' : '')
  fileInput.value.click()
}

async function confirm() {
  if (!result.value) return
  saving.value = true
  try {
    // Subir imagen a Supabase Storage si hay preview
    let imageUrl: string | undefined
    const file = fileInput.value?.files?.[0]
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
    alert(e instanceof Error ? e.message : 'Error al guardar el ticket.')
  } finally {
    saving.value = false
  }
}

// Campos visibles en la fase "done" — aparecen uno a uno
const visibleFields = ref(0)
watch(phase, (p) => {
  if (p !== 'done') return
  visibleFields.value = 0
  const interval = setInterval(() => {
    visibleFields.value++
    if (visibleFields.value >= 6) clearInterval(interval)
  }, 180)
})

const fields = computed(() => [
  { label: 'Comercio',   value: form.value.comercio },
  { label: 'Fecha',      value: form.value.fecha },
  { label: 'Total',      value: `${form.value.total.toFixed(2)} €` },
  { label: 'Categoría',  value: form.value.categoria },
  { label: 'Método',     value: form.value.metodoPago || '—' },
  { label: 'Notas',      value: form.value.notas || '—' },
])
</script>

<template>
  <div class="flex flex-col min-h-screen bg-[#282a36] pb-8">
    <!-- Header -->
    <div class="flex items-center justify-between px-4 pt-12 pb-4">
      <button
        class="flex items-center justify-center w-10 h-10 rounded-2xl bg-[#383a4a] text-[#f8f8f2]"
        @click="phase === 'idle' ? navigateTo('/tickets/nuevo') : reset()"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </button>
      <h1 class="text-base font-semibold text-[#f8f8f2]">Escanear ticket</h1>
      <div class="w-10" />
    </div>

    <!-- Input oculto -->
    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      class="hidden"
      @change="onFileSelected"
    >

    <!-- ── FASE: IDLE ── -->
    <div v-if="phase === 'idle'" class="flex flex-col items-center gap-6 px-4 pt-4">
      <!-- Zona de upload -->
      <div
        class="w-full aspect-[3/4] max-h-80 rounded-3xl border-2 border-dashed border-[#6272a4]/40 flex flex-col items-center justify-center gap-4 cursor-pointer transition-colors hover:border-[#bd93f9]/60 hover:bg-[#bd93f9]/5"
        @click="openPicker(false)"
      >
        <div class="w-16 h-16 rounded-2xl bg-[#383a4a] flex items-center justify-center text-3xl">🧾</div>
        <div class="text-center">
          <p class="text-sm font-semibold text-[#f8f8f2]">Subir imagen</p>
          <p class="text-xs text-[#6272a4] mt-1">JPG, PNG o HEIC</p>
        </div>
      </div>

      <!-- Botón cámara -->
      <button
        class="w-full flex items-center justify-center gap-3 py-4 rounded-2xl text-sm font-semibold text-[#282a36] transition-opacity active:opacity-80"
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

    <!-- ── FASE: EXTRACTING ── -->
    <div v-else-if="phase === 'extracting'" class="flex flex-col items-center gap-6 px-4 pt-4">
      <!-- Preview con scan-line -->
      <div class="relative w-full aspect-[3/4] max-h-80 rounded-3xl overflow-hidden bg-[#1e2030]">
        <img v-if="preview" :src="preview" class="w-full h-full object-cover opacity-40" alt="Ticket">

        <!-- Guías de esquina -->
        <div class="absolute inset-4 pointer-events-none">
          <div class="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#50fa7b] rounded-tl-lg" />
          <div class="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#50fa7b] rounded-tr-lg" />
          <div class="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[#50fa7b] rounded-bl-lg" />
          <div class="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#50fa7b] rounded-br-lg" />
        </div>

        <!-- Scan-line -->
        <div class="scan-line absolute left-4 right-4 h-0.5 bg-[#50fa7b] shadow-[0_0_12px_#50fa7b]" />
      </div>

      <!-- Progress -->
      <div class="w-full">
        <div class="flex justify-between text-xs text-[#6272a4] mb-2">
          <span>Analizando con IA...</span>
          <span>{{ progress }}%</span>
        </div>
        <div class="h-1.5 bg-[#44475a] rounded-full overflow-hidden">
          <div
            class="h-full bg-[#50fa7b] rounded-full transition-all duration-300"
            :style="{ width: `${progress}%` }"
          />
        </div>
      </div>
    </div>

    <!-- ── FASE: ERROR ── -->
    <div v-else-if="phase === 'error'" class="flex flex-col items-center gap-4 px-4 pt-8">
      <div class="w-16 h-16 rounded-2xl bg-[#ff5555]/15 flex items-center justify-center text-3xl">❌</div>
      <p class="text-sm text-[#ff5555] text-center">{{ errorMsg }}</p>
      <button
        class="px-6 py-3 rounded-2xl text-sm font-semibold text-[#282a36]"
        style="background: linear-gradient(135deg, #bd93f9, #ff79c6)"
        @click="reset"
      >
        Intentar de nuevo
      </button>
    </div>

    <!-- ── FASE: DONE ── -->
    <div v-else-if="phase === 'done'" class="flex flex-col gap-4 px-4 pt-2">
      <!-- Header resultado -->
      <div class="flex items-center gap-3 p-4 rounded-2xl bg-[#50fa7b]/10 border border-[#50fa7b]/25">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#50fa7b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        <p class="text-sm font-semibold text-[#50fa7b]">Datos extraídos correctamente</p>
      </div>

      <!-- Campos extraídos (aparecen uno a uno) -->
      <div class="bg-[#383a4a] rounded-2xl border border-[#6272a4]/10 overflow-hidden">
        <div
          v-for="(field, i) in fields"
          :key="field.label"
          class="flex justify-between items-center px-4 py-3 border-b border-[#6272a4]/10 last:border-0 transition-all duration-300"
          :class="i < visibleFields ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'"
        >
          <span class="text-xs font-semibold uppercase tracking-wider text-[#6272a4]">{{ field.label }}</span>
          <span class="text-sm text-[#f8f8f2] font-medium text-right max-w-[60%] truncate">{{ field.value }}</span>
        </div>
      </div>

      <!-- Aviso edición -->
      <p class="text-xs text-[#6272a4] text-center">
        ¿Algo no está bien?
        <NuxtLink to="/tickets/manual" class="text-[#bd93f9] font-semibold">Editá manualmente</NuxtLink>
      </p>

      <!-- Botones -->
      <div class="flex flex-col gap-3 mt-2">
        <button
          :disabled="saving"
          class="w-full py-4 rounded-2xl text-sm font-semibold text-[#282a36] transition-opacity disabled:opacity-60"
          style="background: linear-gradient(135deg, #bd93f9, #ff79c6)"
          @click="confirm"
        >
          {{ saving ? 'Guardando...' : 'Confirmar y guardar' }}
        </button>
        <button
          class="w-full py-3 rounded-2xl text-sm font-medium text-[#6272a4] bg-[#383a4a]"
          @click="reset"
        >
          Escanear otro
        </button>
      </div>
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
