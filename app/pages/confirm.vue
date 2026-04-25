<script setup lang="ts">
definePageMeta({ middleware: [] })

const supabase = useSupabaseClient()
const route = useRoute()

onMounted(async () => {
  const code = route.query.code as string | undefined
  if (code) {
    await supabase.auth.exchangeCodeForSession(code)
  }
  window.location.replace('/dashboard')
})
</script>

<template>
  <div class="flex items-center justify-center min-h-screen bg-dracula-bg">
    <div class="flex flex-col items-center gap-3">
      <div class="w-10 h-10 rounded-full border-2 border-dracula-purple border-t-transparent animate-spin" />
      <p class="text-sm text-dracula-muted">Iniciando sesión...</p>
    </div>
  </div>
</template>
