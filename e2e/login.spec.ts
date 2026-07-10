import { test, expect } from '@playwright/test'

// KOMA LOGIN-UX (INCIDENT LOGIN):
// The "Hyr me Google" button must NOT be shown unless the Google provider is
// enabled (app_config.google_login_enabled). By default (flag off / unset, or
// no DB in CI) the button is hidden so users never hit "provider is not
// enabled". The email/phone login form must always render.
test('login: Google button hidden by default; email/phone login present', async ({ page }) => {
  const res = await page.goto('/auth/login', { waitUntil: 'domcontentloaded' })
  expect(res?.status(), 'login status').toBeLessThan(400)

  // Give the client a moment to resolve the app_config flag (stays false here).
  await page.waitForTimeout(1200)

  // Google button must be absent while the provider isn't enabled.
  await expect(page.getByRole('button', { name: /Hyr me Google/i })).toHaveCount(0)

  // The primary login affordance must exist.
  await expect(page.getByRole('button', { name: /Hyr/i }).first()).toBeVisible()
})
