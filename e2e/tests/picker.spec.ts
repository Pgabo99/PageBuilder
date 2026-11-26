import { expect, test } from '@playwright/test'

import { createPage, createWebsite, signUp, uniqueId } from './helpers'

test('komponensválasztó: keresés, kategória összecsukása, kiválasztás és billentyűzet', async ({
  page,
}) => {
  const id = uniqueId()
  await signUp(page)
  await createWebsite(page, `Webhely ${id}`, `webhely-${id}`)
  await createPage(page, `Oldal ${id}`, `oldal-${id}`)

  const trigger = page.getByRole('button', { name: '+ Elem hozzáadása' })
  const panel = page.getByRole('group', { name: 'Komponens hozzáadása' })
  const search = page.getByRole('searchbox', { name: 'Elem keresése' })
  await trigger.click()
  await expect(trigger).toHaveAttribute('aria-expanded', 'true')
  await expect(search).toBeFocused()

  // Kategória összecsukása.
  const basic = panel.getByRole('button', { name: 'Alapelemek' })
  await expect(panel.getByRole('button', { name: 'Címsor', exact: true })).toBeVisible()
  await basic.click()
  await expect(basic).toHaveAttribute('aria-expanded', 'false')
  await expect(panel.getByRole('button', { name: 'Címsor', exact: true })).toHaveCount(0)

  // Keresés (ékezet nélkül is): csak a találatot tartalmazó kategória marad; törléskor az előző állapot áll vissza.
  await search.fill('idezet')
  await expect(panel.getByRole('button', { name: 'Idézet', exact: true })).toBeVisible()
  await expect(panel.getByRole('button', { name: 'Alapelemek' })).toHaveCount(0)
  await search.fill('')
  await expect(basic).toHaveAttribute('aria-expanded', 'false')

  // Nyílbillentyű: a keresőmezőről a kategóriára lép; Escape bezár, a fókusz a gombra tér vissza.
  await search.focus()
  await page.keyboard.press('ArrowDown')
  await expect(basic).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(trigger).toHaveAttribute('aria-expanded', 'false')
  await expect(trigger).toBeFocused()

  // Kiválasztás: a választó bezárul, az új elem aktív, az első mezője fókuszt kap.
  await trigger.click()
  await panel.getByRole('button', { name: 'Idézet', exact: true }).click()
  await expect(trigger).toHaveAttribute('aria-expanded', 'false')
  const active = page.locator('.component--active')
  await expect(active.locator('.component__toggle')).toContainText('Idézet')
  await expect(active.getByLabel('Idézet', { exact: true })).toBeFocused()

  // Kívülre kattintás bezár.
  await trigger.click()
  await page.getByRole('heading', { name: 'Tartalom' }).click()
  await expect(trigger).toHaveAttribute('aria-expanded', 'false')
})

test('komponensválasztó: csökkentett mozgásnál azonnal nyit és zár', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const id = uniqueId()
  await signUp(page)
  await createWebsite(page, `Webhely ${id}`, `webhely-${id}`)
  await createPage(page, `Oldal ${id}`, `oldal-${id}`)

  const trigger = page.getByRole('button', { name: '+ Elem hozzáadása' })
  const search = page.getByRole('searchbox', { name: 'Elem keresése' })
  await trigger.click()
  await expect(search).toBeVisible()
  await trigger.click()
  await expect(search).toHaveCount(0)
})
