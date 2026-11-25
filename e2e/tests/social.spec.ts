import { expect, test } from '@playwright/test'

import { addComponent, createPage, createWebsite, savePage, signUp, uniqueId } from './helpers'

test('közösségi média: platformok és linkek, olvasható név, a publikált oldalon is megjelennek', async ({
  page,
}) => {
  const id = uniqueId()
  const slug = `webhely-${id}`

  await signUp(page)
  await createWebsite(page, `Webhely ${id}`, slug)
  const websiteUrl = page.url()
  await createPage(page, `Oldal ${id}`, `oldal-${id}`)

  await addComponent(page, 'Közösségi média')
  const first = page.getByRole('group', { name: 'Profil 1' })
  await first.getByLabel('Platform').selectOption('github')
  await first.getByLabel(/^Link/).fill(`https://github.com/${id}`)

  await page.getByRole('button', { name: '+ Profil hozzáadása' }).click()
  const second = page.getByRole('group', { name: 'Profil 2' })
  await second.getByLabel('Platform').selectOption('youtube')
  await second.getByLabel(/^Link/).fill(`https://youtube.com/@${id}`)

  // Az előnézet aria-hidden, ezért elemre keresünk.
  await expect(page.locator('.preview__social li')).toHaveCount(2)
  await expect(page.locator('.preview__social svg')).toHaveCount(2)

  // Átrendezés a fel gombbal.
  await page.getByRole('button', { name: 'Profil 2 feljebb' }).click()
  await expect(page.getByRole('group', { name: 'Profil 1' }).getByLabel('Platform')).toHaveValue(
    'youtube',
  )

  await savePage(page)
  await page.goto(websiteUrl)
  await page.getByRole('button', { name: 'Publikálás', exact: true }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Publikálva:' })).toBeVisible({
    timeout: 30_000,
  })

  await page.goto(`/sites/${slug}/`)
  const links = page.locator('.social a')
  await expect(links).toHaveCount(2)
  // Az ikonos link olvasható nevet kap, és a sorrend az átrendezést követi.
  await expect(page.getByRole('link', { name: 'YouTube' })).toHaveAttribute(
    'href',
    `https://youtube.com/@${id}`,
  )
  await expect(page.getByRole('link', { name: 'GitHub' })).toHaveAttribute(
    'rel',
    'noopener noreferrer',
  )
  await expect(links.first()).toHaveAccessibleName('YouTube')
  await expect(links.first().locator('svg')).toBeVisible()
})
