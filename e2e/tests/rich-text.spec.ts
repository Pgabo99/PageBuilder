import { expect, test } from '@playwright/test'

import { addComponent, createPage, createWebsite, savePage, signUp, uniqueId } from './helpers'

test('formázott szöveg: félkövér, dőlt, lista és link; az előnézet és a publikált oldal egyezik, a HTML nem jut ki', async ({
  page,
}) => {
  const id = uniqueId()
  const slug = `webhely-${id}`

  await signUp(page)
  await createWebsite(page, `Webhely ${id}`, slug)
  const websiteUrl = page.url()
  await createPage(page, `Oldal ${id}`, `oldal-${id}`)

  // Az új szöveg alapból formázott (Markdown).
  await addComponent(page, 'Szöveg')
  await page
    .getByLabel('Szöveg', { exact: true })
    .fill(`**Fontos ${id}** és *dőlt*\n- egy\n- kettő\n\n1. első\n\n[példa](https://example.com/x) <script>window.__xss = 1</script>`)

  // Az előnézet aria-hidden, ezért elemre keresünk.
  const preview = page.locator('.preview__rich')
  await expect(preview.locator('strong')).toHaveText(`Fontos ${id}`)
  await expect(preview.locator('em')).toHaveText('dőlt')
  await expect(preview.locator('ul li')).toHaveCount(2)
  await expect(preview.locator('ol li')).toHaveCount(1)
  await expect(preview.locator('a')).toHaveAttribute('href', 'https://example.com/x')
  await expect(preview.locator('script')).toHaveCount(0)

  await savePage(page)
  await page.goto(websiteUrl)
  await page.getByRole('button', { name: 'Publikálás', exact: true }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Publikálva:' })).toBeVisible({
    timeout: 30_000,
  })

  await page.goto(`/sites/${slug}/`)
  const rich = page.locator('.rich')
  await expect(rich.locator('strong')).toHaveText(`Fontos ${id}`)
  await expect(rich.locator('ul li')).toHaveCount(2)
  await expect(rich.locator('ol li')).toHaveCount(1)
  await expect(rich.getByRole('link', { name: 'példa' })).toHaveAttribute(
    'rel',
    'noopener noreferrer',
  )
  // A beírt HTML szövegként jelenik meg, nem fut le.
  await expect(rich).toContainText('<script>window.__xss = 1</script>')
  await expect(rich.locator('script')).toHaveCount(0)
  expect(await page.evaluate(() => (window as unknown as { __xss?: number }).__xss)).toBeUndefined()
})
