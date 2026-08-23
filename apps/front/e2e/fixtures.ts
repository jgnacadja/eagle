import { expect, test as base, type Page } from '@playwright/test'
import { createList, PASSWORD, registerUser, uniqueEmail } from './helpers/api'

type TestUser = { email: string; password: string; token: string }
type ListData = { id: string; name: string }

type Fixtures = {
  testUser: TestUser
  authenticatedPage: Page
  listContext: { page: Page; list: ListData; token: string }
}

export const test = base.extend<Fixtures>({
  testUser: async (_fixtures, use) => {
    const email = uniqueEmail()
    const token = await registerUser(email)
    await use({ email, password: PASSWORD, token })
  },

  authenticatedPage: async ({ page, testUser }, use) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' })
    await page.locator('#email').waitFor({ state: 'visible' })
    await page.locator('#email').fill(testUser.email)
    await page.locator('#password').fill(testUser.password)
    await page.getByRole('button', { name: 'Se connecter' }).click()
    await page.waitForURL('/')
    await use(page)
  },

  listContext: async ({ authenticatedPage: page, testUser }, use) => {
    const list = await createList(testUser.token, `List ${Date.now()}`)
    await page.reload()
    await expect(page.getByRole('heading', { name: list.name })).toBeVisible({ timeout: 10_000 })
    await use({ page, list, token: testUser.token })
  }
})

export { expect }
