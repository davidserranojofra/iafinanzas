<script setup lang="ts">
definePageMeta({
  middleware: [
    (to) => {
      if (to.query.code) {
        return navigateTo({ path: '/confirm', query: { code: to.query.code } }, { replace: true })
      }
      const user = useSupabaseUser()
      return navigateTo(user.value ? '/dashboard' : '/login', { replace: true })
    },
  ],
})
</script>

<template><div /></template>
