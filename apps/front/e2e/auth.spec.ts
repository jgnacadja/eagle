import { expect, test } from './fixtures'
import { PASSWORD, uniqueEmail } from './helpers/api'

test.describe('Authentication', () => {
  test('registration with valid fields grants access to the app', async ({ page }) => {
    const email = uniqueEmail()
    await page.goto('/register', { waitUntil: 'domcontentloaded' })
    await page.locator('#firstname').waitFor({ state: 'visible' })
    await page.locator('#firstname').fill('Test')
    await page.locator('#lastname').fill('User')
    await page.locator('#email').fill(email)
    await page.locator('#confirmEmail').fill(email)
    await page.locator('#password').fill(PASSWORD)
    await page.locator('#confirmPassword').fill(PASSWORD)
    await page.getByRole('button', { name: "S'inscrire" }).click()
    await expect(page).toHaveURL('/login')
  })

  test('valid login grants access to the app', async ({ page, testUser }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' })
    await page.locator('#email').waitFor({ state: 'visible' })
    await page.locator('#email').fill(testUser.email)
    await page.locator('#password').fill(testUser.password)
    await page.getByRole('button', { name: 'Se connecter' }).click()
    await expect(page).toHaveURL('/')
  })

  test('invalid login shows an error and stays on /login', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' })
    await page.locator('#email').waitFor({ state: 'visible' })
    await page.locator('#email').fill('nobody@test.local')
    await page.locator('#password').fill('wrongpassword')
    await page.getByRole('button', { name: 'Se connecter' }).click()
    await expect(page.locator('#alert-auth')).toBeVisible()
    await expect(page).toHaveURL('/login')
  })

  test('unauthenticated direct access to / redirects to /login', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await expect(page).toHaveURL('/login')
  })

  test('page reload keeps the user logged in', async ({ authenticatedPage: page }) => {
    await page.reload({ waitUntil: 'domcontentloaded' })
    await expect(page).toHaveURL('/')
  })
})
