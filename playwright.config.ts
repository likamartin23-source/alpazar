import { defineConfig } from '@playwright/test'

// Smoke e2e: boots the production build and checks key public pages render.
// Would have caught outages like "Event handlers in a Server Component".
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    // CI uses the browser from `npx playwright install`. Set PW_EXECUTABLE_PATH
    // to run against a pre-installed Chromium in sandboxed environments.
    ...(process.env.PW_EXECUTABLE_PATH
      ? { launchOptions: { executablePath: process.env.PW_EXECUTABLE_PATH } }
      : {}),
  },
  webServer: {
    command: 'npm run build && npm start',
    port: 3000,
    timeout: 180_000,
    reuseExistingServer: !process.env.CI,
  },
})
