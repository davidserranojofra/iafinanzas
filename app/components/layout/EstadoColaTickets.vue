<script setup lang="ts">
const {
  estadoRed,
  ticketsPendientes,
  lecturasPendientes,
  sincronizandoCola,
  mensajeCola,
  limpiarMensajeCola,
  sincronizarCola,
  vaciarCola,
} = useColaTickets()

const route = useRoute()

const rutaVisible = computed(() => route.path !== '/login')

// --- Barra de estado superior (mensajeCola) ---

const barraVisible = computed(() => rutaVisible.value && Boolean(mensajeCola.value))

const barraClases = computed(() => {
  switch (mensajeCola.value?.tipo) {
    case 'progreso': return 'text-dracula-cyan'
    case 'exito': return 'text-dracula-green'
    case 'info': return 'text-dracula-purple'
    case 'error': return 'text-dracula-red'
    default: return ''
  }
})

let autoHideTimer: ReturnType<typeof setTimeout> | null = null

function limpiarAutoHideTimer() {
  if (autoHideTimer) {
    clearTimeout(autoHideTimer)
    autoHideTimer = null
  }
}

watch(mensajeCola, (nuevo) => {
  limpiarAutoHideTimer()
  if (!nuevo) return

  if (nuevo.tipo === 'exito') {
    autoHideTimer = setTimeout(() => limpiarMensajeCola(), 3000)
  } else if (nuevo.tipo === 'info') {
    autoHideTimer = setTimeout(() => limpiarMensajeCola(), 4000)
  }
})

// --- Chip contador de pendientes ---

const totalPendientes = computed(() => ticketsPendientes.value + (lecturasPendientes.value ?? 0))
const chipVisible = computed(() => rutaVisible.value && totalPendientes.value > 0)

const expandido = ref(false)
const chipRef = ref<HTMLElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)

// Desplazamiento vertical del chip: se coloca justo debajo de la barra de estado
// cuando esta está visible, o justo debajo del safe-area cuando no hay barra.
const chipOffsetPx = computed(() => (barraVisible.value ? 44 : 12))
const chipEstilo = computed(() => ({
  top: `calc(env(safe-area-inset-top) + ${chipOffsetPx.value}px)`,
}))
const panelEstilo = computed(() => ({
  top: `calc(env(safe-area-inset-top) + ${chipOffsetPx.value + 56}px)`,
}))

function alternarExpandido() {
  expandido.value = !expandido.value
}

function manejarClickFuera(event: MouseEvent) {
  const objetivo = event.target as Node
  if (chipRef.value?.contains(objetivo)) return
  if (panelRef.value?.contains(objetivo)) return
  expandido.value = false
}

watch(expandido, (abierto) => {
  if (!import.meta.client) return
  if (abierto) {
    document.addEventListener('click', manejarClickFuera)
  } else {
    document.removeEventListener('click', manejarClickFuera)
  }
})

watch(chipVisible, (visible) => {
  if (!visible) expandido.value = false
})

onUnmounted(() => {
  limpiarAutoHideTimer()
  if (import.meta.client) {
    document.removeEventListener('click', manejarClickFuera)
  }
})

const descripcion = computed(() => {
  const totalOffline = ticketsPendientes.value + (lecturasPendientes.value ?? 0)

  if (estadoRed.value === 'offline' && totalOffline > 0) {
    let msg = `Sin conexión. Tenés `
    const partes = []
    if (ticketsPendientes.value > 0) {
      partes.push(`${ticketsPendientes.value} ticket${ticketsPendientes.value === 1 ? '' : 's'}`)
    }
    if ((lecturasPendientes.value ?? 0) > 0) {
      partes.push(`${lecturasPendientes.value} foto${lecturasPendientes.value === 1 ? '' : 's'} de ticket`)
    }
    msg += partes.join(' y ') + ' esperando sincronización.'
    return msg
  }

  if (estadoRed.value === 'offline') {
    return 'Sin conexión. Los tickets nuevos se van a guardar localmente.'
  }

  if (totalOffline > 0) {
    let msg = `Hay `
    const partes = []
    if (ticketsPendientes.value > 0) {
      partes.push(`${ticketsPendientes.value} ticket${ticketsPendientes.value === 1 ? '' : 's'}`)
    }
    if ((lecturasPendientes.value ?? 0) > 0) {
      partes.push(`${lecturasPendientes.value} foto${lecturasPendientes.value === 1 ? '' : 's'} por procesar con IA`)
    }
    msg += partes.join(' y ') + ' pendiente de sincronización.'
    return msg
  }

  return 'Todo sincronizado.'
})

function handleDescartar() {
  if (confirm('¿Estás seguro de que quieres borrar todos los tickets y fotos de la cola offline? Estos cambios se perderán.')) {
    void vaciarCola()
  }
  expandido.value = false
}
</script>

