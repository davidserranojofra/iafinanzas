<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{
  error: NuxtError
}>()

const isDev = import.meta.dev
const showStack = ref(false)

const errorInfo = computed(() => {
  const code = props.error?.statusCode || 500
  
  if (code === 404) {
    return {
      title: '404 - Saldo no encontrado',
      description: 'Esta página gastó todo su presupuesto de existencia y ya no está acá. Te devaluaste de ruta, che.',
      subtitle: '¡La URL se fue volando!'
    }
  } else if (code === 403) {
    return {
      title: '403 - Fondos insuficientes de acceso',
      description: 'No tenés los permisos necesarios para ingresar a esta transacción.',
      subtitle: '¡Acceso bloqueado bajo llave!'
    }
  } else {
    return {
      title: `${code} - Quiebra del Servidor`,
      description: props.error?.message || 'El servidor acaba de patinar, declaró la quiebra y las monedas salieron volando.',
      subtitle: '¡Alerta de humo en la base de datos!'
    }
  }
})

const handleClearError = () => {
  clearError({ redirect: '/dashboard' })
}
</script>

<template>
  <div class="flex min-h-screen flex-col items-center justify-center bg-dracula-bg p-6 text-dracula-text font-sans selection:bg-dracula-pink/30">
    <!-- Fondo decorativo abstracto con animación de flotación -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-dracula-purple/10 blur-3xl animate-pulse"></div>
      <div class="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-dracula-pink/10 blur-3xl animate-pulse" style="animation-delay: 2s"></div>
    </div>

    <!-- Contenido principal -->
    <div class="z-10 w-full max-w-md rounded-3xl bg-dracula-card2/80 p-8 text-center border border-dracula-muted/30 shadow-2xl backdrop-blur-md">
      
      <!-- Ilustración Animada Graciosa según el tipo de error -->
      <div class="mb-8 flex justify-center">
        <div class="relative flex h-36 w-36 items-center justify-center rounded-full bg-dracula-bg/60 border border-dracula-purple/20 shadow-inner">
          
          <!-- Animación para 404 (Moneda volando - Se escapó el dinero) -->
          <div v-if="error?.statusCode === 404" class="relative flex items-center justify-center animate-float">
            <!-- Ala Izquierda -->
            <span class="absolute -left-9 top-1 text-4xl origin-right animate-wing-left">🪽</span>
            <!-- Moneda de Oro girando en 3D -->
            <span class="text-7xl select-none animate-spin-slow">🪙</span>
            <!-- Ala Derecha -->
            <span class="absolute -right-9 top-1 text-4xl origin-left animate-wing-right">🪽</span>
            <!-- Monedas pequeñas cayendo -->
            <span class="absolute -bottom-4 -left-2 text-sm animate-bounce-slow" style="animation-delay: 0.5s">💸</span>
            <span class="absolute -bottom-2 -right-4 text-sm animate-bounce-slow" style="animation-delay: 1s">💸</span>
          </div>

          <!-- Animación para 403 (Candado enojado que tiembla) -->
          <div v-else-if="error?.statusCode === 403" class="relative flex items-center justify-center animate-shake-angry">
            <!-- Candado Gigante -->
            <span class="text-7xl select-none">🔒</span>
            <!-- Chispas / Alerta de enojo -->
            <span class="absolute -top-3 -right-3 text-3xl animate-pulse">💢</span>
            <span class="absolute -top-2 -left-3 text-2xl animate-bounce-slow">🔑</span>
          </div>

          <!-- Animación para 500 y otros errores (Servidor prendido fuego y tirando humo) -->
          <div v-else class="relative flex items-center justify-center">
            <!-- Servidor / Monitor con pantallazo -->
            <span class="text-7xl select-none animate-glitch">💻</span>
            <!-- Fuego saliendo -->
            <span class="absolute -top-5 -right-2 text-3xl animate-flame">🔥</span>
            <!-- Humo flotando y desapareciendo -->
            <span class="absolute -top-6 -left-3 text-2xl animate-smoke">💨</span>
          </div>

        </div>
      </div>

      <!-- Subtítulo divertido -->
      <span class="text-xs font-bold uppercase tracking-widest text-dracula-pink">
        {{ errorInfo.subtitle }}
      </span>

      <!-- Título de error -->
      <h1 class="mt-2 bg-gradient-to-r from-dracula-purple to-dracula-pink bg-clip-text text-3xl font-extrabold tracking-tight text-transparent">
        {{ errorInfo.title }}
      </h1>

      <!-- Descripción principal -->
      <p class="mt-4 text-sm text-dracula-text/85 leading-relaxed">
        {{ errorInfo.description }}
      </p>

      <!-- Acción principal -->
      <div class="mt-8 flex flex-col gap-3">
        <button
          @click="handleClearError"
          class="flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-dracula-purple to-dracula-pink px-6 py-3.5 text-base font-bold text-dracula-bg shadow-lg hover:shadow-dracula-purple/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
        >
          Volver a salvo (Dashboard)
        </button>
      </div>

      <!-- Sección de depuración para desarrolladores en modo dev -->
      <div v-if="isDev && error?.stack" class="mt-6 w-full text-left border-t border-dracula-muted/20 pt-4">
        <button
          @click="showStack = !showStack"
          class="flex items-center gap-1.5 text-xs text-dracula-cyan hover:text-dracula-green transition-colors font-mono cursor-pointer"
        >
          <span>{{ showStack ? '▼' : '▶' }}</span>
          <span>{{ showStack ? 'Ocultar traza del error' : 'Mostrar traza del error (modo Dev)' }}</span>
        </button>
        
        <Transition name="expand">
          <div v-if="showStack" class="mt-3 overflow-hidden rounded-xl border border-dracula-muted/30 bg-dracula-bg/90 p-4 shadow-inner">
            <div class="mb-2 flex items-center justify-between text-[10px] text-dracula-muted uppercase tracking-wider font-mono">
              <span>Traza del error</span>
              <span class="text-dracula-pink">Modo Desarrollo</span>
            </div>
            <pre class="max-h-60 overflow-auto text-left text-xs font-mono text-dracula-pink whitespace-pre scrollbar-thin scrollbar-thumb-dracula-muted scrollbar-track-transparent">{{ error.stack }}</pre>
          </div>
        </Transition>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Animaciones CSS personalizadas */

