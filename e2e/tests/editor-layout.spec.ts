import { expect, test } from '@playwright/test'

import {
  addComponent,
  createPage,
  createWebsite,
  openPageSettings,
  signUp,
  uniqueId,
} from './helpers'

test('szerkesztő: tapadó eszköztár, mentési állapot és összecsukható oldalbeállítások', async ({
  page,
}) => {
  const id = uniqueId()
  await signUp(page)
  await createWebsite(page, `Webhely ${id}`, `webhely-${id}`)
  await createPage(page, `Oldal ${id}`, `oldal-${id}`)

  // Az oldalbeállítások alapból zártak: a tartalom azonnal elérhető, az összefoglaló látszik.
  const toggle = page.getByRole('button', { name: /Oldal beállításai/ })
  await expect(toggle).toHaveAttribute('aria-expanded', 'false')
  await expect(toggle).toContainText(`Oldal ${id}`)
  await expect(page.getByLabel('Cím', { exact: true })).toHaveCount(0)
  await expect(page.getByRole('button', { name: '+ Elem hozzáadása' })).toBeVisible()

  // Mentési állapot: mentve -> nem mentett módosítás -> mentve.
  const status = page.getByRole('status').filter({ hasText: /Mentve|Nem mentett/ })
  await expect(status).toHaveText('Mentve')
  await openPageSettings(page)
  await page.getByLabel('Cím', { exact: true }).fill(`Új ${id}`)
  await expect(status).toHaveText('Nem mentett módosítások')
  await page.getByRole('button', { name: 'Mentés', exact: true }).click()
  await expect(status).toHaveText('Mentve')
  await expect(toggle).toContainText(`Új ${id}`)

  // Hosszú tartalomnál az eszköztár görgetéskor is látszik.
  for (let i = 0; i < 8; i++) await addComponent(page, 'Szöveg')
  await page.mouse.wheel(0, 1500)
  await expect(page.getByRole('button', { name: 'Mentés', exact: true })).toBeInViewport()
})

test('szerkesztő: keskeny képernyőn nézetváltó, az előnézet külön nézet', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 })
  const id = uniqueId()
  await signUp(page)
  await createWebsite(page, `Webhely ${id}`, `webhely-${id}`)
  await createPage(page, `Oldal ${id}`, `oldal-${id}`)
  await addComponent(page, 'Címsor')

  const edit = page.getByRole('button', { name: 'Szerkesztés', exact: true })
  const preview = page.getByRole('button', { name: 'Előnézet', exact: true })
  await expect(edit).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('.preview')).toBeHidden()
  await expect(page.getByRole('button', { name: '+ Elem hozzáadása' })).toBeVisible()

  await preview.click()
  await expect(preview).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('.preview')).toBeVisible()
  await expect(page.getByRole('button', { name: '+ Elem hozzáadása' })).toBeHidden()

  // Az előnézetben egy elemre kattintva visszavált a szerkesztőre, és a komponens aktív.
  await page.locator('.preview h2, .preview h1').first().click()
  await expect(edit).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('.component--active')).toBeVisible()
})
