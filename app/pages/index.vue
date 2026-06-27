<script setup lang="ts">
definePageMeta({
  middleware: [
    async (to) => {
      if (to.query.code) {
        return navigateTo({ path: '/confirm', query: { code: to.query.code } }, { replace: true })
      }
      const user = useSupabaseUser()
      if (!user.value) {
        const supabase = useSupabaseClient()
        await supabase.auth.getSession()
      }
      return navigateTo(user.value ? '/dashboard' : '/login', { replace: true })
    },
  ],
})
</script>

<template><div /></template>
