import { expect, test } from '@playwright/test'

import { addComponent, createPage, createWebsite, savePage, signUp, uniqueId } from './helpers'

test('legördülő lista: egér, billentyűzet, kijelölés és mentés', async ({ page }) => {
  const id = uniqueId()
  await signUp(page)
  await createWebsite(page, `Webhely ${id}`, `webhely-${id}`)
  await createPage(page, `Oldal ${id}`, `oldal-${id}`)
  await addComponent(page, 'Címsor')

  const select = page.getByRole('combobox', { name: 'Igazítás' })
  const listId = await select.getAttribute('aria-controls')
  const list = page.locator(`[id="${listId}"]`)

  // Egér: nyitás, a kijelölt (alapértelmezett) elem pipával, választás után bezár.
  await expect(select).toHaveAttribute('aria-expanded', 'false')
  await select.click()
  await expect(select).toHaveAttribute('aria-expanded', 'true')
  await expect(list.locator('[aria-selected="true"] .select__check')).toBeVisible()
  await list.locator('[data-value="center"]').click()
  await expect(select).toHaveAttribute('aria-expanded', 'false')
  await expect(select).toHaveAttribute('data-value', 'center')

  // Billentyűzet: nyilak és Enter; Escape változtatás nélkül zár.
  await select.focus()
  await page.keyboard.press('ArrowDown')
  await expect(select).toHaveAttribute('aria-expanded', 'true')
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('Enter')
  await expect(select).toHaveAttribute('data-value', 'right')
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('Escape')
  await expect(select).toHaveAttribute('aria-expanded', 'false')
  await expect(select).toHaveAttribute('data-value', 'right')

  // Kívülre kattintás bezár.
  await select.click()
  await page.getByRole('heading', { name: 'Tartalom' }).click()
  await expect(select).toHaveAttribute('aria-expanded', 'false')

  // A választás mentve marad.
  await savePage(page)
  await page.reload()
  await page.locator('.component__toggle', { hasText: /^Címsor/ }).click()
  await expect(page.getByRole('combobox', { name: 'Igazítás' })).toHaveAttribute('data-value', 'right')
})

test('legördülő lista: a panel nem vágódik le a becsukható szerkesztőpanelben, csökkentett mozgásnál azonnal vált', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const id = uniqueId()
  await signUp(page)
  await createWebsite(page, `Webhely ${id}`, `webhely-${id}`)
  await createPage(page, `Oldal ${id}`, `oldal-${id}`)
  await addComponent(page, 'Értesítődoboz')

  const select = page.getByRole('combobox', { name: 'Típus' })
  const listId = await select.getAttribute('aria-controls')
  await select.click()
  const list = page.locator(`[id="${listId}"]`)
  await expect(list).toBeVisible()

  // A panel (fixed) a szerkesztőpanel overflow-ján kívülre is kiér: minden opció teljesen látszik.
  const options = list.locator('[role="option"]')
  const count = await options.count()
  for (let i = 0; i < count; i++) {
    await expect(options.nth(i)).toBeInViewport({ ratio: 1 })
  }

  await page.keyboard.press('Escape')
  await expect(list).toHaveCount(0)
})
