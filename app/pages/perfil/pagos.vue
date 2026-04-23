<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const user = useSupabaseUser()
const supabase = useSupabaseClient()
const saving = ref(false)
const saved = ref(false)
const errorMsg = ref('')

const METODOS = ['Efectivo', 'Tarjeta débito', 'Tarjeta crédito', 'Transferencia', 'Otro'] as const

const activos = ref<string[]>([])

const { pending } = useAsyncData(
  'profile-pagos',
  async () => {
    if (!user.value) return null
    const { data, error } = await supabase
      .from('profiles')
      .select('metodos_pago')
      .single()
    if (error) throw error
    return data
  },
  {
    watch: [user],
    transform: (data) => {
      if (data?.metodos_pago) activos.value = [...data.metodos_pago]
      return data
    },
  },
)

function toggle(metodo: string) {
  const idx = activos.value.indexOf(metodo)
  if (idx === -1) {
    activos.value = [...activos.value, metodo]
  } else {
    activos.value = activos.value.filter(m => m !== metodo)
  }
}

async function guardar() {
  saving.value = true
  saved.value = false
  errorMsg.value = ''
  try {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) throw new Error('No autenticado')
    const { error } = await supabase
      .from('profiles')
      .update({ metodos_pago: activos.value })
      .eq('id', authUser.id)
    if (error) throw error
    saved.value = true
    setTimeout(() => { saved.value = false }, 2000)
  } catch (e: unknown) {
    errorMsg.value = e instanceof Error ? e.message : 'Error al guardar.'
  } finally {
    saving.value = false
  }
}
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
      <h1 class="text-lg font-bold text-[#f8f8f2]">Métodos de pago</h1>
    </div>

    <div class="flex flex-col gap-4 px-4">
      <p class="text-xs text-[#6272a4]">
        Activá los métodos que usás habitualmente. La IA los tendrá en cuenta al detectar el pago.
      </p>

      <!-- Skeleton -->
      <template v-if="pending">
        <div v-for="i in 5" :key="i" class="h-16 rounded-2xl bg-[#383a4a] animate-pulse" />
      </template>

      <template v-else>
        <div
          v-for="metodo in METODOS"
          :key="metodo"
          class="flex items-center gap-4 bg-[#383a4a] rounded-2xl px-4 py-4 min-h-[64px] cursor-pointer transition-colors active:bg-[#44475a]"
          @click="toggle(metodo)"
        >
          <span class="flex-1 text-sm font-medium text-[#f8f8f2]">{{ metodo }}</span>

          <!-- Toggle -->
          <div
            class="w-11 h-6 rounded-full transition-colors relative flex-shrink-0"
            :class="activos.includes(metodo) ? 'bg-[#bd93f9]' : 'bg-[#44475a]'"
          >
            <div
              class="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform"
              :class="activos.includes(metodo) ? 'translate-x-5' : 'translate-x-0.5'"
            />
          </div>
        </div>

        <p v-if="errorMsg" class="text-xs text-[#ff5555] bg-[#ff5555]/10 rounded-xl px-3 py-2">
          {{ errorMsg }}
        </p>

        <button
          class="w-full py-4 rounded-2xl text-sm font-semibold text-[#282a36] transition-opacity"
          :class="saving ? 'opacity-40 cursor-not-allowed' : 'opacity-100'"
          :disabled="saving"
          style="background: linear-gradient(135deg, #bd93f9, #ff79c6)"
          @click="guardar"
        >
          {{ saving ? 'Guardando...' : saved ? '✓ Guardado' : 'Guardar cambios' }}
        </button>
      </template>
    </div>
  </div>
</template>
