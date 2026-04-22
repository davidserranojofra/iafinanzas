<script setup lang="ts">
definePageMeta({
  middleware: [
    () => {
      const user = useSupabaseUser()
      return navigateTo(user.value ? '/dashboard' : '/login', { replace: true })
    },
  ],
})
</script>

<template><div /></template>
