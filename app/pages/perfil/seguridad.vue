<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const supabase = useSupabaseClient()
const saving = ref(false)
const saved = ref(false)
const errorMsg = ref('')

const form = ref({
  nueva:    '',
  confirma: '',
})

async function cambiarPassword() {
  errorMsg.value = ''
  if (form.value.nueva.length < 6) {
    errorMsg.value = 'La contraseña debe tener al menos 6 caracteres.'
    return
  }
  if (form.value.nueva !== form.value.confirma) {
    errorMsg.value = 'Las contraseñas no coinciden.'
    return
  }
  saving.value = true
  saved.value = false
  try {
    const { error } = await supabase.auth.updateUser({ password: form.value.nueva })
    if (error) throw error
    form.value = { nueva: '', confirma: '' }
    saved.value = true
    setTimeout(() => { saved.value = false }, 2500)
  } catch (e: unknown) {
    errorMsg.value = e instanceof Error ? e.message : 'Error al cambiar la contraseña.'
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
      <h1 class="text-lg font-bold text-[#f8f8f2]">Seguridad</h1>
    </div>

    <div class="flex flex-col gap-6 px-4">
      <!-- Cambiar contraseña -->
      <div class="bg-[#383a4a] rounded-3xl p-4 border border-[#6272a4]/10">
        <p class="text-sm font-semibold text-[#f8f8f2] mb-4">Cambiar contraseña</p>
        <form class="flex flex-col gap-3" @submit.prevent="cambiarPassword">
          <input
            v-model="form.nueva"
            type="password"
            placeholder="Nueva contraseña"
            class="w-full bg-[#282a36] rounded-2xl px-4 py-3.5 text-sm text-[#f8f8f2] placeholder-[#6272a4]/60 border border-[#6272a4]/20 focus:border-[#bd93f9] focus:outline-none transition-colors"
          >
          <input
            v-model="form.confirma"
            type="password"
            placeholder="Confirmar contraseña"
            class="w-full bg-[#282a36] rounded-2xl px-4 py-3.5 text-sm text-[#f8f8f2] placeholder-[#6272a4]/60 border border-[#6272a4]/20 focus:border-[#bd93f9] focus:outline-none transition-colors"
          >
          <p v-if="errorMsg" class="text-xs text-[#ff5555]">{{ errorMsg }}</p>
          <button
            type="submit"
            :disabled="saving || !form.nueva || !form.confirma"
            class="w-full py-3.5 rounded-2xl text-sm font-semibold text-[#282a36] transition-opacity"
            :class="(saving || !form.nueva || !form.confirma) ? 'opacity-40 cursor-not-allowed' : 'opacity-100'"
            style="background: linear-gradient(135deg, #bd93f9, #ff79c6)"
          >
            {{ saving ? 'Actualizando...' : saved ? '✓ Contraseña actualizada' : 'Actualizar contraseña' }}
          </button>
        </form>
      </div>

      <!-- Info OAuth -->
      <div class="bg-[#383a4a] rounded-3xl p-4 border border-[#6272a4]/10">
        <p class="text-sm font-semibold text-[#f8f8f2] mb-1">Sesión activa</p>
        <p class="text-xs text-[#6272a4]">
          Si iniciaste sesión con Google, la contraseña se gestiona desde tu cuenta de Google.
        </p>
      </div>
    </div>
  </div>
</template>
