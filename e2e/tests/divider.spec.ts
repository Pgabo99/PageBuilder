import { expect, test, type Locator } from '@playwright/test'

import { addComponent, createPage, createWebsite, savePage, signUp, uniqueId } from './helpers'

const style = (hr: Locator) =>
  hr.evaluate((el) => {
    const css = getComputedStyle(el)
    return {
      width: css.borderTopWidth,
      style: css.borderTopStyle,
      color: css.borderTopColor,
    }
  })

test('elválasztó: vastagság, stílus és szín; az előnézet egyezik a publikált oldallal', async ({
  page,
}) => {
  const id = uniqueId()
  const slug = `webhely-${id}`

  await signUp(page)
  await createWebsite(page, `Webhely ${id}`, slug)
  const websiteUrl = page.url()
  await createPage(page, `Oldal ${id}`, `oldal-${id}`)

  await addComponent(page, 'Elválasztó')
  await page.getByLabel('Vastagság').selectOption('thick')
  await page.getByLabel('Stílus').selectOption('dashed')
  await page.getByLabel('Szín').selectOption('accent')

  // Második elválasztó: alapbeállítás (a régi mentett oldalak formája).
  await addComponent(page, 'Elválasztó')

  const preview = page.locator('.preview hr')
  await expect(preview).toHaveCount(2)
  const previewStyles = [await style(preview.nth(0)), await style(preview.nth(1))]
  expect(previewStyles[0]).toMatchObject({ width: '4px', style: 'dashed' })
  expect(previewStyles[1]).toMatchObject({ width: '1px', style: 'solid' })
  expect(previewStyles[0]!.color).not.toBe(previewStyles[1]!.color)

  await savePage(page)
  await page.goto(websiteUrl)
  await page.getByRole('button', { name: 'Publikálás', exact: true }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Publikálva:' })).toBeVisible({
    timeout: 30_000,
  })

  await page.goto(`/sites/${slug}/`)
  const published = page.locator('main hr')
  await expect(published).toHaveCount(2)
  expect([await style(published.nth(0)), await style(published.nth(1))]).toEqual(previewStyles)
})
