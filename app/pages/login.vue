<script setup lang="ts">
definePageMeta({ middleware: [] }) // pública

const supabase = useSupabaseClient()

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref<string | null>(null)
const isRegister = ref(false)

function traducirError(msg: string): string {
  if (msg.includes('Invalid login credentials')) return 'Email o contraseña incorrectos.'
  if (msg.includes('Email not confirmed')) return 'Confirmá tu email antes de iniciar sesión.'
  if (msg.includes('User already registered')) return 'Este email ya está registrado.'
  if (msg.includes('Password should be at least')) return 'La contraseña debe tener al menos 6 caracteres.'
  if (msg.includes('Unable to validate email')) return 'El email no es válido.'
  if (msg.includes('Database error')) return 'Error interno. Intentá de nuevo en unos segundos.'
  if (msg.includes('rate limit')) return 'Demasiados intentos. Esperá unos minutos.'
  return 'Ocurrió un error. Intentá de nuevo.'
}

async function submit() {
  loading.value = true
  error.value = null

  try {
    if (isRegister.value) {
      const { error: err } = await supabase.auth.signUp({ email: email.value, password: password.value })
      if (err) throw err
      error.value = '✓ Revisá tu email para confirmar la cuenta.'
    } else {
      const { error: err } = await supabase.auth.signInWithPassword({ email: email.value, password: password.value })
      if (err) throw err
      await navigateTo('/dashboard', { replace: true })
    }
  } catch (e: unknown) {
    error.value = e instanceof Error ? traducirError(e.message) : 'Ocurrió un error. Intentá de nuevo.'
  } finally {
    loading.value = false
  }
}

async function loginWithGoogle() {
  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}/dashboard` },
  })
}
</script>

<template>
  <div class="flex flex-col items-center justify-center min-h-screen px-6 bg-dracula-bg">
    <!-- Logo -->
    <div class="flex flex-col items-center mb-10">
      <div class="w-16 h-16 rounded-3xl flex items-center justify-center mb-4 shadow-lg" style="background: linear-gradient(135deg, #bd93f9, #ff79c6)">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round">
          <path d="M21 12V7H5a2 2 0 010-4h14v4"/><path d="M3 5v14a2 2 0 002 2h16v-5"/><path d="M18 12a2 2 0 000 4h4v-4z"/>
        </svg>
      </div>
      <h1 class="text-2xl font-bold text-dracula-text">Cartera</h1>
      <p class="text-sm text-dracula-muted mt-1">Tus finanzas, siempre contigo</p>
    </div>

    <!-- Card formulario -->
    <div class="w-full max-w-sm bg-dracula-card2 rounded-3xl p-6 border border-dracula-muted/20">
      <h2 class="text-lg font-semibold text-dracula-text mb-6">
        {{ isRegister ? 'Crear cuenta' : 'Iniciar sesión' }}
      </h2>

      <form class="flex flex-col gap-4" @submit.prevent="submit">
        <!-- Email -->
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold uppercase tracking-wider text-dracula-muted">Email</label>
          <div class="relative">
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 text-dracula-muted" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
            </svg>
            <input
              v-model="email"
              type="email"
              required
              autocomplete="email"
              placeholder="vos@ejemplo.com"
              class="w-full bg-dracula-card rounded-2xl pl-10 pr-4 py-3 text-sm text-dracula-text placeholder-dracula-muted/60 border border-dracula-muted/20 focus:outline-none focus:border-dracula-purple transition-colors"
            >
          </div>
        </div>

        <!-- Password -->
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold uppercase tracking-wider text-dracula-muted">Contraseña</label>
          <div class="relative">
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 text-dracula-muted" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
            </svg>
            <input
              v-model="password"
              type="password"
              required
              autocomplete="current-password"
              placeholder="••••••••"
              class="w-full bg-dracula-card rounded-2xl pl-10 pr-4 py-3 text-sm text-dracula-text placeholder-dracula-muted/60 border border-dracula-muted/20 focus:outline-none focus:border-dracula-purple transition-colors"
            >
          </div>
        </div>

        <!-- Mensaje de error o confirmación -->
        <p
          v-if="error"
          class="text-xs rounded-xl px-3 py-2"
          :class="error.startsWith('✓')
            ? 'text-[#50fa7b] bg-[#50fa7b]/10'
            : 'text-[#ff5555] bg-[#ff5555]/10'"
        >{{ error }}</p>

        <!-- Submit -->
        <button
          type="submit"
          :disabled="loading"
          class="w-full py-3 rounded-2xl text-sm font-semibold text-dracula-bg transition-opacity disabled:opacity-60"
          style="background: linear-gradient(135deg, #bd93f9, #ff79c6)"
        >
          {{ loading ? 'Cargando...' : (isRegister ? 'Crear cuenta' : 'Iniciar sesión') }}
        </button>
      </form>

      <!-- Divider -->
      <div class="flex items-center gap-3 my-5">
        <div class="flex-1 h-px bg-dracula-muted/20" />
        <span class="text-xs text-dracula-muted">o continuá con</span>
        <div class="flex-1 h-px bg-dracula-muted/20" />
      </div>

      <!-- Google OAuth -->
      <button
        class="w-full flex items-center justify-center gap-3 py-3 rounded-2xl bg-dracula-card border border-dracula-muted/20 text-sm font-medium text-dracula-text transition-colors hover:border-dracula-muted/40"
        @click="loginWithGoogle"
      >
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Google
      </button>

      <!-- Toggle registro -->
      <p class="text-center text-xs text-dracula-muted mt-5">
        {{ isRegister ? '¿Ya tenés cuenta?' : '¿No tenés cuenta?' }}
        <button class="text-dracula-purple font-semibold ml-1" @click="isRegister = !isRegister">
          {{ isRegister ? 'Iniciá sesión' : 'Registrate' }}
        </button>
      </p>
    </div>
  </div>
</template>