<template>
  <Transition name="slide-down">
    <div
      v-if="barraVisible"
      :role="mensajeCola?.tipo === 'error' ? 'alert' : 'status'"
      :aria-live="mensajeCola?.tipo === 'error' ? 'assertive' : 'polite'"
      class="fixed top-0 inset-x-0 z-[60] overflow-hidden bg-dracula-card2/95 backdrop-blur-sm shadow-lg"
      :class="barraClases"
      style="padding-top: env(safe-area-inset-top);"
    >
      <div class="relative flex min-h-[32px] items-center gap-2 px-4 py-1.5">
        <span class="flex h-4 w-4 shrink-0 items-center justify-center">
          <span v-if="mensajeCola?.tipo === 'progreso'" class="spinner-mini" aria-hidden="true" />
          <svg v-else-if="mensajeCola?.tipo === 'exito'" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
          <svg v-else-if="mensajeCola?.tipo === 'info'" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="16" x2="12" y2="12"/>
            <line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
          <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </span>

        <p
          class="min-w-0 flex-1 text-xs font-medium text-dracula-text"
          :class="mensajeCola?.tipo === 'error' ? 'line-clamp-3' : 'truncate'"
        >
          {{ mensajeCola?.texto }}
        </p>

        <button
          v-if="mensajeCola?.tipo === 'error'"
          class="flex h-11 w-11 shrink-0 -my-3 -mr-2 items-center justify-center rounded-xl text-dracula-red/80 transition-colors hover:bg-dracula-red/10"
          aria-label="Cerrar aviso"
          @click="limpiarMensajeCola"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 6L6 18"/>
            <path d="M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <div v-if="mensajeCola?.tipo === 'progreso'" class="absolute inset-x-0 bottom-0 h-0.5 overflow-hidden bg-dracula-cyan/20">
        <div class="cola-barra-indeterminada h-full w-1/3 bg-dracula-cyan" />
      </div>
    </div>
  </Transition>

  <button
    v-if="chipVisible"
    ref="chipRef"
    type="button"
    class="fixed right-4 z-50 flex h-11 min-w-[44px] items-center gap-1.5 rounded-full border border-dracula-cyan/30 bg-dracula-card2 px-3 text-xs font-semibold text-dracula-cyan shadow-lg"
    :style="chipEstilo"
    :aria-expanded="expandido"
    aria-label="Ver cola de sincronización pendiente"
    @click="alternarExpandido"
  >
    <span v-if="sincronizandoCola" class="spinner-mini" aria-hidden="true" />
    <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M20 16.58A5 5 0 0018 7h-1.26A8 8 0 104 16.25"/>
      <path d="M8 16l4 4 4-4"/>
      <path d="M12 12v8"/>
    </svg>
    <span>{{ totalPendientes }}</span>
  </button>

  <Transition name="panel-expandir">
    <div
      v-if="chipVisible && expandido"
      ref="panelRef"
      class="fixed right-4 z-50 w-[calc(100vw-2rem)] max-w-xs rounded-2xl border border-dracula-cyan/20 bg-dracula-card2 px-4 py-3 shadow-xl"
      :style="panelEstilo"
    >
      <p class="text-xs leading-5 text-dracula-text">
        {{ descripcion }}
      </p>

      <div class="mt-3 flex items-center gap-2">
        <button
          v-if="estadoRed === 'online'"
          class="min-h-[44px] rounded-xl bg-dracula-cyan px-3 py-2 text-xs font-semibold text-dracula-bg transition-opacity disabled:opacity-50"
          :disabled="sincronizandoCola"
          @click="sincronizarCola"
        >
          {{ sincronizandoCola ? 'Sincronizando...' : 'Sincronizar ahora' }}
        </button>
        <button
          class="min-h-[44px] rounded-xl bg-dracula-red/20 border border-dracula-red/35 px-3 py-2 text-xs font-semibold text-dracula-red transition-opacity disabled:opacity-50"
          :disabled="sincronizandoCola"
          @click="handleDescartar"
        >
          Descartar cola
        </button>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}

.panel-expandir-enter-active,
.panel-expandir-leave-active {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.panel-expandir-enter-from,
.panel-expandir-leave-to {
  transform: translateY(-8px);
  opacity: 0;
}

.spinner-mini {
  width: 12px;
  height: 12px;
  border-radius: 9999px;
  border: 2px solid currentColor;
  border-top-color: transparent;
  animation: girar-spinner-mini 0.6s linear infinite;
}

@keyframes girar-spinner-mini {
  to {
    transform: rotate(360deg);
  }
}

.cola-barra-indeterminada {
  animation: mover-barra-indeterminada 1.2s ease-in-out infinite;
}

@keyframes mover-barra-indeterminada {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(300%);
  }
}
</style>
