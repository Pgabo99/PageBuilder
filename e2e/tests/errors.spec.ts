import { expect, test } from '@playwright/test'

import { createWebsite, signUp, uniqueId } from './helpers'

test('hibás belépés: hibaüzenet, nincs munkamenet', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('E-mail-cím').fill(`nincs-${uniqueId()}@example.com`)
  await page.getByLabel('Jelszó', { exact: true }).fill('rossz-jelszo')
  await page.getByRole('button', { name: 'Bejelentkezés' }).click()

  await expect(page.getByText('These credentials do not match our records.')).toBeVisible()
  await expect(page).toHaveURL(/\/login$/)

  // Nem jött létre munkamenet: a védett útvonal a belépéshez irányít, az API pedig 401-et ad.
  await page.goto('/')
  await expect(page).toHaveURL(/\/login/)
  const user = await page.request.get('/api/v1/user', { headers: { Accept: 'application/json' } })
  expect(user.status()).toBe(401)
})

test('oldal nélküli webhely publikálása: hibaüzenet, az állapot nem változik', async ({ page }) => {
  const id = uniqueId()
  const slug = `ures-${id}`

  await signUp(page)
  await createWebsite(page, `Üres webhely ${id}`, slug)
  const websiteUrl = page.url()

  await page.getByRole('button', { name: 'Publikálás', exact: true }).click()

  await expect(
    page.getByRole('alert').filter({ hasText: 'A webhelynek nincs oldala.' }),
  ).toBeVisible()
  await expect(page.getByRole('status').filter({ hasText: 'Még nincs publikálva.' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Megnyitás az új lapon' })).toHaveCount(0)

  // Oldalfrissítés után is publikálatlan, és nincs publikált tartalom.
  await page.goto(websiteUrl)
  await expect(page.getByRole('status').filter({ hasText: 'Még nincs publikálva.' })).toBeVisible()
  const published = await page.request.get(`/sites/${slug}/`)
  expect(published.status()).toBe(404)
})
