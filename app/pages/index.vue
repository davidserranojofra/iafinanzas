<script setup lang="ts">
definePageMeta({
  middleware: [
    async (to) => {
      if (to.query.code) {
        return navigateTo({ path: '/confirm', query: { code: to.query.code } }, { replace: true })
      }
      const user = useSupabaseUser()
      let sessionExists = false
      if (!user.value) {
        const supabase = useSupabaseClient()
        const { data } = await supabase.auth.getSession()
        if (data?.session) {
          sessionExists = true
        }
      } else {
        sessionExists = true
      }
      return navigateTo(sessionExists ? '/dashboard' : '/login', { replace: true })
    },
  ],
})
</script>

<template><div /></template>
