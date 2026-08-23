import { defineConfig, devices } from '@playwright/test'

const PORT = 3000
const baseURL = `http://localhost:${PORT}`

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
    navigationTimeout: 30_000
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ],
  webServer: [
    {
      command: 'pnpm dev',
      url: baseURL,
      reuseExistingServer: true,
      timeout: 120_000
    },
    {
      command: 'pnpm --filter @taskflow/backend dev',
      url: 'http://localhost:3001/health',
      reuseExistingServer: true,
      timeout: 60_000
    }
  ]
})
