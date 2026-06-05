import { test, expect } from '@playwright/test'

test('home page renders with hero and CTAs', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /meer kansen/i })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Begin gratis' }).first()).toBeVisible()
  await expect(page.getByRole('link', { name: 'Inloggen' }).first()).toBeVisible()
})

test('OG image endpoint returns PNG', async ({ request }) => {
  const res = await request.get('/opengraph-image')
  expect(res.status()).toBe(200)
  expect(res.headers()['content-type']).toContain('image/png')
})
