import { test, expect } from '@playwright/test'

// The cookie banner is fixed to the bottom of the viewport and covers the
// footer links until dismissed — seed consent so it never renders.
test.beforeEach(async ({ context }) => {
  await context.addInitScript(() => {
    localStorage.setItem('opstap_cookie_consent', 'accepted')
  })
})

test('privacy page renders', async ({ page }) => {
  await page.goto('/privacy')
  await expect(page.getByRole('heading', { name: /privacybeleid/i })).toBeVisible()
})

test('footer privacy link navigates correctly', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: /privacyvoorwaarden/i }).first().click()
  await expect(page).toHaveURL(/\/privacy/)
})
