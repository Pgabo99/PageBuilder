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

  await addComponent(page, 'Címsor')
  await addComponent(page, 'Szöveg')
  await addComponent(page, 'Gomb')
  // A "Szöveg" címke a címsor mezőjén és a szövegkomponensen is szerepel, ebben a sorrendben.
  await page.getByLabel('Szöveg', { exact: true }).first().fill(heading)
  await page.getByLabel('Szöveg', { exact: true }).nth(1).fill(text)
  await page.getByLabel('Felirat').fill(buttonLabel)
  await page.getByLabel(/^Cél/).fill(buttonUrl)
  await savePage(page)

  await page.reload()

  await expect(page.getByLabel('Szöveg', { exact: true }).first()).toHaveValue(heading)
  await expect(page.getByLabel('Szöveg', { exact: true }).nth(1)).toHaveValue(text)
  await expect(page.getByLabel('Felirat')).toHaveValue(buttonLabel)
  await expect(page.getByLabel(/^Cél/)).toHaveValue(buttonUrl)
})
