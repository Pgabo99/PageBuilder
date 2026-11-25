import { expect, test } from '@playwright/test'

import { addComponent, createPage, createWebsite, savePage, signUp, uniqueId } from './helpers'

test('térköz: a magasság állítható, az előnézet egyezik a publikált oldallal', async ({ page }) => {
  const id = uniqueId()
  const slug = `webhely-${id}`

  await signUp(page)
  await createWebsite(page, `Webhely ${id}`, slug)
  const websiteUrl = page.url()
  await createPage(page, `Oldal ${id}`, `oldal-${id}`)

  await addComponent(page, 'Térköz')
  await page.getByLabel('Magasság (rem)').fill('6')

  const rem = await page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).fontSize))
  const previewHeight = await page
    .locator('.preview__spacer')
    .evaluate((el) => el.getBoundingClientRect().height)
  expect(previewHeight).toBeCloseTo(6 * rem, 0)

  await savePage(page)
  await page.reload()
  await page.locator('.component__toggle', { hasText: /^6 rem térköz/ }).click()
  await expect(page.getByLabel('Magasság (rem)')).toHaveValue('6')

  await page.goto(websiteUrl)
  await page.getByRole('button', { name: 'Publikálás', exact: true }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Publikálva:' })).toBeVisible({
    timeout: 30_000,
  })

  await page.goto(`/sites/${slug}/`)
  const spacer = page.locator('main [aria-hidden="true"]')
  await expect(spacer).toHaveCount(1)
  const publishedHeight = await spacer.evaluate((el) => el.getBoundingClientRect().height)
  expect(publishedHeight).toBeCloseTo(6 * rem, 0)
})
