<script setup lang="ts">
definePageMeta({
  middleware: [
    async (to) => {
      if (to.query.code) {
        return navigateTo({ path: '/confirm', query: { code: to.query.code } }, { replace: true })
      }
      const user = useSupabaseUser()
      let sessionExists = false
      if (!user.value) {
        const supabase = useSupabaseClient()
        const { data } = await supabase.auth.getSession()
        if (data?.session) {
          sessionExists = true
        }
      } else {
        sessionExists = true
      }
      if (sessionExists) {
        return navigateTo('/dashboard', { replace: true })
      }
    },
  ],
})

const config = useRuntimeConfig()

// Simulador de escaneo
type MockTicket = {
  comercio: string
  fecha: string
  total: number
  categoria: string
  confianza: number
  items: { nombre: string; precio: number; cantidad: number }[]
  color: string
}

const mockTickets: MockTicket[] = [
  {
    comercio: 'La Parrilla del Puerto',
    fecha: '2026-07-14',
    total: 45.50,
    categoria: 'Restaurantes',
    confianza: 0.98,
    items: [
      { nombre: 'Menú del día', precio: 15.00, cantidad: 2 },
      { nombre: 'Bebidas', precio: 2.50, cantidad: 2 },
      { nombre: 'Postre especial', precio: 10.50, cantidad: 1 }
    ],
    color: 'from-dracula-yellow/20 to-dracula-yellow/5'
  },
  {
    comercio: 'Supermercado El Sol',
    fecha: '2026-07-15',
    total: 28.30,
    categoria: 'Alimentación',
    confianza: 0.95,
    items: [
      { nombre: 'Leche entera 6L', precio: 6.80, cantidad: 1 },
      { nombre: 'Manzanas 1.5kg', precio: 3.50, cantidad: 1 },
      { nombre: 'Café en grano premium', precio: 18.00, cantidad: 1 }
    ],
    color: 'from-dracula-purple/20 to-dracula-purple/5'
  },
  {
    comercio: 'ByteStore Central',
    fecha: '2026-07-12',
    total: 189.99,
    categoria: 'Tecnología',
    confianza: 0.99,
    items: [
      { nombre: 'Auriculares Inalámbricos Pro', precio: 150.00, cantidad: 1 },
      { nombre: 'Cable USB-C trenzado 2m', precio: 19.99, cantidad: 2 }
    ],
    color: 'from-dracula-cyan/20 to-dracula-cyan/5'
  }
]

const selectedIndex = ref(0)
const scanState = ref<'idle' | 'scanning' | 'done'>('idle')
const progress = ref(0)
let intervalId: any = null

function startScan() {
  if (scanState.value === 'scanning') return
  scanState.value = 'scanning'
  progress.value = 0

  intervalId = setInterval(() => {
    if (progress.value < 100) {
      progress.value += 5
    } else {
      clearInterval(intervalId)
      scanState.value = 'done'
    }
  }, 100)
}

function selectTicket(index: number) {
  selectedIndex.value = index
  scanState.value = 'idle'
  progress.value = 0
  if (intervalId) clearInterval(intervalId)
}

onUnmounted(() => {
  if (intervalId) clearInterval(intervalId)
})
</script>

