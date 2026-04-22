<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
</script>

<template>
  <div class="flex flex-col min-h-screen bg-[#282a36]">
    <!-- Overlay oscuro -->
    <div class="flex-1" @click="navigateTo('/tickets')" />

    <!-- Bottom sheet -->
    <div class="bg-[#383a4a] rounded-t-3xl px-4 pt-5 pb-10 border-t border-[#6272a4]/20">
      <!-- Handle -->
      <div class="w-10 h-1 rounded-full bg-[#6272a4]/40 mx-auto mb-6" />

      <h2 class="text-lg font-bold text-[#f8f8f2] mb-2">Añadir ticket</h2>
      <p class="text-sm text-[#6272a4] mb-6">¿Cómo querés registrarlo?</p>

      <div class="flex flex-col gap-3">
        <!-- Escanear con IA (opción destacada) -->
        <NuxtLink
          to="/tickets/escanear"
          class="flex items-center gap-4 p-4 rounded-2xl border transition-colors"
          style="background: rgba(80,250,123,0.08); border-color: rgba(80,250,123,0.3)"
        >
          <div class="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0" style="background: rgba(80,250,123,0.15)">
            📸
          </div>
          <div class="flex-1">
            <div class="flex items-center gap-2">
              <p class="text-sm font-semibold text-[#f8f8f2]">Escanear con IA</p>
              <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#50fa7b]/20 text-[#50fa7b]">RECOMENDADO</span>
            </div>
            <p class="text-xs text-[#6272a4] mt-0.5">Sacá una foto y la IA extrae los datos automáticamente</p>
          </div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#50fa7b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </NuxtLink>

        <!-- Manual -->
        <NuxtLink
          to="/tickets/manual"
          class="flex items-center gap-4 p-4 rounded-2xl bg-[#44475a] border border-[#6272a4]/20 transition-colors"
        >
          <div class="w-12 h-12 rounded-2xl bg-[#6272a4]/15 flex items-center justify-center text-2xl flex-shrink-0">
            ✏️
          </div>
          <div class="flex-1">
            <p class="text-sm font-semibold text-[#f8f8f2]">Formulario manual</p>
            <p class="text-xs text-[#6272a4] mt-0.5">Ingresá los datos a mano</p>
          </div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6272a4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
