import { expect, test } from '@playwright/test'

import { addComponent, createPage, createWebsite, signUp, uniqueId } from './helpers'

test('tooltip, toast és megerősítő ablak', async ({ page }) => {
  const id = uniqueId()
  await signUp(page)
  await createWebsite(page, `Webhely ${id}`, `webhely-${id}`)
  await createPage(page, `Oldal ${id}`, `oldal-${id}`)
  await addComponent(page, 'Címsor')

  // Tooltip billentyűzetes fókuszra: a Tab a következő (hárompontos menü) ikongombra lép, a súgó megjelenik, Escape zárja.
  // (Egyetlen komponensnél a fel/le gomb letiltott, ezért a fejléc gombjától lépünk Tab-bal.)
  await page.locator('.component__toggle').focus()
  await page.keyboard.press('Tab')
  const copy = page.getByRole('button', { name: 'További műveletek' })
  await expect(copy).toBeFocused()
  const tooltip = page.getByRole('tooltip')
  await expect(tooltip).toHaveText('További műveletek')
  await expect(copy).toHaveAttribute('aria-describedby', (await tooltip.getAttribute('id')) ?? '')
  await page.keyboard.press('Escape')
  await expect(tooltip).toHaveCount(0)

  // Tooltip hoverre (késleltetéssel).
  await copy.hover()
  await expect(tooltip).toHaveText('További műveletek')
  await page.mouse.move(0, 0)
  await expect(tooltip).toHaveCount(0)

  // Toast mentés után (állapotjelzés), bezárható.
  await page.getByLabel('Cím', { exact: true }).fill(`Új cím ${id}`)
  await page.getByRole('button', { name: 'Mentés', exact: true }).click()
  const toast = page.getByRole('status').filter({ hasText: 'Oldal mentve.' })
  await expect(toast).toBeVisible()
  await toast.getByRole('button', { name: 'Értesítés bezárása' }).click()
  await expect(toast).toHaveCount(0)

  // Megerősítő ablak: veszélyes változat, a Mégsem nem töröl.
  await page.getByRole('link', { name: '← Vissza a webhelyhez' }).click()
  await page.getByRole('button', { name: 'Törlés' }).last().click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('heading', { name: 'Oldal törlése' })).toBeVisible()
  await expect(dialog.locator('.dialog__icon')).toBeVisible()
  await dialog.getByRole('button', { name: 'Mégsem' }).click()
  await expect(dialog).toBeHidden()
  await expect(page.getByRole('link', { name: `Új cím ${id}` })).toBeVisible()
})

test('animációk: csökkentett mozgásnál a megerősítő ablak azonnal nyílik és záródik', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const id = uniqueId()
  await signUp(page)
  await createWebsite(page, `Webhely ${id}`, `webhely-${id}`)
  await createPage(page, `Oldal ${id}`, `oldal-${id}`)
  await page.getByRole('link', { name: '← Vissza a webhelyhez' }).click()

  await page.getByRole('button', { name: 'Törlés' }).last().click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await expect(dialog).toHaveCSS('opacity', '1')
  await dialog.getByRole('button', { name: 'Mégsem' }).click()
  await expect(dialog).toBeHidden()
})
