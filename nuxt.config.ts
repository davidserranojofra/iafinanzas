// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/supabase', '@vite-pwa/nuxt'],
  supabase: {
    redirect: false,
  },
  runtimeConfig: {
    groqApiKey: '',
  },
  pwa: {
    manifest: {
      name: 'IAFinanzas',
      short_name: 'IAFinanzas',
      description: 'Gestión de tickets y finanzas personales con IA',
      lang: 'es',
      display: 'standalone',
      background_color: '#282a36',
      theme_color: '#282a36',
      start_url: '/',
      scope: '/',
      orientation: 'portrait',
      icons: [
        { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
        { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
        { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
        { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    registerType: 'prompt',
    workbox: {
      navigateFallback: '/',
      globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff,woff2}'],
      cleanupOutdatedCaches: true,
    },
    devOptions: {
      enabled: true,
      type: 'module',
    },
  },
  app: {
    head: {
      meta: [
        { name: 'theme-color', content: '#282a36' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { name: 'apple-mobile-web-app-title', content: 'IAFinanzas' },
      ],
      link: [
        { rel: 'icon', href: '/favicon.ico', sizes: 'any' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon-180x180.png' },
      ],
    },
  },
  css: ['~/assets/css/main.css'],
  vite: {
    plugins: [tailwindcss()],
  },
})
