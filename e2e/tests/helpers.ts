import { randomUUID } from 'node:crypto'

import { expect, type Page } from '@playwright/test'

/** Kisbetűs, kötőjelmentes azonosító (webcímnek is megfelel); minden teszt saját adatot hoz létre. */
export const uniqueId = (): string => randomUUID().replaceAll('-', '').slice(0, 12)

/** Új, futásidőben generált felhasználó regisztrációja a felületen; valódi adat nem kerül a tesztbe. */
export async function signUp(page: Page): Promise<void> {
  const password = `Pw-${randomUUID()}`

  await page.goto('/register')
  await page.getByLabel('Név', { exact: true }).fill('E2E Teszt')
  await page.getByLabel('E-mail-cím').fill(`e2e-${uniqueId()}@example.com`)
  await page.getByLabel('Jelszó', { exact: true }).fill(password)
  await page.getByLabel('Jelszó megerősítése').fill(password)
  await page.getByRole('button', { name: 'Regisztráció' }).click()

  await expect(page.getByRole('heading', { name: 'Webhelyeim' })).toBeVisible()
}

/** A webhelyek nézetről új webhelyet hoz létre; a webhely nézetén ér véget. */
export async function createWebsite(page: Page, name: string, slug: string): Promise<void> {
  await page.getByRole('link', { name: 'Új webhely' }).click()
  await page.getByLabel('Név', { exact: true }).fill(name)
  await page.getByLabel('Webcím', { exact: true }).fill(slug)
  await page.getByRole('button', { name: 'Mentés', exact: true }).click()

  await expect(page.getByRole('heading', { name, level: 1 })).toBeVisible()
}

/** A webhely nézetről új (üres) oldalt hoz létre, és megnyitja a szerkesztőjét. */
export async function createPage(page: Page, title: string, slug: string): Promise<void> {
  await page.getByRole('link', { name: 'Új oldal' }).click()
  await page.getByLabel('Cím', { exact: true }).fill(title)
  await page.getByLabel('Webcím', { exact: true }).fill(slug)
  await page.getByRole('button', { name: 'Mentés', exact: true }).click()

  await page.getByRole('link', { name: title }).click()
  await expect(page.getByRole('heading', { name: 'Oldal szerkesztése' })).toBeVisible()
}

/** A szerkesztőben a "Hozzáadás" sávból új komponenst vesz fel. */
export async function addComponent(page: Page, label: 'Címsor' | 'Szöveg' | 'Gomb'): Promise<void> {
  await page
    .getByRole('group', { name: 'Komponens hozzáadása' })
    .getByRole('button', { name: `+ ${label}` })
    .click()
}

/** Mentés a szerkesztőben, megvárva a "Mentve" állapotot. */
export async function savePage(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Mentés', exact: true }).click()
  await expect(page.getByText('Mentve', { exact: true })).toBeVisible()
}
