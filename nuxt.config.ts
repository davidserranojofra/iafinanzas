// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from '@tailwindcss/vite'

const appleSplashSizes = [
  { w: 640,  h: 1136, scale: 2 },
  { w: 750,  h: 1334, scale: 2 },
  { w: 828,  h: 1792, scale: 2 },
  { w: 1080, h: 2340, scale: 3 },
  { w: 1125, h: 2436, scale: 3 },
  { w: 1170, h: 2532, scale: 3 },
  { w: 1179, h: 2556, scale: 3 },
  { w: 1206, h: 2622, scale: 3 },
  { w: 1242, h: 2208, scale: 3 },
  { w: 1242, h: 2688, scale: 3 },
  { w: 1284, h: 2778, scale: 3 },
  { w: 1290, h: 2796, scale: 3 },
  { w: 1320, h: 2868, scale: 3 },
  { w: 1488, h: 2266, scale: 2 },
  { w: 1536, h: 2048, scale: 2 },
  { w: 1620, h: 2160, scale: 2 },
  { w: 1668, h: 2224, scale: 2 },
  { w: 1668, h: 2388, scale: 2 },
  { w: 2048, h: 2732, scale: 2 },
  { w: 2064, h: 2752, scale: 2 },
]

const appleSplashLinks = appleSplashSizes.flatMap(({ w, h, scale }) => {
  const logicalW = w / scale
  const logicalH = h / scale
  
  return [
    {
      rel: 'apple-touch-startup-image',
      href: `/apple-splash-portrait-${w}x${h}.png`,
      media: `screen and (device-width: ${logicalW}px) and (device-height: ${logicalH}px) and (-webkit-device-pixel-ratio: ${scale}) and (orientation: portrait)`
    },
    {
      rel: 'apple-touch-startup-image',
      href: `/apple-splash-landscape-${h}x${w}.png`,
      media: `screen and (device-width: ${logicalW}px) and (device-height: ${logicalH}px) and (-webkit-device-pixel-ratio: ${scale}) and (orientation: landscape)`
    }
  ]
})

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
      viewport: 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no',
      meta: [
        { name: 'theme-color', content: '#282a36' },
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { name: 'apple-mobile-web-app-title', content: 'IAFinanzas' },
      ],
      link: [
        ...appleSplashLinks
      ]
    },
  },
  css: ['~/assets/css/main.css'],
  vite: {
    plugins: [tailwindcss()],
  },
})
