<script setup lang="ts">
const route = useRoute()
const showSheet = useState('show-nuevo-sheet', () => false)

const activeTab = computed(() => {
  if (route.path.startsWith('/tickets')) return 'tickets'
  if (route.path.startsWith('/estadisticas')) return 'estadisticas'
  if (route.path.startsWith('/perfil')) return 'perfil'
  return 'dashboard'
})
</script>

<template>
  <nav class="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around bg-dracula-card border-t border-dracula-muted/20 pb-2">
    <NuxtLink
      to="/dashboard"
      class="flex flex-col items-center gap-1 px-3 py-2 min-h-[44px] justify-center text-xs font-medium transition-colors"
      :class="activeTab === 'dashboard' ? 'text-dracula-purple' : 'text-dracula-muted'"
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
      <span>Inicio</span>
    </NuxtLink>

    <NuxtLink
      to="/tickets"
      class="flex flex-col items-center gap-1 px-3 py-2 min-h-[44px] justify-center text-xs font-medium transition-colors"
      :class="activeTab === 'tickets' ? 'text-dracula-purple' : 'text-dracula-muted'"
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 12V7H5a2 2 0 010-4h14v4"/><path d="M3 5v14a2 2 0 002 2h16v-5"/><path d="M18 12a2 2 0 000 4h4v-4z"/>
      </svg>
      <span>Tickets</span>
    </NuxtLink>

    <!-- FAB central -->
    <button
      class="flex items-center justify-center w-14 h-14 rounded-full -mt-6 shadow-lg transition-transform active:scale-95"
      style="background: linear-gradient(135deg, #bd93f9, #ff79c6)"
      @click="showSheet = true"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round">
        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
    </button>

    <NuxtLink
      to="/estadisticas"
      class="flex flex-col items-center gap-1 px-3 py-2 min-h-[44px] justify-center text-xs font-medium transition-colors"
      :class="activeTab === 'estadisticas' ? 'text-dracula-purple' : 'text-dracula-muted'"
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
      <span>Stats</span>
    </NuxtLink>

    <NuxtLink
      to="/perfil"
      class="flex flex-col items-center gap-1 px-3 py-2 min-h-[44px] justify-center text-xs font-medium transition-colors"
      :class="activeTab === 'perfil' ? 'text-dracula-purple' : 'text-dracula-muted'"
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
      <span>Perfil</span>
    </NuxtLink>
  </nav>
</template>