/* 1. Flotación para el 404 */
@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-12px);
  }
}
.animate-float {
  animation: float 3s infinite ease-in-out;
}

/* Aleteo Izquierdo */
@keyframes wingLeft {
  0%, 100% {
    transform: rotate(0deg);
  }
  50% {
    transform: rotate(-35deg) translateY(-2px);
  }
}
.animate-wing-left {
  animation: wingLeft 0.4s infinite ease-in-out;
}

/* Aleteo Derecho */
@keyframes wingRight {
  0%, 100% {
    transform: rotate(0deg);
  }
  50% {
    transform: rotate(35deg) translateY(-2px);
  }
}
.animate-wing-right {
  animation: wingRight 0.4s infinite ease-in-out;
}

/* Giro 3D de la moneda */
@keyframes spin3D {
  0% {
    transform: rotateY(0deg);
  }
  100% {
    transform: rotateY(360deg);
  }
}
.animate-spin-slow {
  animation: spin3D 3s infinite linear;
  display: inline-block;
}

/* 2. Candado enojado (vibración rápida) */
@keyframes shakeAngry {
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  10%, 30%, 50%, 70%, 90% { transform: translate(-3px, -1px) rotate(-2deg); }
  25%, 45%, 65%, 85% { transform: translate(3px, 1px) rotate(2deg); }
}
.animate-shake-angry {
  animation: shakeAngry 1.2s infinite ease-in-out;
}

/* 3. Servidor con Glitch */
@keyframes glitch {
  0%, 100% { transform: translate(0, 0) scale(1); }
  92% { transform: translate(0, 0) scale(1); }
  94% { transform: translate(-2px, 2px) scale(1.02); filter: hue-rotate(90deg); }
  96% { transform: translate(2px, -2px) scale(0.98); filter: hue-rotate(180deg); }
  98% { transform: translate(-1px, -1px) scale(1.01); filter: hue-rotate(270deg); }
}
.animate-glitch {
  animation: glitch 2.5s infinite ease-in-out;
}

/* Fuego que flamea */
@keyframes flame {
  0%, 100% { transform: scale(1) translateY(0); }
  50% { transform: scale(1.15) translateY(-4px) skewX(-5deg); }
}
.animate-flame {
  animation: flame 0.8s infinite ease-in-out;
}

/* Humo que se eleva y desvanece */
@keyframes smoke {
  0% {
    transform: translate(0, 0) scale(0.8) rotate(0deg);
    opacity: 0;
  }
  30% {
    opacity: 0.8;
  }
  100% {
    transform: translate(-15px, -22px) scale(1.3) rotate(-15deg);
    opacity: 0;
  }
}
.animate-smoke {
  animation: smoke 2s infinite ease-out;
}

/* Rebotes genéricos lentos */
@keyframes bounceSlow {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}
.animate-bounce-slow {
  animation: bounceSlow 2.5s infinite ease-in-out;
}

/* Animación de expansión para la traza del error */
.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  max-height: 350px;
}

.expand-enter-from,
.expand-leave-to {
  max-height: 0;
  opacity: 0;
  transform: translateY(-8px);
}

/* Estilo para barra de scroll */
.scrollbar-thin::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
.scrollbar-thin::-webkit-scrollbar-thumb {
  background-color: var(--color-dracula-muted);
  border-radius: 3px;
}
.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}
</style>
