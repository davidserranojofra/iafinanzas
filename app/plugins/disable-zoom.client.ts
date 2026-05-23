export default defineNuxtPlugin(() => {
  if (!import.meta.client) return

  // Bloquear pinch-to-zoom (gesto de pellizco con dos dedos)
  document.addEventListener('touchstart', (event) => {
    if (event.touches.length > 1) {
      event.preventDefault()
    }
  }, { passive: false })

  // Bloquear gesturestart en Safari/iOS (evita el zoom nativo del sistema)
  document.addEventListener('gesturestart', (event) => {
    event.preventDefault()
  })
})
