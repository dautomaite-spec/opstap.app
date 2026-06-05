import { test, expect } from '@playwright/test'

test('privacy page renders', async ({ page }) => {
  await page.goto('/privacy')
  await expect(page.getByRole('heading', { name: /privacybeleid/i })).toBeVisible()
})

test('footer privacy link navigates correctly', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: /privacybeleid/i }).click()
  await expect(page).toHaveURL(/\/privacy/)
})
