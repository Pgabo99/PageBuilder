import { expect, test, type Page } from '@playwright/test'

import { createPage, createWebsite, openPageSettings, signUp, uniqueId } from './helpers'

// Minden .loader__spinner megjelenését rögzíti, így a villogás hiánya is ellenőrizhető.
async function trackSpinner(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const w = window as unknown as { __spinners: number }
    w.__spinners = 0
    new MutationObserver((records) => {
      for (const record of records) {
        record.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement && node.matches('.loader__spinner')) w.__spinners++
        })
      }
    }).observe(document, { childList: true, subtree: true })
  })
}

const spinners = (page: Page) =>
  page.evaluate(() => (window as unknown as { __spinners: number }).__spinners)

test('loader: lassú hálózaton megjelenik, gyors válasznál nem villan, mentés közben látszik', async ({
  page,
}) => {
  const id = uniqueId()
  await signUp(page)
  await createWebsite(page, `Webhely ${id}`, `webhely-${id}`)
  await createPage(page, `Oldal ${id}`, `oldal-${id}`)
  const editorUrl = page.url()

  // Gyors válasz (~30 ms): a jelző nem jelenhet meg. Kliensoldali navigációval mérünk, mert a teljes
  // oldalbetöltést a dev szerver modulletöltése is lassíthatja.
  await trackSpinner(page)
  const firstLoad = page.waitForResponse(
    (r) => /\/api\/v1\/pages\/\d+$/.test(r.url()) && r.request().method() === 'GET',
  )
  await page.goto(editorUrl)
  await expect(page.getByRole('heading', { name: 'Oldal szerkesztése' })).toBeVisible()
  await page.getByRole('link', { name: '← Vissza a webhelyhez' }).click()
  await expect(page.getByRole('link', { name: `Oldal ${id}` })).toBeVisible()
  // Előre lekért válasz, ~30 ms késleltetéssel kiszolgálva: a valós szerver sebessége nem számít.
  const recorded = await (await firstLoad).text()
  await page.route('**/api/v1/pages/*', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 30))
    await route.fulfill({ status: 200, contentType: 'application/json', body: recorded })
  })
  await page.evaluate(() => ((window as unknown as { __spinners: number }).__spinners = 0))
  await page.getByRole('link', { name: `Oldal ${id}` }).click()
  await expect(page.getByRole('heading', { name: 'Oldal szerkesztése' })).toBeVisible()
  expect(await spinners(page)).toBe(0)
  await page.unroute('**/api/v1/pages/*')

  // Lassú válasz: a szöveges állapot azonnal, a jelző késleltetve megjelenik, a betöltés végén eltűnik.
  await page.route('**/api/v1/pages/*', async (route) => {
    if (route.request().method() === 'GET') await new Promise((resolve) => setTimeout(resolve, 1500))
    await route.continue()
  })
  await page.goto(editorUrl)
  await expect(page.getByRole('status').filter({ hasText: 'Betöltés…' })).toBeVisible()
  await expect(page.locator('.loader__spinner')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Oldal szerkesztése' })).toBeVisible()
  await expect(page.locator('.loader__spinner')).toHaveCount(0)

  // Mentés közben: állapotsor és a gomb jelzője; a végén „Mentve”.
  await page.route('**/api/v1/pages/*', async (route) => {
    if (route.request().method() === 'PUT') await new Promise((resolve) => setTimeout(resolve, 1500))
    await route.continue()
  })
  await openPageSettings(page)
  await page.getByLabel('Cím', { exact: true }).fill(`Új cím ${id}`)
  await page.getByRole('button', { name: 'Mentés', exact: true }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Mentés…' })).toBeVisible()
  await expect(page.locator('.btn .loader__spinner')).toBeVisible()
  await expect(page.getByText('Mentve', { exact: true })).toBeVisible()
})

test('loader: csökkentett mozgásnál a jelző nem pörög', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.route('**/api/v1/user', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 1500))
    await route.continue()
  })
  await page.goto('/login')

  const spinner = page.locator('.loader__spinner')
  await expect(spinner).toBeVisible()
  await expect(spinner).toHaveCSS('animation-name', 'none')
})
