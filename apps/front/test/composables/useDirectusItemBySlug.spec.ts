import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { useDirectusItemBySlug } from '~/composables/useDirectusItemBySlug'

const requestMock = vi.fn()

vi.stubGlobal('useDirectusClient', () => ({ request: requestMock }))
vi.stubGlobal('useAsyncData', async (_key: string, handler: () => Promise<unknown>) => ({
  data: ref(await handler())
}))
vi.stubGlobal('createError', (err: { statusCode: number; statusMessage: string }) => {
  const error = new Error(err.statusMessage) as Error & { statusCode: number }
  error.statusCode = err.statusCode
  return error
})

beforeEach(() => {
  requestMock.mockReset()
})

describe('useDirectusItemBySlug', () => {
  it('retourne le premier item trouvé pour le slug', async () => {
    const item = { slug: 'creteil', name: 'Centre de Créteil' }
    requestMock.mockResolvedValue([item])

    const result = await useDirectusItemBySlug('centres', 'creteil', 'centre-creteil')

    expect(requestMock).toHaveBeenCalledTimes(1)
    expect(result).toEqual(item)
  })

  it('lève une erreur 404 quand aucun item ne correspond', async () => {
    requestMock.mockResolvedValue([])

    await expect(
      useDirectusItemBySlug('centres', 'inconnu', 'centre-inconnu')
    ).rejects.toMatchObject({ statusCode: 404, message: 'Page introuvable' })
  })
})
