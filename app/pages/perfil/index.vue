<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const user = useSupabaseUser()
const supabase = useSupabaseClient()
const loggingOut = ref(false)

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
  <div class="flex flex-col min-h-screen bg-[#282a36] pb-24">
    <!-- Header -->
    <div class="px-4 pt-12 pb-6">
      <h1 class="text-xl font-bold text-[#f8f8f2]">Perfil</h1>
    </div>

    <!-- Avatar + datos -->
    <div class="flex flex-col items-center gap-3 px-4 pb-8">
      <div
        class="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-[#282a36] shadow-lg"
        style="background: linear-gradient(135deg, #bd93f9, #ff79c6)"
      >
        {{ initials }}
      </div>
      <div class="text-center">
        <p class="text-lg font-semibold text-[#f8f8f2] capitalize">{{ nombre }}</p>
        <p class="text-sm text-[#6272a4]">{{ email }}</p>
      </div>
    </div>

    <!-- Secciones -->
    <div class="flex flex-col gap-2 px-4">
      <NuxtLink
        v-for="s in secciones"
        :key="s.to"
        :to="s.to"
        class="flex items-center gap-4 bg-[#383a4a] rounded-2xl px-4 py-4 min-h-[56px] transition-colors active:bg-[#44475a]"
      >
        <!-- Icono -->
        <div class="w-9 h-9 rounded-xl bg-[#44475a] flex items-center justify-center flex-shrink-0">
          <!-- person -->
          <svg v-if="s.icon === 'person'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#bd93f9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
          </svg>
          <!-- lock -->
          <svg v-else-if="s.icon === 'lock'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#bd93f9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
          </svg>
          <!-- card -->
          <svg v-else-if="s.icon === 'card'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#bd93f9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
          </svg>
          <!-- sparkles -->
          <svg v-else-if="s.icon === 'sparkles'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#50fa7b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
          </svg>
        </div>

        <span class="flex-1 text-sm font-medium text-[#f8f8f2]">{{ s.label }}</span>

        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6272a4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </NuxtLink>
    </div>

    <!-- Logout -->
    <div class="px-4 mt-6">
      <button
        class="w-full py-4 rounded-2xl text-sm font-semibold text-[#ff5555] bg-[#ff5555]/10 border border-[#ff5555]/20 transition-opacity"
        :class="loggingOut ? 'opacity-50 cursor-not-allowed' : 'active:opacity-70'"
        :disabled="loggingOut"
        @click="handleLogout"
      >
        {{ loggingOut ? 'Cerrando sesión...' : 'Cerrar sesión' }}
      </button>
    </div>

    <!-- Versión -->
    <p class="text-center text-xs text-[#6272a4]/50 mt-6">Cartera v0.1.0</p>
  </div>
</template>
