import { randomUUID } from 'node:crypto'

import { expect, test } from '@playwright/test'

test('a bejelentkezési oldal betölt', async ({ page }) => {
  await page.goto('/login')

  await expect(page.getByRole('heading', { name: 'Bejelentkezés' })).toBeVisible()
})

// A Sanctum süti- és CSRF-útvonalát is igazolja a böngészőn át (SPA, API, adatbázis, Redis-session).
test('regisztráció után a webhelyek nézet jelenik meg', async ({ page }) => {
  const password = `Pw-${randomUUID()}`

  await page.goto('/register')
  await page.getByLabel('Név', { exact: true }).fill('E2E Próba')
  await page.getByLabel('E-mail-cím').fill(`e2e-${randomUUID()}@example.com`)
  await page.getByLabel('Jelszó', { exact: true }).fill(password)
  await page.getByLabel('Jelszó megerősítése').fill(password)
  await page.getByRole('button', { name: 'Regisztráció' }).click()

  await expect(page.getByRole('heading', { name: 'Webhelyeim' })).toBeVisible()
})
