import { expect, test } from './fixtures'
import { completeTask, createTask } from './helpers/api'

const FUTURE_DATE = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

test.describe('Tasks', () => {
  test('creating a valid task makes it appear in the list', async ({ listContext: { page } }) => {
    await page.getByRole('button', { name: 'Nouvelle tâche' }).click()
    await page.getByPlaceholder('Titre de la tâche *').fill('My new task')
    await page.getByPlaceholder('Titre de la tâche *').press('Enter')
    await expect(
      page.locator('[data-testid="task-card"]').filter({ hasText: 'My new task' })
    ).toBeVisible()
  })

  test('submitting without a title shows a validation error', async ({ listContext: { page } }) => {
    await page.getByRole('button', { name: 'Nouvelle tâche' }).click()
    await page.getByPlaceholder('Titre de la tâche *').press('Enter')
    await expect(page.locator('[data-testid="task-form-error"]')).toBeVisible()
  })

  test('marking a task complete moves it to the completed section', async ({
    listContext: { page, list, token }
  }) => {
    await createTask(token, list.id, { shortDescription: 'Task to complete', dueDate: FUTURE_DATE })
    await page.reload()
    await expect(page.getByRole('heading', { name: list.name })).toBeVisible()

    const card = page.locator('[data-testid="task-card"]').filter({ hasText: 'Task to complete' })
    await card.getByRole('button', { name: 'Terminer' }).click()

    await expect(page.getByRole('button', { name: /Mes tâches terminées/ })).toBeVisible()
    await page.getByRole('button', { name: /Mes tâches terminées/ }).click()
    await expect(
      page.locator('[data-testid="task-card"]').filter({ hasText: 'Task to complete' })
    ).toBeVisible()
  })

  test('the completed section is hidden by default and can be expanded', async ({
    listContext: { page, list, token }
  }) => {
    const task = await createTask(token, list.id, {
      shortDescription: 'Done task',
      dueDate: FUTURE_DATE
    })
    await completeTask(token, task.id)
    await page.reload()
    await expect(page.getByRole('heading', { name: list.name })).toBeVisible()

    const toggleBtn = page.getByRole('button', { name: /Mes tâches terminées/ })
    await expect(toggleBtn).toBeVisible()
    await expect(
      page.locator('[data-testid="task-card"]').filter({ hasText: 'Done task' })
    ).not.toBeVisible()

    await toggleBtn.click()
    await expect(
      page.locator('[data-testid="task-card"]').filter({ hasText: 'Done task' })
    ).toBeVisible()
  })

  test('reactivating a completed task moves it back to the active list', async ({
    listContext: { page, list, token }
  }) => {
    const task = await createTask(token, list.id, {
      shortDescription: 'Reactivate me',
      dueDate: FUTURE_DATE
    })
    await completeTask(token, task.id)
    await page.reload()
    await expect(page.getByRole('heading', { name: list.name })).toBeVisible()

    await page.getByRole('button', { name: /Mes tâches terminées/ }).click()
    const card = page.locator('[data-testid="task-card"]').filter({ hasText: 'Reactivate me' })
    await card.getByRole('button', { name: 'Réactiver' }).click()

    await expect(
      page.locator('[data-testid="task-card"]').filter({ hasText: 'Reactivate me' }).first()
    ).not.toHaveClass(/opacity-70/)
  })

  test('clicking a task card opens the detail sidebar', async ({
    listContext: { page, list, token }
  }) => {
    await createTask(token, list.id, { shortDescription: 'Detail task', dueDate: FUTURE_DATE })
    await page.reload()
    await expect(page.getByRole('heading', { name: list.name })).toBeVisible()

    await page.locator('[data-testid="task-card"]').filter({ hasText: 'Detail task' }).click()
    await expect(page.locator('[data-testid="detail-panel"]')).toBeVisible()
    await expect(page.locator('[data-testid="detail-panel"]')).toContainText('Detail task')
  })

  test('deleting a task removes it from the list and closes the sidebar', async ({
    listContext: { page, list, token }
  }) => {
    await createTask(token, list.id, { shortDescription: 'Delete me', dueDate: FUTURE_DATE })
    await page.reload()
    await expect(page.getByRole('heading', { name: list.name })).toBeVisible()

    await page.locator('[data-testid="task-card"]').filter({ hasText: 'Delete me' }).click()
    await expect(page.locator('[data-testid="detail-panel"]')).toBeVisible()

    await page.locator('[data-testid="delete-btn"]').click()
    await page.getByRole('button', { name: 'Supprimer' }).last().click()

    await expect(
      page.locator('[data-testid="task-card"]').filter({ hasText: 'Delete me' })
    ).not.toBeVisible()
    await expect(page.locator('[data-testid="detail-panel"]')).not.toBeVisible()
  })
})
