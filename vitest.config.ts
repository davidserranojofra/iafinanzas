import { defineVitestConfig } from '@nuxt/test-utils/config'

process.env.NUXT_PUBLIC_SUPABASE_URL = 'https://placeholder-project.supabase.co'
process.env.NUXT_PUBLIC_SUPABASE_KEY = 'placeholder-key-value'

export default defineVitestConfig({
  test: {
    environment: 'nuxt',
    setupFiles: ['./tests/setup.ts'],
    env: {
      NUXT_PUBLIC_SUPABASE_URL: 'https://placeholder-project.supabase.co',
      NUXT_PUBLIC_SUPABASE_KEY: 'placeholder-key-value',
    }
  }
})
