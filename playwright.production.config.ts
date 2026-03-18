import { defineConfig, devices } from '@playwright/test'

/**
 * Smoke tests against the live Vercel deployment.
 * Run with: npm run test:production
 */
export default defineConfig({
  testDir: './tests/production',
  fullyParallel: false,
  retries: 2,
  workers: 1,
  reporter: [['html', { open: 'never' }], ['list']],

  use: {
    baseURL: 'https://energitjek.vercel.app',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    // Give external APIs more time
    actionTimeout: 30_000,
    navigationTimeout: 30_000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
