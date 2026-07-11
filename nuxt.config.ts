import fs from 'node:fs'
import tailwindcss from '@tailwindcss/vite'

const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf-8'))

export default defineNuxtConfig({
    ssr: false,
    compatibilityDate: '2025-07-15',
    devtools: {enabled: true},
    modules: [
        '@nuxtjs/supabase',
        ...(!process.env.VITEST ? ['@vite-pwa/nuxt'] : [])
    ],
    supabase: {
        redirect: false,
        cookieOptions: {
            maxAge: 60 * 60 * 24 * 30, // 30 días
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
        }
    },
    runtimeConfig: {
        groqApiKey: process.env.NUXT_GROQ_API_KEY || '',
        vapidPrivateKey: process.env.NUXT_VAPID_PRIVATE_KEY || '',
        vapidEmail: process.env.NUXT_VAPID_EMAIL || '',
        cronSecret: process.env.NUXT_CRON_SECRET || 'super-cron-secret',
        public: {
            version: pkg.version || '0.1.0',
            vapidPublicKey: process.env.NUXT_PUBLIC_VAPID_PUBLIC_KEY || '',
        },
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
            viewport: 'width=device-width, initial-scale=1.0',
            meta: [
                {name: 'theme-color', content: '#282a36'},
                {name: 'mobile-web-app-capable', content: 'yes'},
                {name: 'apple-mobile-web-app-capable', content: 'yes'},
                {name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent'},
                {name: 'apple-mobile-web-app-title', content: 'IAFinanzas'},
            ],
        },
    },
    css: ['~/assets/css/main.css'],
    vite: {
        plugins: [tailwindcss()],
    },
    nitro: {
        // Optimiza la compresión para un despliegue más rápido en Vercel
        compressPublicAssets: true,
    },
})
