<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const user = useSupabaseUser()
const supabase = useSupabaseClient()
const loggingOut = ref(false)
const { isDark, setDark, setLight } = useTheme()

const initials = computed(() => {
  const name = user.value?.user_metadata?.nombre ?? ''
  return name
    ? name.split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase()
    : user.value?.email?.[0]?.toUpperCase() ?? '?'
})

const nombre = computed(() =>
  user.value?.user_metadata?.nombre ?? user.value?.email?.split('@')[0] ?? '',
)

const email = computed(() => user.value?.email ?? '')

const secciones = [
  { label: 'Mis datos', icon: 'person', to: '/perfil/datos' },
  { label: 'Seguridad', icon: 'lock', to: '/perfil/seguridad' },
  { label: 'Métodos de pago', icon: 'card', to: '/perfil/pagos' },
  { label: 'Motor de IA', icon: 'sparkles', to: '/perfil/ia' },
]

async function handleLogout() {
  loggingOut.value = true
  try {
    await supabase.auth.signOut()
    await navigateTo('/login')
  } finally {
    loggingOut.value = false
  }
}
</script>

<template>
  <div class="flex flex-col min-h-screen bg-dracula-bg pb-24">
    <!-- Header -->
    <div class="px-4 pt-12 pb-6 flex items-center justify-between">
      <h1 class="text-xl font-bold text-dracula-text">Perfil</h1>

      <!-- Theme toggle -->
      <div class="flex items-center gap-1 bg-dracula-card2 rounded-2xl p-1">
        <!-- Sun — light mode -->
        <button
          class="flex items-center justify-center w-9 h-9 rounded-xl transition-colors"
          :class="!isDark ? 'bg-dracula-card shadow-sm' : 'text-dracula-muted'"
          @click="setLight"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" :class="!isDark ? 'text-dracula-yellow' : ''">
            <circle cx="12" cy="12" r="5"/>
            <line x1="12" y1="1" x2="12" y2="3"/>
            <line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1" y1="12" x2="3" y2="12"/>
            <line x1="21" y1="12" x2="23" y2="12"/>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
          </svg>
        </button>

        <!-- Moon — dark mode -->
        <button
          class="flex items-center justify-center w-9 h-9 rounded-xl transition-colors"
          :class="isDark ? 'bg-dracula-card shadow-sm' : 'text-dracula-muted'"
          @click="setDark"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" :class="isDark ? 'text-dracula-purple' : ''">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Avatar + datos -->
    <div class="flex flex-col items-center gap-3 px-4 pb-8">
      <div
        class="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-dracula-bg shadow-lg"
        style="background: linear-gradient(135deg, #bd93f9, #ff79c6)"
      >
        {{ initials }}
      </div>
      <div class="text-center">
        <p class="text-lg font-semibold text-dracula-text capitalize">{{ nombre }}</p>
        <p class="text-sm text-dracula-muted">{{ email }}</p>
      </div>
    </div>

    <!-- Secciones -->
    <div class="flex flex-col gap-2 px-4">
      <NuxtLink
        v-for="s in secciones"
        :key="s.to"
        :to="s.to"
        class="flex items-center gap-4 bg-dracula-card2 rounded-2xl px-4 py-4 min-h-[56px] transition-colors active:bg-dracula-card"
      >
        <div class="w-9 h-9 rounded-xl bg-dracula-card flex items-center justify-center flex-shrink-0">
          <svg v-if="s.icon === 'person'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#bd93f9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
          </svg>
          <svg v-else-if="s.icon === 'lock'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#bd93f9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
          </svg>
          <svg v-else-if="s.icon === 'card'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#bd93f9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
          </svg>
          <svg v-else-if="s.icon === 'sparkles'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#50fa7b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
          </svg>
        </div>

        <span class="flex-1 text-sm font-medium text-dracula-text">{{ s.label }}</span>

        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-dracula-muted">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </NuxtLink>
    </div>

    <!-- Logout -->
    <div class="px-4 mt-6">
      <button
        class="w-full py-4 rounded-2xl text-sm font-semibold text-dracula-red bg-dracula-red/10 border border-dracula-red/20 transition-opacity"
        :class="loggingOut ? 'opacity-50 cursor-not-allowed' : 'active:opacity-70'"
        :disabled="loggingOut"
        @click="handleLogout"
      >
        {{ loggingOut ? 'Cerrando sesión...' : 'Cerrar sesión' }}
      </button>
    </div>

    <p class="text-center text-xs text-dracula-muted/50 mt-6">Cartera v0.1.0</p>
  </div>
</template>
