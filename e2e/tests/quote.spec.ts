import { expect, test } from '@playwright/test'

import { addComponent, createPage, createWebsite, savePage, signUp, uniqueId } from './helpers'

test('idézet: szöveg, szerző és linkelt forrás; az előnézet és a publikált oldal egyezik', async ({
  page,
}) => {
  const id = uniqueId()
  const slug = `webhely-${id}`

  await signUp(page)
  await createWebsite(page, `Webhely ${id}`, slug)
  const websiteUrl = page.url()
  await createPage(page, `Oldal ${id}`, `oldal-${id}`)

  await addComponent(page, 'Idézet')
  await page.getByLabel('Idézet', { exact: true }).fill(`Szöveg ${id}`)
  await page.getByLabel('Szerző (opcionális)').fill(`Szerző ${id}`)
  await page.getByLabel('Forrás (opcionális)').fill(`Forrás ${id}`)
  await page.getByLabel(/^Forrás linkje/).fill('https://example.com/forras')

  // Az előnézet aria-hidden, ezért elemre és szövegre keresünk.
  const preview = page.locator('.preview__quote')
  await expect(preview.locator('blockquote')).toHaveText(`Szöveg ${id}`)
  await expect(preview.locator('figcaption')).toHaveText(`Szerző ${id}, Forrás ${id}`)

  await savePage(page)
  await page.goto(websiteUrl)
  await page.getByRole('button', { name: 'Publikálás', exact: true }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Publikálva:' })).toBeVisible({
    timeout: 30_000,
  })

  await page.goto(`/sites/${slug}/`)
  const quote = page.locator('figure.quote')
  await expect(quote.locator('blockquote')).toHaveText(`Szöveg ${id}`)
  await expect(quote.locator('figcaption')).toContainText(`Szerző ${id}`)
  await expect(quote.locator('cite a')).toHaveText(`Forrás ${id}`)
  await expect(quote.locator('cite a')).toHaveAttribute('href', 'https://example.com/forras')
  expect(await quote.locator('figcaption').evaluate((el) => el.textContent?.replace(/\s+/g, ' ').trim())).toBe(
    `Szerző ${id}, Forrás ${id}`,
  )
})
