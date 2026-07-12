import { test, expect } from '@playwright/test'

test('login page renders form', async ({ page }) => {
  await page.goto('/login')
  await expect(page.getByRole('heading', { name: /inloggen/i })).toBeVisible()
  await expect(page.getByLabel(/e-mail/i)).toBeVisible()
  await expect(page.getByLabel(/wachtwoord/i)).toBeVisible()
  await expect(page.getByRole('button', { name: /inloggen/i })).toBeVisible()
})

test('register page renders form', async ({ page }) => {
  await page.goto('/register')
  await expect(page.getByRole('heading', { name: /account aanmaken/i })).toBeVisible()
  await expect(page.getByLabel(/e-mail/i)).toBeVisible()
  await expect(page.getByRole('button', { name: /account aanmaken/i })).toBeVisible()
})

test('login with bad credentials shows error', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel(/e-mail/i).fill('nobody@example.com')
  await page.getByLabel(/wachtwoord/i).fill('wrongpassword')
  await page.getByRole('button', { name: /inloggen/i }).click()
  await expect(page.getByText(/ongeldig|onjuist|incorrect|fout/i)).toBeVisible({ timeout: 8000 })
})

test('unauthenticated dashboard redirects to login', async ({ page }) => {
  await page.goto('/dashboard')
  await expect(page).toHaveURL(/\/login/)
})

test('nav link from home to login works', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: 'Inloggen' }).first().click()
  await expect(page).toHaveURL(/\/login/)
})

test('nav link from home to register works', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: 'Maak een account' }).first().click()
  await expect(page).toHaveURL(/\/register/)
})
