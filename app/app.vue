<script setup lang="ts">
const route = useRoute()
const showNav = computed(() => route.path !== '/login')
</script>

<template>
  <div class="min-h-screen bg-dracula-bg text-dracula-text font-sans">
    <NuxtPage />
    <LayoutBottomNav v-if="showNav" />
  </div>
</template>
