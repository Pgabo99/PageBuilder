import { expect, test, type Locator } from '@playwright/test'

import { addComponent, createPage, createWebsite, savePage, signUp, uniqueId } from './helpers'

const style = (locator: Locator) =>
  locator.evaluate((el) => {
    const css = getComputedStyle(el)
    return { tag: el.tagName, fontSize: css.fontSize, textAlign: css.textAlign }
  })

test('címsorok: a szint, a méret és az igazítás független, és az előnézet egyezik a publikált oldallal', async ({
  page,
}) => {
  const id = uniqueId()
  const slug = `webhely-${id}`

  await signUp(page)
  await createWebsite(page, `Webhely ${id}`, slug)
  const websiteUrl = page.url()
  await createPage(page, `Oldal ${id}`, `oldal-${id}`)

  // Első címsor: H6 szint, óriási méret, középre igazítva.
  await addComponent(page, 'Címsor')
  await page.locator('.component--active').getByLabel('Szöveg', { exact: true }).fill(`Hatos ${id}`)
  await page.getByLabel('Szint', { exact: true }).selectOption('6')
  await page.getByLabel('Megjelenési méret').selectOption('xlarge')
  await page.getByLabel('Igazítás').selectOption('center')

  // Második címsor: alapbeállítás (a régi mentett címsorokkal azonos megjelenés).
  await addComponent(page, 'Címsor')
  await page.locator('.component--active').getByLabel('Szöveg', { exact: true }).fill(`Alap ${id}`)

  // Az előnézet aria-hidden, ezért nem szerepkörre, hanem elemre és szövegre keresünk.
  const preview = page.locator('.preview')
  const previewStyles = {
    custom: await style(preview.locator('h6', { hasText: `Hatos ${id}` })),
    plain: await style(preview.locator('h2', { hasText: `Alap ${id}` })),
  }
  expect(previewStyles.custom.tag).toBe('H6')
  expect(previewStyles.custom.textAlign).toBe('center')
  expect(parseFloat(previewStyles.custom.fontSize)).toBeGreaterThan(
    parseFloat(previewStyles.plain.fontSize),
  )
  expect(previewStyles.plain.tag).toBe('H2')

  await savePage(page)
  await page.goto(websiteUrl)
  await page.getByRole('button', { name: 'Publikálás', exact: true }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Publikálva:' })).toBeVisible({
    timeout: 30_000,
  })

  await page.goto(`/sites/${slug}/`)
  const published = {
    custom: await style(page.locator('main h6', { hasText: `Hatos ${id}` })),
    plain: await style(page.locator('main h2', { hasText: `Alap ${id}` })),
  }
  expect(published).toEqual(previewStyles)

  // Mobilon a méret csökken, az igazítás megmarad, és nincs vízszintes túlcsordulás.
  await page.setViewportSize({ width: 360, height: 800 })
  const mobile = await style(page.locator('main h6', { hasText: `Hatos ${id}` }))
  expect(mobile.textAlign).toBe('center')
  expect(parseFloat(mobile.fontSize)).toBeLessThan(parseFloat(published.custom.fontSize))
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
  ).toBe(true)
})
