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
    strategies: 'injectManifest',
    srcDir: '.',
    filename: 'sw.ts',
    pwaAssets: {
      config: true,
      overrideManifestIcons: true,
      includeHtmlHeadLinks: true,
      injectThemeColor: false,
    },
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
    },
    registerType: 'prompt',
    injectManifest: {
      globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff,woff2}'],
    },
    devOptions: {
      enabled: true,
      type: 'module',
    },
  } as any,
  app: {
    head: {
      meta: [
        { name: 'theme-color', content: '#282a36' },
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { name: 'apple-mobile-web-app-title', content: 'IAFinanzas' },
      ],
    },
  },
  css: ['~/assets/css/main.css'],
  vite: {
    plugins: [tailwindcss()],
  },
})
