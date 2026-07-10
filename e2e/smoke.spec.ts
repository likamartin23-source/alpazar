import { test, expect } from '@playwright/test'

// Each public page must return 200 and render a key element — a page that
// throws at render (e.g. a Server/Client component boundary bug) fails here
// instead of in production.
const PAGES = ['/', '/auth/login', '/search', '/premium', '/biznese']

for (const path of PAGES) {
  test(`page ${path} renders`, async ({ page }) => {
    const res = await page.goto(path, { waitUntil: 'domcontentloaded' })
    expect(res?.status(), `status for ${path}`).toBeLessThan(400)
    // The app shell always renders a <body> with content; assert it's non-empty.
    await expect(page.locator('body')).toBeVisible()
    const text = (await page.locator('body').innerText()).trim()
    expect(text.length, `visible text on ${path}`).toBeGreaterThan(0)
  })
}
