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
      <h1 class="text-lg font-bold text-dracula-text">Seguridad</h1>
    </div>

    <div class="flex flex-col gap-6 px-4">
      <div class="bg-dracula-card2 rounded-3xl p-4 border border-dracula-muted/10">
        <p class="text-sm font-semibold text-dracula-text mb-4">Cambiar contraseña</p>
        <form class="flex flex-col gap-3" @submit.prevent="cambiarPassword">
          <input
            v-model="form.nueva"
            type="password"
            placeholder="Nueva contraseña"
            class="w-full bg-dracula-bg rounded-2xl px-4 py-3.5 text-sm text-dracula-text placeholder-dracula-muted/60 border border-dracula-muted/20 focus:border-dracula-purple focus:outline-none transition-colors"
          >
          <input
            v-model="form.confirma"
            type="password"
            placeholder="Confirmar contraseña"
            class="w-full bg-dracula-bg rounded-2xl px-4 py-3.5 text-sm text-dracula-text placeholder-dracula-muted/60 border border-dracula-muted/20 focus:border-dracula-purple focus:outline-none transition-colors"
          >
          <p v-if="errorMsg" class="text-xs text-dracula-red">{{ errorMsg }}</p>
          <button
            type="submit"
            :disabled="saving || !form.nueva || !form.confirma"
            class="w-full py-3.5 rounded-2xl text-sm font-semibold text-white transition-opacity"
            :class="(saving || !form.nueva || !form.confirma) ? 'opacity-40 cursor-not-allowed' : 'opacity-100'"
            style="background: linear-gradient(135deg, #bd93f9, #ff79c6)"
          >
            {{ saving ? 'Actualizando...' : saved ? '✓ Contraseña actualizada' : 'Actualizar contraseña' }}
          </button>
        </form>
      </div>

      <div class="bg-dracula-card2 rounded-3xl p-4 border border-dracula-muted/10">
        <p class="text-sm font-semibold text-dracula-text mb-1">Sesión activa</p>
        <p class="text-xs text-dracula-muted">
          Si iniciaste sesión con Google, la contraseña se gestiona desde tu cuenta de Google.
        </p>
      </div>
    </div>
  </div>
</template>
