import { defineConfig, devices } from '@playwright/test'

/**
 * E2E del frontend en un navegador real (Chromium). La API y Supabase se
 * sustituyen a nivel de RED con page.route (ver e2e/support/fake-backend.ts):
 * el código de la app corre completo (router, React Query, useChat, parser del
 * stream del Vercel AI SDK), pero la prueba no depende de Gemini ni de
 * Supabase reales, así que es determinista y no gasta cuota.
 */
const PORT = 4173

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    locale: 'es-GT',
    timezoneId: 'America/Guatemala',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `pnpm exec vite --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      // Hosts ficticios: si algo se escapara de page.route, fallaría en vez
      // de llegar a un servicio real.
      VITE_API_URL: 'http://api.e2e.invalid/api/v1',
      VITE_SUPABASE_URL: 'https://e2e.supabase.invalid',
      VITE_SUPABASE_ANON_KEY: 'e2e-anon-key',
    },
  },
})
