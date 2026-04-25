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
      <h1 class="text-lg font-bold text-dracula-text">Mis datos</h1>
    </div>

    <div v-if="pending" class="flex flex-col gap-4 px-4">
      <div v-for="i in 4" :key="i" class="h-14 rounded-2xl bg-dracula-card2 animate-pulse" />
    </div>

    <form v-else class="flex flex-col gap-4 px-4" @submit.prevent="guardar">
      <div class="flex flex-col gap-1.5">
        <label class="text-xs font-semibold uppercase tracking-wider text-dracula-muted">Nombre</label>
        <input
          v-model="form.nombre"
          type="text"
          placeholder="Tu nombre completo"
          class="w-full bg-dracula-card2 rounded-2xl px-4 py-3.5 text-sm text-dracula-text placeholder-dracula-muted/60 border border-dracula-muted/20 focus:border-dracula-purple focus:outline-none transition-colors"
        >
      </div>

      <div class="flex flex-col gap-1.5">
        <label class="text-xs font-semibold uppercase tracking-wider text-dracula-muted">Teléfono</label>
        <input
          v-model="form.telefono"
          type="tel"
          placeholder="+34 600 000 000"
          class="w-full bg-dracula-card2 rounded-2xl px-4 py-3.5 text-sm text-dracula-text placeholder-dracula-muted/60 border border-dracula-muted/20 focus:border-dracula-purple focus:outline-none transition-colors"
        >
      </div>

      <div class="flex flex-col gap-1.5">
        <label class="text-xs font-semibold uppercase tracking-wider text-dracula-muted">Ciudad</label>
        <input
          v-model="form.ciudad"
          type="text"
          placeholder="Madrid"
          class="w-full bg-dracula-card2 rounded-2xl px-4 py-3.5 text-sm text-dracula-text placeholder-dracula-muted/60 border border-dracula-muted/20 focus:border-dracula-purple focus:outline-none transition-colors"
        >
      </div>

      <div class="flex flex-col gap-1.5">
        <label class="text-xs font-semibold uppercase tracking-wider text-dracula-muted">Divisa</label>
        <div class="flex gap-2 flex-wrap">
          <button
            v-for="d in divisas"
            :key="d"
            type="button"
            class="px-4 py-2 rounded-full text-sm font-semibold transition-colors"
            :class="form.divisa === d ? 'bg-dracula-purple text-dracula-bg' : 'bg-dracula-card text-dracula-muted'"
            @click="form.divisa = d"
          >
            {{ d }}
          </button>
        </div>
      </div>

      <p v-if="errorMsg" class="text-xs text-dracula-red bg-dracula-red/10 rounded-xl px-3 py-2">
        {{ errorMsg }}
      </p>

      <button
        type="submit"
        :disabled="saving"
        class="w-full py-4 rounded-2xl text-sm font-semibold text-white mt-2 transition-opacity"
        :class="saving ? 'opacity-40 cursor-not-allowed' : 'opacity-100'"
        style="background: linear-gradient(135deg, #bd93f9, #ff79c6)"
      >
        {{ saving ? 'Guardando...' : saved ? '✓ Guardado' : 'Guardar cambios' }}
      </button>
    </form>
  </div>
</template>
