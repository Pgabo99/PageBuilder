import { expect, test } from '@playwright/test'

import { addComponent, createPage, savePage, signUp, uniqueId } from './helpers'

test('színpaletta: az egyedi színek a mintán, az előnézetben és a publikált oldalon is érvényesülnek', async ({
  page,
}) => {
  const id = uniqueId()
  const slug = `webhely-${id}`

  await signUp(page)
  await page.getByRole('link', { name: 'Új webhely' }).click()
  await page.getByLabel('Név', { exact: true }).fill(`Webhely ${id}`)
  await page.getByLabel('Webcím', { exact: true }).fill(slug)
  await page.getByLabel('Háttérszín').fill('#101820')
  await page.getByLabel('Szövegszín').fill('#f2f2f2')
  await page.getByLabel(/^Elsődleges szín/).fill('#ff8800')

  // A minta mentés előtt is követi a színeket; a jól olvasható párosításra nincs figyelmeztetés.
  const sample = page.locator('.preview')
  await expect(sample).toHaveCSS('background-color', 'rgb(16, 24, 32)')
  await expect(sample).toHaveCSS('color', 'rgb(242, 242, 242)')
  await expect(page.locator('.palette-warnings')).toHaveCount(0)

  // A nem olvasható párosításra figyelmeztet, de a mentést nem tiltja.
  await page.getByLabel('Szövegszín').fill('#202830')
  await expect(page.locator('.palette-warnings')).toContainText('A szöveg és a háttér kontrasztja')
  await page.getByLabel('Szövegszín').fill('#f2f2f2')

  await page.getByRole('button', { name: 'Mentés', exact: true }).click()
  await expect(page.getByRole('heading', { name: `Webhely ${id}`, level: 1 })).toBeVisible()
  const websiteUrl = page.url()

  // A szerkesztő előnézete a mentett palettát használja.
  await createPage(page, `Oldal ${id}`, `oldal-${id}`)
  await addComponent(page, 'Szöveg')
  await expect(page.locator('.preview')).toHaveCSS('background-color', 'rgb(16, 24, 32)')
  await savePage(page)

  await page.goto(websiteUrl)
  await page.getByRole('button', { name: 'Publikálás', exact: true }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Publikálva:' })).toBeVisible({
    timeout: 30_000,
  })

  await page.goto(`/sites/${slug}/`)
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(16, 24, 32)')
  await expect(page.locator('body')).toHaveCSS('color', 'rgb(242, 242, 242)')
})
