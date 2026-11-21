import { defineConfig, devices } from '@playwright/test'

// Egy böngésző, egy worker: a tesztek függetlenek, de ugyanazt a stacket használják.
export default defineConfig({
  testDir: './tests',
  workers: 1,
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost',
    // Hibánál a trace és a képernyőkép a riportban; a tesztadatok futásidőben generáltak, valódi adat nincs.
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
