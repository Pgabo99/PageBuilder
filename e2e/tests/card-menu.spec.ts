import { expect, test } from '@playwright/test'

import { addComponent, createPage, createWebsite, signUp, uniqueId } from './helpers'

test('komponenskártya: típusikon, hárompontos menü (másolás, törlés), lábléc és mobil', async ({
  page,
}) => {
  const id = uniqueId()
  await signUp(page)
  await createWebsite(page, `Webhely ${id}`, `webhely-${id}`)
  await createPage(page, `Oldal ${id}`, `oldal-${id}`)
  await addComponent(page, 'Címsor')
  await addComponent(page, 'Szöveg')

  const cards = page.locator('.component')
  await expect(cards).toHaveCount(2)
  // A kártyafejlécben a típus ikonja látszik, az aktív kártya kiemelt.
  await expect(cards.first().locator('.component__icon svg')).toBeVisible()
  await expect(cards.nth(1)).toHaveClass(/component--active/)

  // Másolás a menüből: a másolat az eredeti után áll és aktív.
  await cards.first().getByRole('button', { name: 'További műveletek' }).click()
  const menu = page.getByRole('menu', { name: 'További műveletek' })
  await expect(menu.getByRole('menuitem')).toHaveText(['Komponens másolása', 'Komponens törlése'])
  await menu.getByRole('menuitem', { name: 'Komponens másolása' }).click()
  await expect(cards).toHaveCount(3)
  await expect(cards.nth(1)).toHaveClass(/component--active/)

  // Törlés a menüből (veszélyes stílus), a fókusz a menü gombjára tér vissza.
  await cards.nth(1).getByRole('button', { name: 'További műveletek' }).click()
  await expect(menu.getByRole('menuitem', { name: 'Komponens törlése' })).toHaveClass(
    /menu__item--danger/,
  )
  await menu.getByRole('menuitem', { name: 'Komponens törlése' }).click()
  await expect(cards).toHaveCount(2)

  // Lábléc: nincs másolás.
  await addComponent(page, 'Lábléc')
  await cards.last().getByRole('button', { name: 'További műveletek' }).click()
  await expect(menu.getByRole('menuitem')).toHaveText(['Komponens törlése'])
  await page.keyboard.press('Escape')

  // Mobilon a kártyák nem nyúlnak túl a nézeten.
  await page.setViewportSize({ width: 390, height: 800 })
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(overflow).toBeLessThanOrEqual(0)
})
