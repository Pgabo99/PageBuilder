import { expect, test } from '@playwright/test'

import { addComponent, createPage, createWebsite, savePage, signUp, uniqueId } from './helpers'

test('értesítődoboz: típus, cím és szöveg; a típus nem csak színnel jelenik meg a publikált oldalon', async ({
  page,
}) => {
  const id = uniqueId()
  const slug = `webhely-${id}`

  await signUp(page)
  await createWebsite(page, `Webhely ${id}`, slug)
  const websiteUrl = page.url()
  await createPage(page, `Oldal ${id}`, `oldal-${id}`)

  await addComponent(page, 'Értesítődoboz')
  await page.getByLabel('Típus').selectOption('warning')
  await page.getByLabel('Cím (opcionális)').fill(`Figyelem ${id}`)
  await page.getByLabel('Szöveg', { exact: true }).fill(`Üzenet ${id}`)

  // Az előnézet aria-hidden, ezért elemre és szövegre keresünk.
  const preview = page.locator('.preview__alert--warning')
  await expect(preview).toContainText(`Figyelem ${id}`)
  await expect(preview).toContainText(`Üzenet ${id}`)

  await savePage(page)
  await page.goto(websiteUrl)
  await page.getByRole('button', { name: 'Publikálás', exact: true }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Publikálva:' })).toBeVisible({
    timeout: 30_000,
  })

  await page.goto(`/sites/${slug}/`)
  const alert = page.getByRole('note')
  await expect(alert).toContainText(`Figyelem ${id}`)
  await expect(alert).toContainText(`Üzenet ${id}`)
  // A típus szövegesen (képernyőolvasónak) és látható jellel is megjelenik, nem csak színnel.
  await expect(alert.locator('.visually-hidden')).toHaveText('Figyelmeztetés: ')
  await expect(alert.locator('.alert__icon')).toHaveText('!')
  await expect(alert).toHaveCSS('border-left-width', '4px')
})
