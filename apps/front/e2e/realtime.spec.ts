import { expect, test, type Browser } from '@playwright/test'
import { createList, createTask, PASSWORD, registerUser, uniqueEmail } from './helpers/api'

const FUTURE_DATE = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

async function loginPage(browser: Browser, email: string, listName: string) {
  const ctx = await browser.newContext()
  const page = await ctx.newPage()
  await page.goto('/login', { waitUntil: 'domcontentloaded' })
  await page.locator('#email').waitFor({ state: 'visible' })
  await page.locator('#email').fill(email)
  await page.locator('#password').fill(PASSWORD)
  await page.getByRole('button', { name: 'Se connecter' }).click()
  await page.waitForURL('/')
  await expect(page.getByRole('heading', { name: listName })).toBeVisible({ timeout: 10_000 })
  return { ctx, page }
}

test.describe('Real-time sync (two tabs)', () => {
  test('task created in tab A appears in tab B without reload', async ({ browser }) => {
    const email = uniqueEmail()
    const token = await registerUser(email)
    const list = await createList(token, `RT-create-${Date.now()}`)

    const a = await loginPage(browser, email, list.name)
    const b = await loginPage(browser, email, list.name)

    try {
      await a.page.getByRole('button', { name: 'Nouvelle tâche' }).click()
      await a.page.getByPlaceholder('Titre de la tâche *').fill('Realtime task')
      await a.page.getByPlaceholder('Titre de la tâche *').press('Enter')

      await expect(
        b.page.locator('[data-testid="task-card"]').filter({ hasText: 'Realtime task' })
      ).toBeVisible({ timeout: 8_000 })
    } finally {
      await a.ctx.close()
      await b.ctx.close()
    }
  })

  test('task completed in tab A moves to completed in tab B', async ({ browser }) => {
    const email = uniqueEmail()
    const token = await registerUser(email)
    const list = await createList(token, `RT-complete-${Date.now()}`)
    await createTask(token, list.id, { shortDescription: 'Complete in A', dueDate: FUTURE_DATE })

    const a = await loginPage(browser, email, list.name)
    const b = await loginPage(browser, email, list.name)

    try {
      await a.page
        .locator('[data-testid="task-card"]')
        .filter({ hasText: 'Complete in A' })
        .getByRole('button', { name: 'Terminer' })
        .click()

      await expect(b.page.getByRole('button', { name: /Mes tâches terminées/ })).toBeVisible({
        timeout: 8_000
      })
    } finally {
      await a.ctx.close()
      await b.ctx.close()
    }
  })

  test('task deleted in tab A disappears from tab B', async ({ browser }) => {
    const email = uniqueEmail()
    const token = await registerUser(email)
    const list = await createList(token, `RT-delete-${Date.now()}`)
    await createTask(token, list.id, { shortDescription: 'Delete in A', dueDate: FUTURE_DATE })

    const a = await loginPage(browser, email, list.name)
    const b = await loginPage(browser, email, list.name)

    try {
      await a.page.locator('[data-testid="task-card"]').filter({ hasText: 'Delete in A' }).click()
      await a.page.locator('[data-testid="delete-btn"]').click()
      await a.page.getByRole('button', { name: 'Supprimer' }).last().click()

      await expect(
        b.page.locator('[data-testid="task-card"]').filter({ hasText: 'Delete in A' })
      ).not.toBeVisible({ timeout: 8_000 })
    } finally {
      await a.ctx.close()
      await b.ctx.close()
    }
  })
})
