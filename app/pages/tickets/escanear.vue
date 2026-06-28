<script setup lang="ts">
import type { CreateTicketDto } from '~/types'
import { eliminarLecturaPendiente, listarLecturasPendientes } from '~/composables/useColaLecturasDb'

definePageMeta({ middleware: 'auth' })

const { phase, progress, result, errorMsg, extract, reset } = useAIExtraction()
const { createTicket } = useTickets()
const { encolarTicket, estadoRed, actualizarTicketsPendientes } = useColaTickets()
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const route = useRoute()

const fileInput = useTemplateRef<HTMLInputElement>('fileInput')
const preview = ref<string | null>(null)
const saving = ref(false)
const saveError = ref<string | null>(null)
const selectedFile = ref<File | null>(null)

const pendingFile = useState<File | null>('pending-scan-file', () => null)

const showConfirmation = ref(false)
const autoCategoria = ref(true)
const confianzaMinima = ref(0.6)
const sugerirNotas = ref(true)

const categorias: CreateTicketDto['categoria'][] = [
  'Alimentación', 'Transporte', 'Ropa', 'Restaurantes',
  'Suscripciones', 'Salud', 'Hogar', 'Ocio', 'Tecnología', 'Cuidado Personal', 'Otro',
]

const TODOS_LOS_METODOS = ['Efectivo', 'Tarjeta débito', 'Tarjeta crédito', 'Transferencia', 'Otro']
const metodos = ref<string[]>([])
type PerfilMetodos = { metodos_pago?: string[] | null }

const { pending: loadingMetodos } = useAsyncData(
  'metodos-pago-escanear',
  async () => {
    if (!user.value) return null
    const { data, error } = await supabase
      .from('profiles')
      .select('metodos_pago')
      .single()
    if (error) return null
    return data
  },
  {
    watch: [user],
    transform: (data) => {
      const activos = (data as PerfilMetodos | null)?.metodos_pago
      metodos.value = activos?.length ? activos : TODOS_LOS_METODOS
      return data
    },
  },
)

onMounted(async () => {
  if (import.meta.client) {
    const savedAuto = localStorage.getItem('ia_auto_categoria')
    if (savedAuto !== null) autoCategoria.value = savedAuto === 'true'

    const savedConfianza = localStorage.getItem('ia_min_confidence')
    if (savedConfianza !== null) confianzaMinima.value = parseFloat(savedConfianza)

    const savedNotas = localStorage.getItem('ia_sugerir_notas')
    if (savedNotas !== null) sugerirNotas.value = savedNotas === 'true'
  }

  const fromOfflineId = route.query.from_offline_id as string | undefined
  if (fromOfflineId) {
    const lecturas = await listarLecturasPendientes()
    const lectura = lecturas.find(l => l.id === fromOfflineId)
    if (lectura) {
      selectedFile.value = lectura.file as File
      preview.value = URL.createObjectURL(lectura.file)
      extract(lectura.file as File)
    }
    return
  }

  if (pendingFile.value) {
    const file = pendingFile.value
    pendingFile.value = null
    
    if (estadoRed.value === 'offline') {
      if (user.value?.id) {
        saving.value = true
        try {
          await encolarLectura(file, user.value.id)
          await navigateTo('/tickets', { replace: true })
        } catch (err) {
          console.error('[escanear] Error encolando lectura offline en onMounted:', err)
        } finally {
          saving.value = false
        }
      }
      return
    }

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
    notas:      sugerirNotas.value ? (r.notas ?? '') : '',
  }
})

watch(phase, (p) => {
  if (p === 'done') {
    const confidenceOk = (result.value?.confianza ?? 0.85) >= confianzaMinima.value
    if (autoCategoria.value && confidenceOk) {
      save()
    } else {
      showConfirmation.value = true
    }
  }
})

function handleReset() {
  showConfirmation.value = false
  reset()
}


