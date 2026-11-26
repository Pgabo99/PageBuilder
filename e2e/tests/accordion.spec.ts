import { expect, test } from '@playwright/test'

import { addComponent, createPage, createWebsite, savePage, signUp, uniqueId } from './helpers'

test('becsukható részek: előnézet, mentés és a publikált details/summary működése', async ({
  page,
}) => {
  const id = uniqueId()
  const slug = `webhely-${id}`

  await signUp(page)
  await createWebsite(page, `Webhely ${id}`, slug)
  const websiteUrl = page.url()
  await createPage(page, `Oldal ${id}`, `oldal-${id}`)

  // Az új komponens aktív: az első rész mezői azonnal szerkeszthetők.
  await addComponent(page, 'Becsukható részek')
  const first = page.getByRole('group', { name: 'Rész 1' })
  await first.getByLabel('Cím', { exact: true }).fill(`Kérdés ${id}`)
  await first.getByLabel('Szöveg', { exact: true }).fill(`Válasz ${id}`)
  await page.getByRole('button', { name: '+ Rész hozzáadása' }).click()
  const second = page.getByRole('group', { name: 'Rész 2' })
  await second.getByLabel('Cím', { exact: true }).fill(`Második ${id}`)
  await second.getByLabel('Szöveg', { exact: true }).fill(`Második válasz ${id}`)

  // Az élő előnézet mentés nélkül mutatja a részeket, alapból zártan; a kattintás nyit és csuk.
  const preview = page.locator('.preview')
  const previewDetails = preview.locator('details')
  await expect(previewDetails).toHaveCount(2)
  await expect(previewDetails.first()).not.toHaveAttribute('open', '')
  await preview.getByText(`Kérdés ${id}`).click()
  await expect(previewDetails.first()).toHaveAttribute('open', '')
  await expect(preview.getByText(`Válasz ${id}`, { exact: true })).toBeVisible()
  await preview.getByText(`Kérdés ${id}`).click()
  await expect(previewDetails.first()).not.toHaveAttribute('open', '')

  // Átrendezés a fel/le gombbal.
  await page.getByRole('button', { name: 'Rész 2 feljebb' }).click()
  await expect(preview.locator('summary').first()).toHaveText(`Második ${id}`)
  await page.getByRole('button', { name: 'Rész 2 feljebb' }).click()
  await expect(preview.locator('summary').first()).toHaveText(`Kérdés ${id}`)

  await savePage(page)
  await page.reload()
  await page.locator('.component__toggle', { hasText: /^Becsukható részek/ }).click()
  await expect(
    page.getByRole('group', { name: 'Rész 1' }).getByLabel('Cím', { exact: true }),
  ).toHaveValue(`Kérdés ${id}`)

  await page.goto(websiteUrl)
  await page.getByRole('button', { name: 'Publikálás', exact: true }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Publikálva:' })).toBeVisible({
    timeout: 30_000,
  })

  // A publikált oldalon natív details/summary, JavaScript nélkül: alapból zárt, kattintásra és billentyűvel is nyílik.
  await page.goto(`/sites/${slug}/`)
  const details = page.locator('.accordion details')
  await expect(details).toHaveCount(2)
  await expect(details.first()).not.toHaveAttribute('open', '')
  await expect(page.getByText(`Válasz ${id}`, { exact: true })).toBeHidden()

  await details.first().locator('summary').click()
  await expect(details.first()).toHaveAttribute('open', '')
  await expect(page.getByText(`Válasz ${id}`, { exact: true })).toBeVisible()
  await expect(details.nth(1)).not.toHaveAttribute('open', '')

  await details.first().locator('summary').click()
  await expect(details.first()).not.toHaveAttribute('open', '')

  await details.nth(1).locator('summary').focus()
  await page.keyboard.press('Enter')
  await expect(details.nth(1)).toHaveAttribute('open', '')
  await expect(page.getByText(`Második válasz ${id}`, { exact: true })).toBeVisible()
})

test('animáció: csökkentett mozgásnál a szerkesztőpanel és a publikált accordion azonnal vált', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const id = uniqueId()

  await signUp(page)
  await createWebsite(page, `Webhely ${id}`, `webhely-${id}`)
  await createPage(page, `Oldal ${id}`, `oldal-${id}`)
  await addComponent(page, 'Becsukható részek')

  const toggle = page.locator('.component__toggle', { hasText: /^Becsukható részek/ })
  const fields = page.locator('.component__fields')
  await expect(fields).toBeVisible()
  await toggle.click()
  await expect(toggle).toHaveAttribute('aria-expanded', 'false')
  await expect(fields).toHaveCount(0)
  await toggle.click()
  await expect(toggle).toHaveAttribute('aria-expanded', 'true')
  await expect(fields).toBeVisible()
})
