import { expect, test } from '@playwright/test'

import { addComponent, createPage, createWebsite, savePage, signUp, uniqueId } from './helpers'

test('publikálás: a publikált oldal tényleges tartalma elérhető, az állapot megmarad', async ({
  page,
}) => {
  const id = uniqueId()
  const slug = `webhely-${id}`
  const heading = `Publikált címsor ${id}`

  await signUp(page)
  await createWebsite(page, `Webhely ${id}`, slug)
  const websiteUrl = page.url()
  await createPage(page, `Oldal ${id}`, `oldal-${id}`)
  await addComponent(page, 'Címsor')
  await page.getByLabel('Szöveg', { exact: true }).fill(heading)
  await savePage(page)

  await page.goto(websiteUrl)
  await page.getByRole('button', { name: 'Publikálás', exact: true }).click()
  // A worker dolgozza fel a jobot: az állapotot Playwright-várakozás figyeli, fix idő nélkül.
  await expect(page.getByRole('status').filter({ hasText: 'Publikálva:' })).toBeVisible({
    timeout: 30_000,
  })

  await page.goto(`/sites/${slug}/`)
  await expect(page.getByRole('heading', { name: heading })).toBeVisible()

  await page.goto(websiteUrl)
  await expect(page.getByRole('status').filter({ hasText: 'Publikálva:' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Megnyitás az új lapon' })).toBeVisible()
})
