import { expect, test } from '@playwright/test'

import { addComponent, createPage, createWebsite, savePage, signUp, uniqueId } from './helpers'

test('statisztikák: szerkesztés, élő előnézet és a publikált oldal rácsa, mobilon törik', async ({
  page,
}) => {
  const id = uniqueId()
  const slug = `webhely-${id}`

  await signUp(page)
  await createWebsite(page, `Webhely ${id}`, slug)
  const websiteUrl = page.url()
  await createPage(page, `Oldal ${id}`, `oldal-${id}`)

  await addComponent(page, 'Statisztika')
  const first = page.getByRole('group', { name: 'Statisztika 1' })
  await first.getByLabel('Érték', { exact: true }).fill('120')
  await first.getByLabel('Megnevezés').fill(`Ügyfél ${id}`)
  await first.getByLabel('Előtag (opcionális)').fill('~')
  await first.getByLabel('Utótag (opcionális)').fill('+')
  await first.getByRole('radio', { name: 'Felhasználók' }).check()

  await page.getByRole('button', { name: '+ Statisztika hozzáadása' }).click()
  const second = page.getByRole('group', { name: 'Statisztika 2' })
  await second.getByLabel('Érték', { exact: true }).fill('99%')
  await second.getByLabel('Megnevezés').fill(`Elégedett ${id}`)

  // Az előnézet aria-hidden, ezért elemre és szövegre keresünk.
  const preview = page.locator('.preview__stats')
  await expect(preview.locator('.preview__stat')).toHaveCount(2)
  await expect(preview.locator('.preview__stat-value').first()).toHaveText('~120+')
  await expect(preview.locator('.preview__stat-icon svg')).toHaveCount(1)

  await savePage(page)
  await page.goto(websiteUrl)
  await page.getByRole('button', { name: 'Publikálás', exact: true }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Publikálva:' })).toBeVisible({
    timeout: 30_000,
  })

  await page.goto(`/sites/${slug}/`)
  const stats = page.locator('.stats .stat')
  await expect(stats).toHaveCount(2)
  await expect(stats.first().locator('.stat__value')).toHaveText('~120+')
  await expect(stats.first().locator('.stat__label')).toHaveText(`Ügyfél ${id}`)
  await expect(stats.first().locator('svg.icon')).toBeVisible()
  await expect(stats.nth(1).locator('svg')).toHaveCount(0)

  // Mobilon nincs vízszintes túlcsordulás.
  await page.setViewportSize({ width: 360, height: 800 })
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
  ).toBe(true)
})
