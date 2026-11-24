import { expect, test, type Locator } from '@playwright/test'

import { addComponent, createPage, createWebsite, savePage, signUp, uniqueId } from './helpers'

const style = (locator: Locator) =>
  locator.evaluate((el) => {
    const css = getComputedStyle(el)
    return {
      fontSize: css.fontSize,
      borderRadius: css.borderTopLeftRadius,
      // Körvonalas stílusnál átlátszó háttér, kitöltöttnél a kiemelőszín.
      transparentBackground: css.backgroundColor === 'rgba(0, 0, 0, 0)',
      textAlign: getComputedStyle(el.parentElement!).textAlign,
    }
  })

test('gombok: stílus, méret, igazítás és lekerekítés; az előnézet egyezik a publikált oldallal', async ({
  page,
}) => {
  const id = uniqueId()
  const slug = `webhely-${id}`

  await signUp(page)
  await createWebsite(page, `Webhely ${id}`, slug)
  const websiteUrl = page.url()
  await createPage(page, `Oldal ${id}`, `oldal-${id}`)

  await addComponent(page, 'Gomb')
  await page.getByLabel('Felirat').fill(`Stílusos ${id}`)
  await page.getByLabel('Stílus').selectOption('outline')
  await page.getByLabel('Méret', { exact: true }).selectOption('large')
  await page.getByLabel('Igazítás').selectOption('center')
  await page.getByLabel('Lekerekítés').selectOption('full')

  // Második gomb: alapbeállítás (a régi mentett gombokkal azonos megjelenés).
  await addComponent(page, 'Gomb')
  await page.getByLabel('Felirat').fill(`Alap ${id}`)

  // Az előnézet aria-hidden, ezért elemre és szövegre keresünk.
  const preview = page.locator('.preview')
  const previewStyles = {
    custom: await style(preview.locator('.preview__button', { hasText: `Stílusos ${id}` })),
    plain: await style(preview.locator('.preview__button', { hasText: `Alap ${id}` })),
  }
  expect(previewStyles.custom.transparentBackground).toBe(true)
  expect(previewStyles.custom.textAlign).toBe('center')
  expect(previewStyles.plain.transparentBackground).toBe(false)
  expect(previewStyles.plain.textAlign).not.toBe('center')
  expect(parseFloat(previewStyles.custom.fontSize)).toBeGreaterThan(
    parseFloat(previewStyles.plain.fontSize),
  )

  await savePage(page)
  await page.goto(websiteUrl)
  await page.getByRole('button', { name: 'Publikálás', exact: true }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Publikálva:' })).toBeVisible({
    timeout: 30_000,
  })

  await page.goto(`/sites/${slug}/`)
  const published = {
    custom: await style(page.getByRole('link', { name: `Stílusos ${id}` })),
    plain: await style(page.getByRole('link', { name: `Alap ${id}` })),
  }
  expect(published).toEqual(previewStyles)

  // Mobilon a hosszú felirat sem lóg ki az oldalból.
  await page.setViewportSize({ width: 360, height: 800 })
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
  ).toBe(true)
})
