import { expect, test } from '@playwright/test'

import { addComponent, createPage, createWebsite, savePage, signUp, uniqueId } from './helpers'

test('kártyák: szerkesztés, élő előnézet, mentés és a publikált oldal rácsa', async ({ page }) => {
  const id = uniqueId()
  const slug = `webhely-${id}`

  await signUp(page)
  await createWebsite(page, `Webhely ${id}`, slug)
  const websiteUrl = page.url()
  await createPage(page, `Oldal ${id}`, `oldal-${id}`)

  // Az új kártyacsoport aktív: az első kártya mezői azonnal szerkeszthetők.
  await addComponent(page, 'Kártyák')
  const first = page.getByRole('group', { name: 'Kártya 1' })
  await first.getByLabel('Cím', { exact: true }).fill(`Első ${id}`)
  await first.getByLabel('Leírás (opcionális)').fill(`Első leírás ${id}`)
  await first.getByRole('radio', { name: 'Csillag' }).check()
  await first.getByLabel('Gomb felirata (opcionális)').fill('Tovább')
  await first.getByLabel(/^Gomb célja/).fill('/kapcsolat')

  await page.getByRole('button', { name: '+ Kártya hozzáadása' }).click()
  const second = page.getByRole('group', { name: 'Kártya 2' })
  await second.getByLabel('Cím', { exact: true }).fill(`Második ${id}`)

  // Az élő előnézet mentés nélkül mutatja a kártyákat (a gomb nem navigál).
  const preview = page.locator('.preview')
  await expect(preview.locator('.preview__card')).toHaveCount(2)
  await expect(preview.getByText(`Első ${id}`)).toBeVisible()
  await expect(preview.locator('.preview__card-icon svg')).toHaveCount(1)
  await expect(preview.locator('a')).toHaveCount(0)

  // Átrendezés a fel/le gombbal.
  await page.getByRole('button', { name: 'Kártya 2 feljebb' }).click()
  await expect(preview.locator('.preview__card h3').first()).toHaveText(`Második ${id}`)
  await page.getByRole('button', { name: 'Kártya 2 feljebb' }).click()
  await expect(preview.locator('.preview__card h3').first()).toHaveText(`Első ${id}`)

  await savePage(page)
  await page.reload()
  await page.locator('.component__toggle', { hasText: /^Kártyák/ }).click()
  await expect(
    page.getByRole('group', { name: 'Kártya 1' }).getByLabel('Cím', { exact: true }),
  ).toHaveValue(`Első ${id}`)

  await page.goto(websiteUrl)
  await page.getByRole('button', { name: 'Publikálás', exact: true }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Publikálva:' })).toBeVisible({
    timeout: 30_000,
  })

  await page.goto(`/sites/${slug}/`)
  const cards = page.locator('.cards .card')
  await expect(cards).toHaveCount(2)
  await expect(cards.first().getByRole('heading', { name: `Első ${id}` })).toBeVisible()
  await expect(cards.first().locator('svg.icon')).toBeVisible()
  await expect(cards.first().getByText(`Első leírás ${id}`)).toBeVisible()
  await expect(cards.first().getByRole('link', { name: 'Tovább' })).toHaveAttribute(
    'href',
    '/kapcsolat',
  )
  // A második kártyának nincs ikonja és gombja.
  await expect(cards.nth(1).locator('svg')).toHaveCount(0)
  await expect(cards.nth(1).getByRole('link')).toHaveCount(0)
})
