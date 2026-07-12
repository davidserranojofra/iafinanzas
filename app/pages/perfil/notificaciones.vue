<script setup lang="ts">
import type { TicketCategoria } from '~/types'

definePageMeta({ middleware: 'auth' })

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const runtimeConfig = useRuntimeConfig()

const habilitarNotificaciones = ref(false)
const intervaloDias = ref(7)
const tipoResumen = ref<'total' | 'categorias'>('total')
const categoriasSeleccionadas = ref<Record<string, boolean>>({
  'Alimentación': true,
  'Transporte': true,
  'Ropa': true,
  'Restaurantes': true,
  'Suscripciones': true,
  'Salud': true,
  'Hogar': true,
  'Ocio': true,
  'Tecnología': true,
  'Cuidado Personal': true,
  'Otro': true,
})

const categorias: TicketCategoria[] = [
  'Alimentación', 'Transporte', 'Ropa', 'Restaurantes',
  'Suscripciones', 'Salud', 'Hogar', 'Ocio', 'Tecnología', 'Cuidado Personal', 'Otro',
]

const presetsIntervalo = [
  { label: 'Diario', value: 1 },
  { label: 'Cada 3 días', value: 3 },
  { label: 'Semanal', value: 7 },
  { label: 'Quincenal', value: 15 },
  { label: 'Mensual', value: 30 },
]

const esIOS = ref(false)
const esStandalone = ref(false)
const cargando = ref(true)
const guardando = ref(false)
const errorMsg = ref<string | null>(null)

// Convertidor de base64 VAPID para el navegador
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

// Cargar configuración inicial desde Supabase
onMounted(async () => {
  if (import.meta.client) {
    esIOS.value = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    esStandalone.value = window.matchMedia('(display-mode: standalone)').matches
  }

  try {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return

    const { data: perfil, error } = await supabase
      .from('profiles')
      .select('notif_enabled, notif_interval_days, notif_summary_type, notif_categories')
      .single()

    if (error) throw error

    if (perfil) {
      habilitarNotificaciones.value = perfil.notif_enabled
      intervaloDias.value = perfil.notif_interval_days
      tipoResumen.value = (perfil.notif_summary_type as 'total' | 'categorias') || 'total'
      if (perfil.notif_categories) {
        categoriasSeleccionadas.value = {
          ...categoriasSeleccionadas.value,
          ...perfil.notif_categories
        }
      }
    }
  } catch (err: any) {
    console.error('Error cargando configuración:', err.message)
    errorMsg.value = 'No se pudo cargar la configuración desde el servidor.'
  } finally {
    await nextTick()
    cargando.value = false
  }
})

// Solicitar permisos y registrar Web Push
async function activarWebPush() {
  if (!import.meta.client || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    throw new Error('Tu navegador o dispositivo no soporta notificaciones Web Push.')
  }

  // 1. Pedir permiso al sistema operativo
  const permiso = await Notification.requestPermission()
  if (permiso !== 'granted') {
    throw new Error('Permiso de notificaciones denegado. Habilitalo en los ajustes de tu navegador.')
  }

  // 2. Obtener el service worker listo
  const registration = await navigator.serviceWorker.ready

  // 3. Suscribirse a push
  const vapidPublicKey = runtimeConfig.public.vapidPublicKey
  if (!vapidPublicKey) {
    throw new Error('La clave pública VAPID no está disponible en la app.')
  }

  const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey)

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey
  })

  // 4. Guardar suscripción en Supabase a través del endpoint Nuxt API
  await $fetch('/api/notifications/subscribe', {
    method: 'POST',
    body: { subscription }
  })
}

// Dar de baja el Web Push
async function desactivarWebPush() {
  if (!import.meta.client || !('serviceWorker' in navigator)) return

  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.getSubscription()

  if (subscription) {
    // 1. Desuscribir en el navegador
    await subscription.unsubscribe()

    // 2. Borrar de la base de datos a través del endpoint
    await $fetch('/api/notifications/unsubscribe', {
      method: 'POST',
      body: { subscription }
    })
  }
}

// Guardar cambios en Supabase con debounce o guardado explícito reactivo
let saveTimeout: ReturnType<typeof setTimeout>
function guardarConfiguracion() {
  if (cargando.value) return

  clearTimeout(saveTimeout)
  guardando.value = true

  saveTimeout = setTimeout(async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) throw new Error('No autenticado')

      const { error } = await supabase
        .from('profiles')
        .update({
          notif_enabled: habilitarNotificaciones.value,
          notif_interval_days: intervaloDias.value,
          notif_summary_type: tipoResumen.value,
          notif_categories: categoriasSeleccionadas.value
        })
        .eq('id', authUser.id)

      if (error) throw error
    } catch (err: any) {
      console.error('Error al guardar ajustes:', err.message)
      errorMsg.value = 'Error al sincronizar los ajustes en el servidor.'
    } finally {
      guardando.value = false
    }
  }, 800)
}

