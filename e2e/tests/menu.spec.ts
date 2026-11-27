import { expect, test } from '@playwright/test'

import { signUp } from './helpers'

test('felhasználói menü: nyitás, témaváltás, Escape és kijelentkezés', async ({ page }) => {
  await signUp(page)

  const trigger = page.getByRole('button', { name: 'E2E Teszt' })
  await expect(page.getByRole('navigation', { name: 'Fő navigáció' })).toBeVisible()
  await expect(trigger).toHaveAttribute('aria-expanded', 'false')

  // Nyitás: név, e-mail-cím és a tételek; az első tételre kerül a fókusz.
  await trigger.click()
  const menu = page.getByRole('menu', { name: 'Felhasználói menü' })
  await expect(trigger).toHaveAttribute('aria-expanded', 'true')
  await expect(menu).toContainText('@example.com')
  await expect(menu.getByRole('menuitem', { name: 'Sötét téma' })).toBeFocused()

  // Témaváltás a menüből: a menü zár, a téma vált, és a felirat követi.
  await menu.getByRole('menuitem', { name: 'Sötét téma' }).click()
  await expect(menu).toHaveCount(0)
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await trigger.click()
  await expect(menu.getByRole('menuitem', { name: 'Világos téma' })).toBeVisible()

  // Escape: zár, a fókusz a gombra tér vissza.
  await page.keyboard.press('Escape')
  await expect(menu).toHaveCount(0)
  await expect(trigger).toBeFocused()

  // Kívülre kattintás zár.
  await trigger.click()
  await page.getByRole('heading', { name: 'Webhelyeim' }).click()
  await expect(menu).toHaveCount(0)

  // Kijelentkezés.
  await trigger.click()
  await menu.getByRole('menuitem', { name: 'Kijelentkezés' }).click()
  await expect(page.getByRole('heading', { name: 'Bejelentkezés', level: 1 })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Váltás világos témára' })).toBeVisible()
})

test('app shell: mobilon a fejléc nem nyúlik túl, a név rejtett, az avatar elérhető', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 800 })
  await signUp(page)

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(overflow).toBeLessThanOrEqual(0)
  await expect(page.locator('.user-trigger__name')).toBeHidden()
  await page.locator('.user-trigger').click()
  await expect(page.getByRole('menuitem', { name: 'Kijelentkezés' })).toBeVisible()
})
