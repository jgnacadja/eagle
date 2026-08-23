import { expect, test } from './fixtures'
import { createList } from './helpers/api'

test.describe('Lists', () => {
  test('creating a list makes it appear in the sidebar', async ({ authenticatedPage: page }) => {
    await page.getByPlaceholder('Nouvelle liste…').fill('My new list')
    await page.getByRole('button', { name: '+' }).click()
    await expect(page.getByRole('button', { name: 'My new list' })).toBeVisible()
  })

  test('creating a list with a duplicate name shows an error', async ({
    authenticatedPage: page,
    testUser
  }) => {
    await createList(testUser.token, 'Duplicate List')
    await page.reload()
    await page.getByPlaceholder('Nouvelle liste…').fill('Duplicate List')
    await page.getByRole('button', { name: '+' }).click()
    await expect(page.locator('[data-testid="list-error"]')).toBeVisible()
  })

  test('selecting a list displays its content in the main area', async ({
    authenticatedPage: page,
    testUser
  }) => {
    const list = await createList(testUser.token, 'My Selected List')
    await page.reload()
    await page.getByRole('button', { name: list.name }).click()
    await expect(page.getByRole('heading', { name: list.name })).toBeVisible()
  })

  test('shows an invitation message when no list is selected', async ({
    authenticatedPage: page
  }) => {
    await expect(page.getByText('Sélectionnez ou créez une liste pour commencer.')).toBeVisible()
  })

  test('deleting a list removes it from the sidebar after confirmation', async ({
    authenticatedPage: page,
    testUser
  }) => {
    const list = await createList(testUser.token, 'List To Delete')
    await page.reload()

    const listItem = page.getByRole('listitem').filter({ hasText: list.name })
    await listItem.hover()
    await listItem.getByRole('button', { name: 'Supprimer la liste' }).click()
    await page.getByRole('button', { name: 'Supprimer' }).last().click()

    await expect(page.getByRole('button', { name: list.name })).not.toBeVisible()
  })
})
