import { test, expect } from '@playwright/test'

// KOMA LOGIN-UX (INCIDENT LOGIN):
// The "Hyr me Google" button must NOT be shown unless the Google provider is
// enabled (app_config.google_login_enabled). By default (flag off / unset, or
// no DB in CI) the button is hidden so users never hit "provider is not
// enabled". The email/phone login form must always render.
//
// i18n NOTE: the app auto-localizes UI text based on the visitor's language
// (cookie/localStorage/browser). CI browsers report a non-Albanian locale, so
// without pinning we'd race the runtime translator and the Albanian label
// "Hyr" could be swapped out. Pin the language to Albanian before any page
// script runs so this test asserts the canonical Albanian copy deterministically.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try {
      document.cookie = 'alpazar_lang=sq; path=/; max-age=31536000'
      localStorage.setItem('alpazar_lang', 'sq')
    } catch { /* storage may be unavailable pre-navigation */ }
  })
})

test('login: Google button hidden by default; email/phone login present', async ({ page }) => {
  const res = await page.goto('/auth/login', { waitUntil: 'domcontentloaded' })
  expect(res?.status(), 'login status').toBeLessThan(400)

  // Give the client a moment to resolve the app_config flag (stays false here).
  await page.waitForTimeout(1200)

  // Google button must be absent while the provider isn't enabled.
  await expect(page.getByRole('button', { name: /Hyr me Google/i })).toHaveCount(0)

  // The primary login affordance must exist (Albanian copy pinned above).
  await expect(page.getByRole('button', { name: /Hyr/i }).first()).toBeVisible()
})