<template>
  <div class="min-h-screen bg-dracula-bg text-dracula-text selection:bg-dracula-purple/30 overflow-x-hidden">
    <!-- Navbar -->
    <header
      class="fixed top-0 left-0 right-0 z-50 bg-dracula-bg/85 backdrop-blur-md border-b border-dracula-card/30 px-6 py-4">
      <div class="max-w-6xl mx-auto flex items-center justify-between">
        <div class="flex items-center gap-3">
          <img src="/icono.png" alt="Logo IAFinanzas" class="w-10 h-10 rounded-xl shadow-md object-contain" />
          <span
            class="text-xl font-bold tracking-tight bg-gradient-to-r from-dracula-purple to-dracula-pink bg-clip-text text-transparent">
            IA Finanzas
          </span>
        </div>
        <NuxtLink to="/login"
          class="inline-flex items-center justify-center h-10 px-5 font-medium rounded-xl text-dracula-bg bg-gradient-to-r from-dracula-purple to-dracula-pink hover:opacity-90 active:scale-95 transition-all duration-200 shadow-md cursor-pointer">
          Iniciar sesión
        </NuxtLink>
      </div>
    </header>

    <!-- Hero Section -->
    <section class="relative pt-32 pb-20 px-6 md:pt-40 md:pb-28">
      <!-- Glow decoration -->
      <div
        class="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] md:w-[600px] h-[350px] md:h-[600px] rounded-full bg-dracula-purple/10 blur-[80px] md:blur-[120px] pointer-events-none" />

      <div class="max-w-4xl mx-auto text-center space-y-8 relative z-10">
        <div
          class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-dracula-card/50 border border-dracula-purple/20 text-dracula-purple text-xs font-semibold uppercase tracking-wider">
          <span class="w-2 h-2 rounded-full bg-dracula-purple animate-pulse" />
          Revolucionando tus finanzas
        </div>
        <h2 class="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
          Digitalizá tus tickets en segundos con <br class="hidden md:inline" />
          <span
            class="bg-gradient-to-r from-dracula-purple via-dracula-pink to-dracula-cyan bg-clip-text text-transparent">
            Inteligencia Artificial
          </span>
        </h2>
        <p class="text-dracula-muted text-base md:text-xl max-w-2xl mx-auto leading-relaxed">
          Subí una foto o escaneá tus comprobantes físicos. Nuestra IA de visión procesa y categoriza los gastos al
          instante. Sin fricción, de forma segura y 100% offline-first.
        </p>
        <div class="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
          <NuxtLink to="/login"
            class="w-full sm:w-auto inline-flex items-center justify-center h-12 px-8 font-semibold rounded-2xl text-dracula-bg bg-gradient-to-r from-dracula-purple to-dracula-pink hover:opacity-95 active:scale-95 transition-all duration-200 shadow-lg shadow-dracula-purple/20 cursor-pointer">
            Comenzar gratis
          </NuxtLink>
          <a href="#demo"
            class="w-full sm:w-auto inline-flex items-center justify-center h-12 px-8 font-medium rounded-2xl border border-dracula-card hover:bg-dracula-card2 active:scale-95 transition-all duration-200 cursor-pointer">
            Ver demo interactiva
          </a>
        </div>
      </div>
    </section>

    <!-- Interactive Simulator Section -->
    <section id="demo" class="py-16 px-6 bg-dracula-bg2 border-y border-dracula-card/25 scroll-mt-24">
      <div class="max-w-5xl mx-auto space-y-12">
        <div class="text-center space-y-3">
          <h3 class="text-3xl font-bold">Probá el escáner de IA en vivo</h3>
          <p class="text-dracula-muted max-w-xl mx-auto">
            Seleccioná un ticket de prueba y mira cómo el motor de IA extrae la información en tiempo real.
          </p>
        </div>

        <!-- Ticket Selector Tabs -->
        <div class="flex flex-wrap justify-center gap-2">
          <button v-for="(ticket, idx) in mockTickets" :key="ticket.comercio" @click="selectTicket(idx)"
            class="h-10 px-4 rounded-xl font-medium text-sm transition-all duration-200 cursor-pointer"
            :class="selectedIndex === idx ? 'bg-dracula-card text-dracula-purple border border-dracula-purple/30' : 'bg-dracula-card2 text-dracula-muted hover:text-dracula-text'">
            {{ ticket.comercio }}
          </button>
        </div>

        <!-- Simulator Container -->
        <div class="grid md:grid-cols-2 gap-8 items-stretch max-w-4xl mx-auto">
          <!-- Left: Receipt mockup -->
          <div
            class="relative overflow-hidden rounded-3xl bg-dracula-card p-8 border border-dracula-card2 flex flex-col justify-between shadow-xl min-h-[380px]">
            <!-- Visual ticket -->
            <div class="space-y-6">
              <div class="flex justify-between items-start border-b border-dashed border-dracula-muted/30 pb-4">
                <div>
                  <h4 class="font-bold text-lg">{{ mockTickets[selectedIndex].comercio }}</h4>
                  <p class="text-xs text-dracula-muted">Comprobante de compra simplificado</p>
                </div>
                <div class="text-right">
                  <span class="text-xs px-2.5 py-1 rounded-full bg-dracula-bg text-dracula-muted font-mono">
                    {{ mockTickets[selectedIndex].fecha }}
                  </span>
                </div>
              </div>

              <!-- Ticket Items list -->
              <div class="space-y-3 font-mono text-sm text-dracula-muted">
                <div v-for="item in mockTickets[selectedIndex].items" :key="item.nombre" class="flex justify-between">
                  <span>{{ item.cantidad }}x {{ item.nombre }}</span>
                  <span>{{ (item.precio * item.cantidad).toFixed(2) }} €</span>
                </div>
              </div>
            </div>

            <!-- Total -->
            <div class="border-t border-dashed border-dracula-muted/30 pt-4 mt-6">
              <div class="flex justify-between items-center">
                <span class="font-bold text-dracula-muted">TOTAL:</span>
                <span class="text-2xl font-extrabold text-dracula-pink">
                  {{ mockTickets[selectedIndex].total.toFixed(2) }} €
                </span>
              </div>
            </div>

            <!-- Scanning laser effect -->
            <div v-if="scanState === 'scanning'"
              class="absolute left-0 right-0 h-1.5 bg-dracula-green shadow-[0_0_12px_#50fa7b] opacity-80 pointer-events-none animate-bounce"
              style="animation-duration: 2s;" />

            <!-- Scanning overlay blur -->
            <div v-if="scanState === 'scanning'"
              class="absolute inset-0 bg-dracula-purple/5 backdrop-blur-[1px] pointer-events-none transition-all duration-300" />

            <!-- Simulator Actions -->
            <div class="mt-8">
              <button @click="startScan" :disabled="scanState === 'scanning'"
                class="w-full flex items-center justify-center gap-2 h-12 rounded-2xl text-dracula-bg bg-dracula-green font-semibold hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all duration-200 shadow-md cursor-pointer">
                <svg v-if="scanState !== 'scanning'" class="w-5 h-5" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 4v1m6 11h2m-6 0h-2v4m0-16v.01M4 12h2m0 0h2m-2 0V8m8 8h2m-2 0v4M4 16h2v-4m12 0h-2v-4m-2-2H8M4 8h2V6a2 2 0 012-2h8a2 2 0 012 2v2h2" />
                </svg>
                <span v-if="scanState === 'idle'">Escanear Ticket</span>
                <span v-else-if="scanState === 'scanning'">Procesando con IA ({{ progress }}%)...</span>
                <span v-else>Escaneo Completado</span>
              </button>
            </div>
          </div>

          <!-- Right: AI Output Mockup -->
          <div
            class="rounded-3xl bg-dracula-card2 p-8 border border-dracula-card/25 flex flex-col justify-between shadow-xl min-h-[380px] font-mono text-sm relative">
            <div class="absolute top-4 right-4">
              <span class="flex h-2.5 w-2.5 relative">
                <span
                  class="animate-ping absolute inline-flex h-full w-full rounded-full bg-dracula-purple opacity-75"></span>
                <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-dracula-purple"></span>
              </span>
            </div>

            <!-- Terminal output header -->
            <div class="border-b border-dracula-card/50 pb-4 mb-4">
              <p class="text-xs text-dracula-muted">SYSTEM STATUS: READY</p>
              <p class="text-xs text-dracula-purple">ENGINE: llama-4-scout-vision</p>
            </div>

            <!-- Response content states -->
            <div class="flex-grow flex flex-col justify-center">
              <div v-if="scanState === 'idle'" class="text-center space-y-2 py-8">
                <p class="text-dracula-muted">Esperando inicio de escaneo...</p>
                <p class="text-xs text-dracula-muted/55">Pulsá el botón verde de la izquierda</p>
              </div>

              <div v-else-if="scanState === 'scanning'" class="space-y-4">
                <div class="flex justify-between items-center text-xs text-dracula-muted">
                  <span>Subiendo binarios del ticket...</span>
                  <span>{{ progress }}%</span>
                </div>
                <div class="w-full bg-dracula-bg h-2 rounded-full overflow-hidden">
                  <div class="bg-dracula-purple h-full rounded-full transition-all duration-100"
                    :style="{ width: `${progress}%` }" />
                </div>
                <div class="space-y-2 text-xs text-dracula-purple">
                  <p class="animate-pulse">> Extrayendo caja de texto...</p>
                  <p v-if="progress > 40" class="animate-pulse">> Analizando desglose de productos...</p>
                  <p v-if="progress > 70" class="animate-pulse">> Clasificando categoría tributaria...</p>
                </div>
              </div>

              <!-- Final Output -->
              <div v-else-if="scanState === 'done'" class="space-y-4">
                <div class="flex items-center justify-between text-xs text-dracula-green">
                  <span>[OK] EXTRACCIÓN EXITOSA</span>
                  <span>Confianza: {{ (mockTickets[selectedIndex].confianza * 100).toFixed(0) }}%</span>
                </div>

                <div class="bg-dracula-bg/70 rounded-2xl p-4 space-y-2.5 text-xs border border-dracula-card">
                  <div>
                    <span class="text-dracula-muted">Comercio: </span>
                    <span class="text-dracula-text font-bold">{{ mockTickets[selectedIndex].comercio }}</span>
                  </div>
                  <div>
                    <span class="text-dracula-muted">Fecha: </span>
                    <span class="text-dracula-cyan">{{ mockTickets[selectedIndex].fecha }}</span>
                  </div>
                  <div>
                    <span class="text-dracula-muted">Categoría: </span>
                    <span class="px-2 py-0.5 rounded-full bg-dracula-card text-dracula-purple text-[10px] font-bold">
                      {{ mockTickets[selectedIndex].categoria }}
                    </span>
                  </div>
                  <div>
                    <span class="text-dracula-muted">Artículos: </span>
                    <div class="pl-3 mt-1 space-y-1 text-[11px] text-dracula-muted">
                      <div v-for="item in mockTickets[selectedIndex].items" :key="item.nombre"
                        class="flex justify-between">
                        <span>{{ item.cantidad }}x {{ item.nombre }}</span>
                        <span class="text-dracula-text">{{ (item.precio * item.cantidad).toFixed(2) }} €</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="flex gap-2">
                  <span
                    class="text-xs px-2 py-1 rounded bg-dracula-green/15 text-dracula-green border border-dracula-green/20">
                    IA Verified
                  </span>
                  <span
                    class="text-xs px-2 py-1 rounded bg-dracula-cyan/15 text-dracula-cyan border border-dracula-cyan/20">
                    Móvil-Ready
                  </span>
                </div>
              </div>
            </div>

            <!-- Terminal footer action -->
            <div class="border-t border-dracula-card/50 pt-4 mt-4 text-center">
              <NuxtLink to="/login"
                class="inline-flex items-center gap-1.5 text-xs text-dracula-purple hover:underline cursor-pointer">
                Probar con tus propios tickets
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Bento Grid Features Section -->
    <section class="py-20 px-6">
      <div class="max-w-5xl mx-auto space-y-16">
        <div class="text-center space-y-4">
          <h3 class="text-3xl md:text-4xl font-bold">Construido bajo estándares de ingeniería</h3>
          <p class="text-dracula-muted max-w-xl mx-auto">
            No somos una base de datos simple. Implementamos resiliencia total y seguridad estricta para tus gastos.
          </p>
        </div>

        <!-- Bento Grid -->
        <div class="grid md:grid-cols-3 gap-6">
          <!-- Card 1: Vision IA (Wide) -->
          <div
            class="md:col-span-2 rounded-3xl bg-dracula-card p-8 border border-dracula-card2 flex flex-col justify-between transition-all duration-300 hover:scale-[1.01] hover:border-dracula-purple/30 group shadow-lg">
            <div class="space-y-4">
              <div
                class="w-12 h-12 rounded-2xl bg-dracula-purple/10 flex items-center justify-center text-dracula-purple">
                <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <h4 class="text-xl font-bold">Visión Computacional y Estructuración IA</h4>
              <p class="text-dracula-muted leading-relaxed">
                Olvidate de escribir a mano. Nuestro motor seguro procesa los tickets y los deconstruye en líneas de
                artículos, IVA y comercio de forma inteligente con un 98% de precisión media.
              </p>
            </div>
            <div class="mt-6 flex flex-wrap gap-2">
              <span
                class="text-xs px-2.5 py-1 rounded-full bg-dracula-bg text-dracula-purple border border-dracula-purple/10">Llama
                4 Scout Vision</span>
              <span
                class="text-xs px-2.5 py-1 rounded-full bg-dracula-bg text-dracula-pink border border-dracula-pink/10">JSON
                Estructurado</span>
            </div>
          </div>

          <!-- Card 2: Offline first -->
          <div
            class="rounded-3xl bg-dracula-card p-8 border border-dracula-card2 flex flex-col justify-between transition-all duration-300 hover:scale-[1.01] hover:border-dracula-pink/30 group shadow-lg">
            <div class="space-y-4">
              <div class="w-12 h-12 rounded-2xl bg-dracula-pink/10 flex items-center justify-center text-dracula-pink">
                <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h4 class="text-xl font-bold">Resiliencia Offline-First</h4>
              <p class="text-dracula-muted leading-relaxed">
                Diseñado para funcionar sin red. Las transacciones se encolan localmente en IndexedDB y se sincronizan
                solas cuando recuperas internet.
              </p>
            </div>
            <div class="mt-6">
              <span
                class="text-xs px-2.5 py-1 rounded-full bg-dracula-bg text-dracula-pink border border-dracula-pink/10">Sincronización
                en segundo plano</span>
            </div>
          </div>

          <!-- Card 3: Security -->
          <div
            class="rounded-3xl bg-dracula-card p-8 border border-dracula-card2 flex flex-col justify-between transition-all duration-300 hover:scale-[1.01] hover:border-dracula-cyan/30 group shadow-lg">
            <div class="space-y-4">
              <div class="w-12 h-12 rounded-2xl bg-dracula-cyan/10 flex items-center justify-center text-dracula-cyan">
                <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h4 class="text-xl font-bold">Seguridad Criptográfica</h4>
              <p class="text-dracula-muted leading-relaxed">
                Tus datos financieros son privados. Aislamos la información a nivel de base de datos con políticas
                estrictas de Supabase RLS y encriptación.
              </p>
            </div>
            <div class="mt-6">
              <span
                class="text-xs px-2.5 py-1 rounded-full bg-dracula-bg text-dracula-cyan border border-dracula-cyan/10">Aislamiento
                RLS</span>
            </div>
          </div>

          <!-- Card 4: UI/UX & Canvas (Wide) -->
          <div
            class="md:col-span-2 rounded-3xl bg-dracula-card p-8 border border-dracula-card2 flex flex-col justify-between transition-all duration-300 hover:scale-[1.01] hover:border-dracula-green/30 group shadow-lg">
            <div class="space-y-4">
              <div
                class="w-12 h-12 rounded-2xl bg-dracula-green/10 flex items-center justify-center text-dracula-green">
                <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h4 class="text-xl font-bold">Generación de Comprobantes Visuales</h4>
              <p class="text-dracula-muted leading-relaxed">
                Visualizá tus facturas con estilo. El sistema procesa los tickets y renderiza comprobantes en imagen de
                alta resolución usando Canvas API localmente en el cliente, permitiendo descargas y archivado inmediato.
              </p>
            </div>
            <div class="mt-6 flex flex-wrap gap-2">
              <span
                class="text-xs px-2.5 py-1 rounded-full bg-dracula-bg text-dracula-green border border-dracula-green/10">Canvas
                API</span>
              <span
                class="text-xs px-2.5 py-1 rounded-full bg-dracula-bg text-dracula-orange border border-dracula-orange/10">Alta
                Definición</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- PWA Install Section -->
    <section class="py-16 px-6 bg-dracula-bg2 border-t border-dracula-card/20">
      <div class="max-w-4xl mx-auto grid md:grid-cols-2 gap-12 items-center">
        <div class="space-y-6">
          <div
            class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-dracula-card/50 border border-dracula-pink/20 text-dracula-pink text-xs font-semibold">
            PWA HÍBRIDA
          </div>
          <h3 class="text-3xl font-extrabold tracking-tight">
            Instalá en tu pantalla de inicio sin intermediarios
          </h3>
          <p class="text-dracula-muted leading-relaxed">
            IA Finanzas es una PWA (Progressive Web Application). Se instala directo en tu teléfono en segundos,
            ocupando un espacio mínimo y cargando al instante.
          </p>

          <!-- OS steps tabs style -->
          <div class="space-y-4">
            <div class="flex gap-4 items-start">
              <div
                class="w-8 h-8 rounded-full bg-dracula-purple/20 flex items-center justify-center text-dracula-purple shrink-0 font-bold text-sm">
                1
              </div>
              <div>
                <h5 class="font-bold text-sm">iOS / iPhone</h5>
                <p class="text-xs text-dracula-muted leading-normal">
                  Pulsá el botón de Compartir en Safari y seleccioná "Añadir a la pantalla de inicio".
                </p>
              </div>
            </div>
            <div class="flex gap-4 items-start">
              <div
                class="w-8 h-8 rounded-full bg-dracula-pink/20 flex items-center justify-center text-dracula-pink shrink-0 font-bold text-sm">
                2
              </div>
              <div>
                <h5 class="font-bold text-sm">Android / Chrome</h5>
                <p class="text-xs text-dracula-muted leading-normal">
                  Pulsá el banner de instalación nativo que aparece al ingresar a la aplicación.
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Phone Mockup showing app screen -->
        <div
          class="relative max-w-[280px] mx-auto w-full aspect-[9/18.5] bg-[#151515] rounded-[42px] p-3 shadow-2xl border-4 border-[#333]">
          <!-- Screen inner -->
          <div
            class="w-full h-full bg-dracula-bg rounded-[32px] overflow-hidden flex flex-col justify-between p-4 border border-white/5 relative">
            <!-- Notch/Speaker -->
            <div
              class="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-4 bg-black rounded-full z-20 flex items-center justify-center">
              <div class="w-2 h-2 rounded-full bg-white/10" />
            </div>

            <!-- Top bar -->
            <div class="flex justify-between items-center text-[10px] text-dracula-muted pt-2">
              <span>9:41</span>
              <div class="flex gap-1">
                <span>LTE</span>
                <span>🔋</span>
              </div>
            </div>

            <!-- Fake App UI content -->
            <div class="flex-grow flex flex-col justify-center items-center text-center space-y-4 py-8">
              <img src="/icono.png" alt="Fake icon" class="w-12 h-12 rounded-xl shadow-lg" />
              <div class="space-y-1">
                <h6 class="font-bold text-xs text-dracula-text">IA Finanzas</h6>
                <p class="text-[9px] text-dracula-muted">Tus finanzas, siempre contigo</p>
              </div>
              <div
                class="w-full max-w-[150px] p-2.5 rounded-xl bg-dracula-card border border-dracula-card2 text-[9px] text-left space-y-1">
                <p class="text-dracula-muted">Último Ticket:</p>
                <div class="flex justify-between font-bold text-dracula-text">
                  <span>ByteStore</span>
                  <span class="text-dracula-pink">189.99 €</span>
                </div>
              </div>
            </div>

            <!-- Fake Bottom bar installer -->
            <div
              class="bg-dracula-card/90 backdrop-blur border border-dracula-purple/20 p-2.5 rounded-2xl text-center space-y-1.5 shadow-lg">
              <p class="text-[9px] text-dracula-text font-semibold">¿Instalar en la pantalla de inicio?</p>
              <button
                class="w-full h-6 rounded-lg text-dracula-bg bg-gradient-to-r from-dracula-purple to-dracula-pink text-[9px] font-bold">
                Instalar App
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="border-t border-dracula-card/25 py-8 px-6 bg-dracula-bg">
      <div
        class="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
        <div class="flex items-center gap-3">
          <img src="/icono.png" alt="Logo IAFinanzas" class="w-8 h-8 rounded-lg object-contain" />
          <span class="font-bold bg-gradient-to-r from-dracula-purple to-dracula-pink bg-clip-text text-transparent">
            IA Finanzas
          </span>
        </div>
        <p class="text-xs text-dracula-muted">
          &copy; 2026 IA Finanzas. Todos los derechos reservados.
        </p>
        <div class="flex items-center justify-center gap-3 text-xs text-dracula-muted">
          <NuxtLink to="/login" class="flex items-center hover:text-dracula-text cursor-pointer transition-colors">
            Acceso
          </NuxtLink>
          <span class="text-dracula-card">|</span>
          <span class="flex items-center">v{{ config.public.version }}</span>
        </div>
      </div>
    </footer>

    <LayoutAvisoInstalacion />
  </div>
</template>

<style scoped>
/* Custom animations inside the component */
@keyframes bounce {

  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(320px);
  }
}

.animate-bounce {
  animation: bounce 2s infinite ease-in-out;
}
</style>