// Manejar cambios en el interruptor principal
async function toggleNotificaciones() {
  errorMsg.value = null
  const nuevoEstado = !habilitarNotificaciones.value
  cargando.value = true

  try {
    if (nuevoEstado) {
      await activarWebPush()
      habilitarNotificaciones.value = true
    } else {
      await desactivarWebPush()
      habilitarNotificaciones.value = false
    }
    // Guardar estado en Supabase inmediatamente
    guardarConfiguracion()
  } catch (err: any) {
    console.error('Error al cambiar notificaciones:', err.message)
    errorMsg.value = err.message || 'No se pudo configurar la suscripción de alertas.'
  } finally {
    cargando.value = false
  }
}

// Watchers para guardar automáticamente cualquier cambio secundario
watch(intervaloDias, () => guardarConfiguracion())
watch(tipoResumen, () => guardarConfiguracion())
watch(categoriasSeleccionadas, () => guardarConfiguracion(), { deep: true })

function toggleCategoria(cat: string) {
  categoriasSeleccionadas.value[cat] = !categoriasSeleccionadas.value[cat]
  guardarConfiguracion()
}
</script>

<template>
  <div class="flex flex-col min-h-screen bg-dracula-bg pb-10">
    <!-- Header -->
    <div class="flex items-center gap-3 px-4 pt-12 pb-6">
      <button class="flex items-center justify-center w-10 h-10 rounded-2xl bg-dracula-card2 text-dracula-text"
        @click="navigateTo('/perfil')">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
      <h1 class="text-lg font-bold text-dracula-text flex items-center gap-2">
        Notificaciones
        <span v-if="guardando"
          class="text-[10px] bg-dracula-purple/20 text-dracula-purple font-semibold px-2 py-0.5 rounded-md animate-pulse">Guardando...</span>
      </h1>
    </div>

    <!-- Cargando Skeleton -->
    <div v-if="cargando" class="flex flex-col gap-4 px-4">
      <div class="h-20 bg-dracula-card2/50 rounded-3xl animate-pulse" />
      <div class="h-32 bg-dracula-card2/50 rounded-3xl animate-pulse" />
      <div class="h-40 bg-dracula-card2/50 rounded-3xl animate-pulse" />
    </div>

    <div v-else class="flex flex-col gap-4 px-4">
      <!-- Error Banner -->
      <div v-if="errorMsg"
        class="bg-dracula-red/10 border border-dracula-red/25 text-dracula-red p-4 rounded-3xl text-xs flex items-start gap-3">
        <span class="text-sm mt-0.5">⚠️</span>
        <p class="font-medium flex-1">{{ errorMsg }}</p>
      </div>

      <!-- iOS Standalone Alert -->
      <div v-if="esIOS && !esStandalone"
        class="bg-dracula-orange/10 border border-dracula-orange/25 text-dracula-orange p-4 rounded-3xl text-xs flex items-start gap-3">
        <span class="text-sm mt-0.5">💡</span>
        <div>
          <p class="font-semibold">Instalación requerida en iOS</p>
          <p class="opacity-80 mt-0.5">Para recibir alertas en tu iPhone/iPad, tienes que agregar esta app a inicio
            ("Compartir" -> "Agregar a pantalla de inicio") y abrirla desde ahí.</p>
        </div>
      </div>

      <!-- Activar Notificaciones -->
      <div
        class="bg-dracula-card2 rounded-3xl p-4 border border-dracula-muted/10 flex items-center justify-between gap-4 cursor-pointer"
        @click="toggleNotificaciones">
        <div class="flex items-center gap-3">
          <span class="text-lg">🔔</span>
          <div>
            <p class="text-sm font-semibold text-dracula-text">Alertas de resumen de gastos</p>
            <p class="text-xs text-dracula-muted mt-0.5">Recibir informes periódicos sobre tus consumos</p>
          </div>
        </div>
        <div class="w-11 h-6 rounded-full transition-colors relative shrink-0"
          :class="habilitarNotificaciones ? 'bg-dracula-purple' : 'bg-dracula-card'">
          <div class="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform"
            :class="habilitarNotificaciones ? 'translate-x-5' : 'translate-x-0.5'" />
        </div>
      </div>

      <!-- Configuración Expandible -->
      <Transition name="fade-slide">
        <div v-if="habilitarNotificaciones" class="flex flex-col gap-4">
          <!-- Intervalo de tiempo -->
          <div class="bg-dracula-card2 rounded-3xl p-4 border border-dracula-muted/10">
            <p class="text-sm font-semibold text-dracula-text mb-1">¿Cada cuántos días quieres el resumen?</p>
            <p class="text-xs text-dracula-muted mb-4">La alerta recopilará las compras realizadas en este intervalo</p>

            <div class="flex flex-wrap gap-2">
              <button v-for="p in presetsIntervalo" :key="p.value" type="button"
                class="px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer" :class="intervaloDias === p.value
                  ? 'bg-dracula-purple/10 border-dracula-purple text-dracula-purple'
                  : 'bg-dracula-card/30 border-transparent text-dracula-muted hover:bg-dracula-card/50'"
                @click="intervaloDias = p.value">
                {{ p.label }}
              </button>
            </div>

            <!-- Custom Days input -->
            <div class="mt-4 flex items-center gap-3 pl-1">
              <span class="text-xs text-dracula-muted">Configuración personalizada:</span>
              <div class="relative flex items-center">
                <input v-model.number="intervaloDias" type="number" min="1" max="90"
                  class="w-20 bg-dracula-card rounded-xl px-3 py-1.5 text-xs text-center text-dracula-text focus:outline-none focus:ring-1 focus:ring-dracula-purple border border-transparent">
                <span class="text-xs text-dracula-muted ml-2">días</span>
              </div>
            </div>
          </div>

          <!-- Tipo de Resumen -->
          <div class="bg-dracula-card2 rounded-3xl p-4 border border-dracula-muted/10">
            <p class="text-sm font-semibold text-dracula-text mb-1">Tipo de información a incluir</p>
            <p class="text-xs text-dracula-muted mb-4">Elegí la profundidad y las categorías de tu informe</p>

            <div class="grid grid-cols-2 gap-3">
              <div class="flex flex-col gap-1.5 p-3 rounded-2xl border cursor-pointer transition-all" :class="tipoResumen === 'total'
                ? 'bg-dracula-purple/10 border-dracula-purple text-dracula-text'
                : 'bg-dracula-card/30 border-transparent text-dracula-muted hover:bg-dracula-card/50'"
                @click="tipoResumen = 'total'">
                <div class="flex items-center justify-between">
                  <p class="text-xs font-semibold"
                    :class="tipoResumen === 'total' ? 'text-dracula-purple' : 'text-dracula-text'">Solo Total</p>
                  <div class="w-3.5 h-3.5 rounded-full border flex items-center justify-center"
                    :class="tipoResumen === 'total' ? 'border-dracula-purple bg-dracula-purple' : 'border-dracula-muted'">
                    <div v-if="tipoResumen === 'total'" class="w-1 h-1 rounded-full bg-dracula-bg" />
                  </div>
                </div>
                <p class="text-[10px] opacity-75 leading-relaxed">Recibir un aviso corto únicamente con el importe
                  acumulado global.</p>
              </div>

              <div class="flex flex-col gap-1.5 p-3 rounded-2xl border cursor-pointer transition-all" :class="tipoResumen === 'categorias'
                ? 'bg-dracula-purple/10 border-dracula-purple text-dracula-text'
                : 'bg-dracula-card/30 border-transparent text-dracula-muted hover:bg-dracula-card/50'"
                @click="tipoResumen = 'categorias'">
                <div class="flex items-center justify-between">
                  <p class="text-xs font-semibold"
                    :class="tipoResumen === 'categorias' ? 'text-dracula-purple' : 'text-dracula-text'">Por Categorías
                  </p>
                  <div class="w-3.5 h-3.5 rounded-full border flex items-center justify-center"
                    :class="tipoResumen === 'categorias' ? 'border-dracula-purple bg-dracula-purple' : 'border-dracula-muted'">
                    <div v-if="tipoResumen === 'categorias'" class="w-1 h-1 rounded-full bg-dracula-bg" />
                  </div>
                </div>
                <p class="text-[10px] opacity-75 leading-relaxed">Desglosar el resumen para ver importes según tus
                  consumos de interés.</p>
              </div>
            </div>
          </div>

          <!-- Filtro de Categorías -->
          <Transition name="fade-slide">
            <div v-if="tipoResumen === 'categorias'"
              class="bg-dracula-card2 rounded-3xl p-4 border border-dracula-muted/10">
              <p class="text-sm font-semibold text-dracula-text mb-1">Categorías activas en el resumen</p>
              <p class="text-xs text-dracula-muted mb-4">Seleccionar cuáles quieres auditar periódicamente</p>

              <div class="flex flex-wrap gap-2">
                <button v-for="cat in categorias" :key="cat" type="button"
                  class="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer"
                  :class="categoriasSeleccionadas[cat]
                    ? 'bg-dracula-purple/15 border-dracula-purple text-dracula-purple shadow-sm'
                    : 'bg-dracula-card/25 border-transparent text-dracula-muted hover:bg-dracula-card/45'"
                  @click="toggleCategoria(cat)">
                  <span>{{ cat }}</span>
                  <span v-if="categoriasSeleccionadas[cat]" class="text-[10px] text-dracula-purple">✓</span>
                  <span v-else class="text-[10px] opacity-20">○</span>
                </button>
              </div>
            </div>
          </Transition>
        </div>
      </Transition>

      <p class="text-center text-xs text-dracula-muted/50 px-4 mt-2 mb-12">
        Las alertas periódicas y resúmenes de notificaciones se procesan a nivel de servidor de forma segura.
      </p>

    </div>
  </div>
</template>

<style scoped>
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
