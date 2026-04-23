<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const user = useSupabaseUser()
const supabase = useSupabaseClient()
const saving = ref(false)
const saved = ref(false)
const errorMsg = ref('')

const divisas = ['EUR', 'USD', 'GBP', 'JPY', 'MXN'] as const

const form = ref({
  nombre:   '',
  telefono: '',
  ciudad:   '',
  divisa:   'EUR' as typeof divisas[number],
})

// Carga el perfil desde la tabla profiles
const { pending } = useAsyncData(
  'profile',
  async () => {
    if (!user.value) return null
    const { data, error } = await supabase
      .from('profiles')
      .select('nombre, telefono, ciudad, divisa')
      .single()
    if (error) throw error
    return data
  },
  {
    watch: [user],
    immediate: true,
    transform: (data) => {
      if (!data) return null
      form.value = {
        nombre:   data.nombre   ?? '',
        telefono: data.telefono ?? '',
        ciudad:   data.ciudad   ?? '',
        divisa:   (data.divisa  ?? 'EUR') as typeof divisas[number],
      }
      return data
    },
  },
)

async function guardar() {
  saving.value = true
  saved.value = false
  errorMsg.value = ''
  try {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) throw new Error('No autenticado')
    const { error } = await supabase
      .from('profiles')
      .update({
        nombre:   form.value.nombre.trim()   || null,
        telefono: form.value.telefono.trim() || null,
        ciudad:   form.value.ciudad.trim()   || null,
        divisa:   form.value.divisa,
      })
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
      <h1 class="text-lg font-bold text-[#f8f8f2]">Mis datos</h1>
    </div>

    <!-- Skeleton mientras carga -->
    <div v-if="pending" class="flex flex-col gap-4 px-4">
      <div v-for="i in 4" :key="i" class="h-14 rounded-2xl bg-[#383a4a] animate-pulse" />
    </div>

    <form v-else class="flex flex-col gap-4 px-4" @submit.prevent="guardar">
      <!-- Nombre -->
      <div class="flex flex-col gap-1.5">
        <label class="text-xs font-semibold uppercase tracking-wider text-[#6272a4]">Nombre</label>
        <input
          v-model="form.nombre"
          type="text"
          placeholder="Tu nombre completo"
          class="w-full bg-[#383a4a] rounded-2xl px-4 py-3.5 text-sm text-[#f8f8f2] placeholder-[#6272a4]/60 border border-[#6272a4]/20 focus:border-[#bd93f9] focus:outline-none transition-colors"
        >
      </div>

      <!-- Teléfono -->
      <div class="flex flex-col gap-1.5">
        <label class="text-xs font-semibold uppercase tracking-wider text-[#6272a4]">Teléfono</label>
        <input
          v-model="form.telefono"
          type="tel"
          placeholder="+34 600 000 000"
          class="w-full bg-[#383a4a] rounded-2xl px-4 py-3.5 text-sm text-[#f8f8f2] placeholder-[#6272a4]/60 border border-[#6272a4]/20 focus:border-[#bd93f9] focus:outline-none transition-colors"
        >
      </div>

      <!-- Ciudad -->
      <div class="flex flex-col gap-1.5">
        <label class="text-xs font-semibold uppercase tracking-wider text-[#6272a4]">Ciudad</label>
        <input
          v-model="form.ciudad"
          type="text"
          placeholder="Madrid"
          class="w-full bg-[#383a4a] rounded-2xl px-4 py-3.5 text-sm text-[#f8f8f2] placeholder-[#6272a4]/60 border border-[#6272a4]/20 focus:border-[#bd93f9] focus:outline-none transition-colors"
        >
      </div>

      <!-- Divisa -->
      <div class="flex flex-col gap-1.5">
        <label class="text-xs font-semibold uppercase tracking-wider text-[#6272a4]">Divisa</label>
        <div class="flex gap-2 flex-wrap">
          <button
            v-for="d in divisas"
            :key="d"
            type="button"
            class="px-4 py-2 rounded-full text-sm font-semibold transition-colors"
            :class="form.divisa === d
              ? 'bg-[#bd93f9] text-[#282a36]'
              : 'bg-[#44475a] text-[#6272a4]'"
            @click="form.divisa = d"
          >
            {{ d }}
          </button>
        </div>
      </div>

      <!-- Error -->
      <p v-if="errorMsg" class="text-xs text-[#ff5555] bg-[#ff5555]/10 rounded-xl px-3 py-2">
        {{ errorMsg }}
      </p>

      <!-- Botón -->
      <button
        type="submit"
        :disabled="saving"
        class="w-full py-4 rounded-2xl text-sm font-semibold text-[#282a36] mt-2 transition-opacity"
        :class="saving ? 'opacity-40 cursor-not-allowed' : 'opacity-100'"
        style="background: linear-gradient(135deg, #bd93f9, #ff79c6)"
      >
        {{ saving ? 'Guardando...' : saved ? '✓ Guardado' : 'Guardar cambios' }}
      </button>
    </form>
  </div>
</template>
