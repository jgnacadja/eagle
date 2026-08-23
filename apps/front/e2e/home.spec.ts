import { expect, test } from '@playwright/test'

test('home page loads and displays the brand heading', async ({ page }) => {
  await page.goto('/login', { waitUntil: 'domcontentloaded' })
  await expect(page.getByRole('heading', { name: 'TaskFlow' })).toBeVisible()
})
