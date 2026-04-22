<script setup lang="ts">
import type { TicketCategoria } from '~/types'

defineProps<{
  categoria: TicketCategoria
  size?: number
}>()
</script>

<template>
  <div :style="{ width: `${size ?? 90}px`, height: `${size ?? 90}px` }" class="flex items-center justify-center">
    <!-- Alimentación -->
    <svg v-if="categoria === 'Alimentación'" :width="size ?? 90" :height="size ?? 90" viewBox="0 0 90 90" fill="none">
      <circle cx="45" cy="45" r="40" fill="#50fa7b" fill-opacity="0.12"/>
      <ellipse cx="45" cy="58" rx="18" ry="10" fill="#50fa7b" fill-opacity="0.3"/>
      <path d="M32 52 Q45 38 58 52" stroke="#50fa7b" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <circle cx="36" cy="42" r="5" fill="#f1fa8c"/>
      <circle cx="45" cy="38" r="6" fill="#ff79c6"/>
      <circle cx="54" cy="42" r="5" fill="#50fa7b"/>
      <path d="M30 55 h30" stroke="#50fa7b" stroke-width="2" stroke-linecap="round"/>
    </svg>

    <!-- Transporte -->
    <svg v-else-if="categoria === 'Transporte'" :width="size ?? 90" :height="size ?? 90" viewBox="0 0 90 90" fill="none">
      <circle cx="45" cy="45" r="40" fill="#8be9fd" fill-opacity="0.12"/>
      <rect x="20" y="40" width="50" height="22" rx="6" fill="#8be9fd" fill-opacity="0.3"/>
      <rect x="24" y="32" width="32" height="14" rx="4" fill="#8be9fd" fill-opacity="0.5"/>
      <circle cx="31" cy="65" r="6" fill="#44475a" stroke="#8be9fd" stroke-width="2"/>
      <circle cx="31" cy="65" r="2.5" fill="#8be9fd"/>
      <circle cx="59" cy="65" r="6" fill="#44475a" stroke="#8be9fd" stroke-width="2"/>
      <circle cx="59" cy="65" r="2.5" fill="#8be9fd"/>
      <rect x="26" y="35" width="10" height="8" rx="2" fill="#282a36" fill-opacity="0.5"/>
      <rect x="39" y="35" width="10" height="8" rx="2" fill="#282a36" fill-opacity="0.5"/>
      <line x1="14" y1="62" x2="20" y2="62" stroke="#8be9fd" stroke-width="2" stroke-linecap="round"/>
      <line x1="70" y1="62" x2="76" y2="62" stroke="#8be9fd" stroke-width="2" stroke-linecap="round"/>
    </svg>

    <!-- Ropa -->
    <svg v-else-if="categoria === 'Ropa'" :width="size ?? 90" :height="size ?? 90" viewBox="0 0 90 90" fill="none">
      <circle cx="45" cy="45" r="40" fill="#ff79c6" fill-opacity="0.12"/>
      <path d="M30 30 L20 45 L33 45 L33 68 L57 68 L57 45 L70 45 L60 30 L52 36 C50 38 48 39 45 39 C42 39 40 38 38 36 Z" fill="#ff79c6" fill-opacity="0.3" stroke="#ff79c6" stroke-width="2" stroke-linejoin="round"/>
      <circle cx="45" cy="32" r="5" fill="#44475a" stroke="#ff79c6" stroke-width="2"/>
      <line x1="40" y1="52" x2="50" y2="52" stroke="#ff79c6" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="40" y1="57" x2="50" y2="57" stroke="#ff79c6" stroke-width="1.5" stroke-linecap="round"/>
    </svg>

    <!-- Restaurantes -->
    <svg v-else-if="categoria === 'Restaurantes'" :width="size ?? 90" :height="size ?? 90" viewBox="0 0 90 90" fill="none">
      <circle cx="45" cy="45" r="40" fill="#ffb86c" fill-opacity="0.12"/>
      <circle cx="45" cy="48" r="18" fill="#ffb86c" fill-opacity="0.25" stroke="#ffb86c" stroke-width="2"/>
      <circle cx="45" cy="48" r="12" fill="#ffb86c" fill-opacity="0.2"/>
      <line x1="45" y1="25" x2="45" y2="30" stroke="#ffb86c" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="28" y1="48" x2="22" y2="48" stroke="#ffb86c" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="62" y1="48" x2="68" y2="48" stroke="#ffb86c" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M38 38 Q45 34 52 38" stroke="#ffb86c" stroke-width="2" fill="none" stroke-linecap="round"/>
      <line x1="32" y1="68" x2="58" y2="68" stroke="#ffb86c" stroke-width="2.5" stroke-linecap="round"/>
    </svg>

    <!-- Suscripciones -->
    <svg v-else-if="categoria === 'Suscripciones'" :width="size ?? 90" :height="size ?? 90" viewBox="0 0 90 90" fill="none">
      <circle cx="45" cy="45" r="40" fill="#bd93f9" fill-opacity="0.12"/>
      <rect x="18" y="30" width="54" height="36" rx="6" fill="#bd93f9" fill-opacity="0.2" stroke="#bd93f9" stroke-width="2"/>
      <circle cx="45" cy="48" r="10" fill="#bd93f9" fill-opacity="0.3"/>
      <path d="M41 48 L41 44 L50 48 L41 52 Z" fill="#bd93f9"/>
      <line x1="18" y1="38" x2="72" y2="38" stroke="#bd93f9" stroke-width="1.5" stroke-opacity="0.4"/>
    </svg>

    <!-- Salud -->
    <svg v-else-if="categoria === 'Salud'" :width="size ?? 90" :height="size ?? 90" viewBox="0 0 90 90" fill="none">
      <circle cx="45" cy="45" r="40" fill="#ff5555" fill-opacity="0.12"/>
      <path d="M45 62 C45 62 24 50 24 37 C24 30 30 25 37 27 C40 28 43 30 45 33 C47 30 50 28 53 27 C60 25 66 30 66 37 C66 50 45 62 45 62Z" fill="#ff5555" fill-opacity="0.3" stroke="#ff5555" stroke-width="2"/>
      <line x1="45" y1="33" x2="45" y2="45" stroke="#ff5555" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="39" y1="39" x2="51" y2="39" stroke="#ff5555" stroke-width="2.5" stroke-linecap="round"/>
    </svg>

    <!-- Hogar -->
    <svg v-else-if="categoria === 'Hogar'" :width="size ?? 90" :height="size ?? 90" viewBox="0 0 90 90" fill="none">
      <circle cx="45" cy="45" r="40" fill="#f1fa8c" fill-opacity="0.12"/>
      <path d="M45 22 L18 45 L24 45 L24 68 L66 68 L66 45 L72 45 Z" fill="#f1fa8c" fill-opacity="0.25" stroke="#f1fa8c" stroke-width="2" stroke-linejoin="round"/>
      <rect x="38" y="52" width="14" height="16" rx="2" fill="#44475a" stroke="#f1fa8c" stroke-width="1.5"/>
      <rect x="28" y="48" width="10" height="10" rx="2" fill="#f1fa8c" fill-opacity="0.4"/>
      <rect x="52" y="48" width="10" height="10" rx="2" fill="#f1fa8c" fill-opacity="0.4"/>
      <circle cx="44" cy="60" r="1.5" fill="#f1fa8c"/>
    </svg>

    <!-- Ocio -->
    <svg v-else-if="categoria === 'Ocio'" :width="size ?? 90" :height="size ?? 90" viewBox="0 0 90 90" fill="none">
      <circle cx="45" cy="45" r="40" fill="#bd93f9" fill-opacity="0.12"/>
      <rect x="20" y="36" width="50" height="28" rx="14" fill="#bd93f9" fill-opacity="0.25" stroke="#bd93f9" stroke-width="2"/>
      <circle cx="33" cy="50" r="6" fill="#bd93f9" fill-opacity="0.3"/>
      <line x1="30" y1="50" x2="36" y2="50" stroke="#bd93f9" stroke-width="2" stroke-linecap="round"/>
      <line x1="33" y1="47" x2="33" y2="53" stroke="#bd93f9" stroke-width="2" stroke-linecap="round"/>
      <circle cx="57" cy="47" r="2.5" fill="#ff79c6"/>
      <circle cx="64" cy="50" r="2.5" fill="#8be9fd"/>
      <circle cx="57" cy="53" r="2.5" fill="#f1fa8c"/>
      <circle cx="50" cy="50" r="2.5" fill="#50fa7b"/>
      <rect x="40" y="40" width="6" height="3" rx="1.5" fill="#bd93f9" fill-opacity="0.6"/>
    </svg>

    <!-- Tecnología -->
    <svg v-else-if="categoria === 'Tecnología'" :width="size ?? 90" :height="size ?? 90" viewBox="0 0 90 90" fill="none">
      <circle cx="45" cy="45" r="40" fill="#8be9fd" fill-opacity="0.12"/>
      <rect x="20" y="30" width="50" height="34" rx="5" fill="#8be9fd" fill-opacity="0.2" stroke="#8be9fd" stroke-width="2"/>
      <rect x="25" y="35" width="40" height="24" rx="3" fill="#282a36"/>
      <line x1="35" y1="68" x2="55" y2="68" stroke="#8be9fd" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="29" y1="41" x2="38" y2="41" stroke="#50fa7b" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="29" y1="46" x2="44" y2="46" stroke="#8be9fd" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="29" y1="51" x2="40" y2="51" stroke="#bd93f9" stroke-width="1.5" stroke-linecap="round"/>
    </svg>

    <!-- Otro -->
    <svg v-else :width="size ?? 90" :height="size ?? 90" viewBox="0 0 90 90" fill="none">
      <circle cx="45" cy="45" r="40" fill="#6272a4" fill-opacity="0.15"/>
      <rect x="28" y="25" width="34" height="44" rx="5" fill="#6272a4" fill-opacity="0.25" stroke="#6272a4" stroke-width="2"/>
      <line x1="34" y1="36" x2="56" y2="36" stroke="#6272a4" stroke-width="2" stroke-linecap="round"/>
      <line x1="34" y1="44" x2="56" y2="44" stroke="#6272a4" stroke-width="2" stroke-linecap="round"/>
      <line x1="34" y1="52" x2="48" y2="52" stroke="#6272a4" stroke-width="2" stroke-linecap="round"/>
      <path d="M30 22 L30 18 L60 18 L60 22" stroke="#6272a4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  </div>
</template>
