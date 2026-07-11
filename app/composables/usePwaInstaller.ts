import { ref, computed } from 'vue'

const deferredPrompt = ref<any>(null)
const isInstalled = ref(false)
const dismissedThisSession = ref(false)

if (import.meta.client) {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt.value = e
  })

  window.addEventListener('appinstalled', () => {
    deferredPrompt.value = null
    isInstalled.value = true
  })
}

export function usePwaInstaller() {
  const isAndroid = ref(false)
  const isIOS = ref(false)
  const isStandalone = ref(false)

  if (import.meta.client) {
    isAndroid.value = /Android/i.test(navigator.userAgent)
    isIOS.value = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    
    const isStandaloneMedia = window.matchMedia('(display-mode: standalone)').matches
    const isIOSStandalone = (navigator as any).standalone === true
    isStandalone.value = isStandaloneMedia || isIOSStandalone
  }

  const showPrompt = computed(() => {
    if (dismissedThisSession.value) return false
    if (isStandalone.value || isInstalled.value) return false
    
    if (import.meta.client) {
      const dismissed = localStorage.getItem('pwa-install-dismissed')
      if (dismissed) {
        const time = parseInt(dismissed, 10)
        // No mostrar por 24 horas
        if (Date.now() - time < 24 * 60 * 60 * 1000) {
          return false
        }
      }
    }
    
    if (isAndroid.value) {
      return deferredPrompt.value !== null
    }
    
    if (isIOS.value) {
      return true
    }
    
    return false
  })

  async function installAndroid() {
    if (!deferredPrompt.value) return
    deferredPrompt.value.prompt()
    const { outcome } = await deferredPrompt.value.userChoice
    if (outcome === 'accepted') {
      deferredPrompt.value = null
      isInstalled.value = true
    }
  }

  function dismiss() {
    dismissedThisSession.value = true
    if (import.meta.client) {
      localStorage.setItem('pwa-install-dismissed', Date.now().toString())
    }
  }

  return {
    isAndroid,
    isIOS,
    isStandalone,
    showPrompt,
    installAndroid,
    dismiss
  }
}