async function onFileSelected(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return

  if (estadoRed.value === 'offline') {
    if (!user.value?.id) return
    saving.value = true
    try {
      await encolarLectura(file, user.value.id)
      await navigateTo('/tickets', { replace: true })
    } catch (err) {
      console.error('[escanear] Error encolando lectura offline en onFileSelected:', err)
      saveError.value = 'No se pudo guardar la imagen localmente sin conexión.'
    } finally {
      saving.value = false
    }
    return
  }

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

  const id = crypto.randomUUID()
  let imageUrl: string | undefined

  try {
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
      id,
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

    if (route.query.from_offline_id) {
      await eliminarLecturaPendiente(String(route.query.from_offline_id))
      await actualizarTicketsPendientes()
    }

    await navigateTo(`/tickets/${ticket.id}`, { replace: true })
  } catch (e: unknown) {
    if (esErrorDeRed(e) || estadoRed.value === 'offline') {
      await encolarTicket({
        id,
        comercio:       form.value.comercio,
        fecha:          form.value.fecha,
        total:          form.value.total,
        iva:            result.value.iva,
        categoria:      form.value.categoria,
        metodoPago:     form.value.metodoPago || undefined,
        notas:          form.value.notas || undefined,
        imageUrl:       imageUrl,
        items:          result.value.items,
        extractedByAI:  true,
        aiConfidence:   result.value.confianza,
      }, id)
      await navigateTo('/tickets', { replace: true })
      return
    }

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
        @click="phase === 'idle' ? navigateTo('/tickets') : handleReset()"
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
        class="w-full aspect-3/4 max-h-80 rounded-3xl border-2 border-dashed border-dracula-muted/40 flex flex-col items-center justify-center gap-4 cursor-pointer transition-colors hover:border-dracula-purple/60 hover:bg-dracula-purple/5"
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
      <div class="relative w-full aspect-3/4 max-h-80 rounded-3xl overflow-hidden bg-dracula-bg2">
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

    <!-- DONE & NEED CONFIRMATION -->
    <div v-else-if="phase === 'done' && showConfirmation && !saving" class="flex flex-col gap-4 px-4 pt-2 overflow-y-auto pb-16">
      <div v-if="result && result.confianza < confianzaMinima" class="p-4 bg-dracula-yellow/10 border border-dracula-yellow/20 text-dracula-yellow rounded-2xl text-xs flex items-start gap-3">
        <span class="text-base mt-0.5">⚠️</span>
        <div>
          <p class="font-semibold">Baja confianza en la extracción</p>
          <p class="opacity-80 mt-0.5">La confianza calculada ({{ Math.round(result.confianza * 100) }}%) es menor a tu umbral configurado ({{ Math.round(confianzaMinima * 100) }}%). Por favor, verificá los datos extraídos.</p>
        </div>
      </div>
      <div v-else class="p-4 bg-dracula-purple/10 border border-dracula-purple/20 text-dracula-purple rounded-2xl text-xs flex items-start gap-3">
        <span class="text-base mt-0.5">ℹ️</span>
        <div>
          <p class="font-semibold">Confirmación de datos</p>
          <p class="opacity-80 mt-0.5">Por favor, confirmá la información extraída por la IA antes de guardarla.</p>
        </div>
      </div>

      <div class="flex flex-col gap-4">
        <!-- Comercio -->
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold uppercase tracking-wider text-dracula-muted">Comercio</label>
          <input
            v-model="form.comercio"
            type="text"
            class="w-full bg-dracula-card2 rounded-2xl px-4 py-3.5 text-sm text-dracula-text border border-dracula-muted/20 focus:border-dracula-purple focus:outline-none transition-colors"
          >
        </div>

        <!-- Fecha -->
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold uppercase tracking-wider text-dracula-muted">Fecha</label>
          <input
            v-model="form.fecha"
            type="date"
            class="w-full bg-dracula-card2 rounded-2xl px-4 py-3.5 text-sm text-dracula-text border border-dracula-muted/20 focus:border-dracula-purple focus:outline-none transition-colors"
          >
        </div>

        <!-- Total -->
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold uppercase tracking-wider text-dracula-muted">Total</label>
          <div class="relative">
            <span class="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-dracula-muted">€</span>
            <input
              v-model="form.total"
              type="number"
              step="0.01"
              class="w-full bg-dracula-card2 rounded-2xl pl-9 pr-4 py-3.5 text-sm text-dracula-text border border-dracula-muted/20 focus:border-dracula-purple focus:outline-none transition-colors"
            >
          </div>
        </div>

        <!-- Categoría -->
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold uppercase tracking-wider text-dracula-muted">Categoría</label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="cat in categorias"
              :key="cat"
              type="button"
              class="px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
              :class="form.categoria === cat
                ? 'bg-dracula-purple text-dracula-bg'
                : 'bg-dracula-card text-dracula-muted hover:text-dracula-text'"
              @click="form.categoria = cat"
            >
              {{ cat }}
            </button>
          </div>
        </div>

        <!-- Método de pago -->
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold uppercase tracking-wider text-dracula-muted">Método de pago</label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="m in metodos"
              :key="m"
              type="button"
              class="px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
              :class="form.metodoPago === m
                ? 'bg-dracula-muted text-dracula-text'
                : 'bg-dracula-card text-dracula-muted hover:text-dracula-text'"
              @click="form.metodoPago = form.metodoPago === m ? '' : m"
            >
              {{ m }}
            </button>
          </div>
        </div>

        <!-- Notas -->
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold uppercase tracking-wider text-dracula-muted">Notas</label>
          <textarea
            v-model="form.notas"
            rows="3"
            class="w-full bg-dracula-card2 rounded-2xl px-4 py-3.5 text-sm text-dracula-text border border-dracula-muted/20 focus:border-dracula-purple focus:outline-none transition-colors resize-none"
          />
        </div>

        <button
          class="w-full py-4 rounded-2xl text-sm font-semibold text-white transition-opacity mt-4"
          style="background: linear-gradient(135deg, #bd93f9, #ff79c6)"
          @click="save"
        >
          Confirmar y Guardar
        </button>
        <button
          class="text-sm text-dracula-muted text-center"
          @click="handleReset()"
        >
          Descartar y Escanear otro
        </button>
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
      <button class="text-sm text-dracula-muted" @click="handleReset()">Escanear de nuevo</button>
    </div>

    <!-- EXTRACTION ERROR -->
    <div v-else-if="phase === 'error'" class="flex flex-col items-center gap-4 px-4 pt-8">
      <div class="w-16 h-16 rounded-2xl bg-dracula-red/15 flex items-center justify-center text-3xl">❌</div>
      <p class="text-sm text-dracula-red text-center">{{ errorMsg }}</p>
      <button
        class="px-6 py-3 rounded-2xl text-sm font-semibold text-white"
        style="background: linear-gradient(135deg, #bd93f9, #ff79c6)"
        @click="handleReset()"
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
