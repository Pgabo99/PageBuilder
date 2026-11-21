import { expect, test } from '@playwright/test'

// IDEIGLENES: a hibaartifact feltöltésének igazolása, a következő commit visszavonja.
test('szándékos hiba', async ({ page }) => {
  await page.goto('/login')
  await expect(page.getByRole('heading', { name: 'Nincs ilyen' })).toBeVisible({ timeout: 2000 })
})
