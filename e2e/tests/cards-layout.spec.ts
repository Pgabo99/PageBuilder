import { expect, test, type Locator } from '@playwright/test'

import { addComponent, createPage, createWebsite, savePage, signUp, uniqueId } from './helpers'

// Az előnézet és a publikált oldal eltérő szélességű, ezért az oszlopszámot külön ellenőrizzük;
// a kártya saját megjelenése (keret, árnyék, lekerekítés, igazítás, ikonméret) azonos kell legyen.
const cardStyle = (card: Locator) =>
  card.evaluate((el) => {
    const css = getComputedStyle(el)
    const svg = el.querySelector('svg')!.getBoundingClientRect()
    return {
      borderWidth: css.borderTopWidth,
      borderRadius: css.borderTopLeftRadius,
      boxShadow: css.boxShadow,
      textAlign: css.textAlign,
      iconWidth: svg.width,
    }
  })

const columns = (group: Locator) =>
  group.evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(' ').length)

test('kártyák elrendezése: a beállítások az előnézetben és a publikált oldalon is érvényesülnek', async ({
  page,
}) => {
  const id = uniqueId()
  const slug = `webhely-${id}`

  await signUp(page)
  await createWebsite(page, `Webhely ${id}`, slug)
  const websiteUrl = page.url()
  await createPage(page, `Oldal ${id}`, `oldal-${id}`)

  await addComponent(page, 'Kártyák')
  const first = page.getByRole('group', { name: 'Kártya 1' })
  await first.getByLabel('Cím', { exact: true }).fill(`Első ${id}`)
  await first.getByRole('radio', { name: 'Csillag' }).check()
  await page.getByRole('button', { name: '+ Kártya hozzáadása' }).click()
  await page
    .getByRole('group', { name: 'Kártya 2' })
    .getByLabel('Cím', { exact: true })
    .fill(`Második ${id}`)

  await page.getByText('Elrendezés', { exact: true }).click()
  await page.getByLabel('Oszlopok (legfeljebb)').selectOption('2')
  await page.getByLabel('Ikon helye').selectOption('left')
  await page.getByLabel('Ikon mérete').selectOption('large')
  await page.getByLabel('Szövegigazítás').selectOption('center')
  await page.getByLabel('Keret').selectOption('thick')
  await page.getByLabel('Árnyék').selectOption('medium')
  await page.getByLabel('Lekerekítés').selectOption('none')

  const preview = page.locator('.preview')
  const previewCard = preview.locator('.preview__card').first()
  const previewStyle = await cardStyle(previewCard)
  expect(previewStyle.borderWidth).toBe('3px')
  expect(previewStyle.borderRadius).toBe('0px')
  expect(previewStyle.boxShadow).not.toBe('none')
  expect(previewStyle.textAlign).toBe('center')
  expect(previewStyle.iconWidth).toBeCloseTo(40, 0)

  await savePage(page)
  await page.goto(websiteUrl)
  await page.getByRole('button', { name: 'Publikálás', exact: true }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Publikálva:' })).toBeVisible({
    timeout: 30_000,
  })

  await page.goto(`/sites/${slug}/`)
  const group = page.locator('.cards')
  expect(await cardStyle(group.locator('.card').first())).toEqual(previewStyle)
  expect(await columns(group)).toBe(2)

  // Az ikon a szöveg mellett balra van, nem fölötte.
  const icon = await group.locator('.card').first().locator('svg').boundingBox()
  const title = await group.locator('.card').first().getByRole('heading').boundingBox()
  expect(icon!.x + icon!.width).toBeLessThanOrEqual(title!.x + 1)

  // Mobilon a kártyák egy oszlopba rendeződnek, és nincs vízszintes túlcsordulás.
  await page.setViewportSize({ width: 360, height: 800 })
  expect(await columns(group)).toBe(1)
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
  ).toBe(true)
})
