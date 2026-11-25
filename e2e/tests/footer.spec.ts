import { expect, test } from '@playwright/test'

import { addComponent, createPage, createWebsite, savePage, signUp, uniqueId } from './helpers'

test('lábléc: copyright, link és elérhetőségek; a publikált oldal végén jelenik meg, a másik oldal változatlan', async ({
  page,
}) => {
  const id = uniqueId()
  const slug = `webhely-${id}`

  await signUp(page)
  await createWebsite(page, `Webhely ${id}`, slug)
  const websiteUrl = page.url()
  await createPage(page, `Első ${id}`, `elso-${id}`)

  await addComponent(page, 'Lábléc')
  await page.getByLabel('Copyright-szöveg').fill(`© Cég ${id}`)
  await page.getByRole('button', { name: '+ Link hozzáadása' }).click()
  const link = page.getByRole('group', { name: 'Link 1' })
  await link.getByLabel('Felirat').fill(`Adatvédelem ${id}`)
  await link.getByLabel(/^Cél/).fill('https://example.com/adatvedelem')
  await page.getByLabel('E-mail-cím (opcionális)', { exact: true }).fill('info@example.com')
  await page.getByLabel('Telefonszám (opcionális)').fill('+36 30 123 4567')
  await page.getByLabel('Cím (opcionális)', { exact: true }).fill('1051 Budapest, Fő utca 1.')

  // Egy oldalon csak egy lábléc lehet.
  await expect(page.getByRole('button', { name: '+ Lábléc' })).toBeDisabled()

  // Az előnézet aria-hidden, ezért elemre és szövegre keresünk.
  const preview = page.locator('.preview__footer')
  await expect(preview).toContainText(`© Cég ${id}`)
  await expect(preview).toContainText(`Adatvédelem ${id}`)
  await expect(preview).toContainText('info@example.com')

  await savePage(page)
  await page.goto(websiteUrl)
  await page.getByRole('button', { name: 'Publikálás', exact: true }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Publikálva:' })).toBeVisible({
    timeout: 30_000,
  })

  await page.goto(`/sites/${slug}/`)
  const footer = page.getByRole('contentinfo')
  await expect(footer).toContainText(`© Cég ${id}`)
  await expect(footer.getByRole('link', { name: `Adatvédelem ${id}` })).toHaveAttribute(
    'href',
    'https://example.com/adatvedelem',
  )
  await expect(footer.getByRole('link', { name: 'info@example.com' })).toHaveAttribute(
    'href',
    'mailto:info@example.com',
  )
  await expect(footer.getByRole('link', { name: '+36 30 123 4567' })).toHaveAttribute(
    'href',
    'tel:+36301234567',
  )
  await expect(footer.getByRole('navigation', { name: 'Lábléc' })).toBeVisible()
  // A lábléc a tartalom után van.
  const box = await footer.boundingBox()
  const mainBox = await page.locator('main').boundingBox()
  expect(box!.y).toBeGreaterThanOrEqual(mainBox!.y + mainBox!.height)

  // Mobilon nincs vízszintes túlcsordulás.
  await page.setViewportSize({ width: 360, height: 800 })
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
  ).toBe(true)
})
