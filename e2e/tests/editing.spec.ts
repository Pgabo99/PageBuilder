import { expect, test } from '@playwright/test'

import { addComponent, createPage, createWebsite, savePage, signUp, uniqueId } from './helpers'

test('szerkesztés és mentés: a tartalom oldalfrissítés után is megmarad', async ({ page }) => {
  const id = uniqueId()
  const heading = `Címsor ${id}`
  const text = `Bekezdés ${id}`
  const buttonLabel = `Gomb ${id}`
  const buttonUrl = `https://example.com/${id}`

  await signUp(page)
  await createWebsite(page, `Webhely ${id}`, `webhely-${id}`)
  await createPage(page, `Oldal ${id}`, `oldal-${id}`)

  // Egyszerre egy komponens nyitott: az újonnan hozzáadott lesz az aktív, ezért felvétel után azonnal kitöltjük.
  await addComponent(page, 'Címsor')
  await page.getByLabel('Szöveg', { exact: true }).fill(heading)
  await addComponent(page, 'Szöveg')
  await page.getByLabel('Szöveg', { exact: true }).fill(text)
  await addComponent(page, 'Gomb')
  await page.getByLabel('Felirat').fill(buttonLabel)
  await page.getByLabel(/^Cél/).fill(buttonUrl)
  await savePage(page)

  await page.reload()

  // Betöltés után minden komponens összecsukott; az összefoglaló sort nyitva egyenként ellenőrizzük.
  const toggle = (label: string) => page.locator('.component__toggle', { hasText: new RegExp(`^${label}`) })
  await toggle('Címsor').click()
  await expect(page.getByLabel('Szöveg', { exact: true })).toHaveValue(heading)
  await toggle('Szöveg').click()
  await expect(page.getByLabel('Szöveg', { exact: true })).toHaveValue(text)
  await toggle('Gomb').click()
  await expect(page.getByLabel('Felirat')).toHaveValue(buttonLabel)
  await expect(page.getByLabel(/^Cél/)).toHaveValue(buttonUrl)
})
