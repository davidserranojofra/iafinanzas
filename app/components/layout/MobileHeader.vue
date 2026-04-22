<script setup lang="ts">
defineProps<{
  title?: string
  showBack?: boolean
  showAvatar?: boolean
}>()
</script>

<template>
  <header class="flex items-center justify-between px-4 pt-safe pb-3 min-h-[56px]">
    <button v-if="showBack" class="flex items-center justify-center w-10 h-10 rounded-2xl bg-dracula-card2 text-dracula-text" @click="$router.back()">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="15 18 9 12 15 6"/>
      </svg>
    </button>
    <div v-else class="w-10" />

    <h1 v-if="title" class="text-base font-semibold text-dracula-text">{{ title }}</h1>

    <NuxtLink v-if="showAvatar" to="/perfil" class="flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold text-dracula-bg" style="background: linear-gradient(135deg, #bd93f9, #ff79c6)">
      AG
    </NuxtLink>
    <div v-else class="w-10" />
  </header>
</template>
