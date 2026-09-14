import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { buildCentresParams, useCentres, useCentreDepartments } from '~/composables/useCentres'

const fetchMock = vi.fn()

interface AsyncDataOptions {
  getCachedData?: (key: string, nuxtApp: unknown, ctx: { cause: string }) => unknown
}

let capturedOptions: AsyncDataOptions | undefined

vi.stubGlobal('useRuntimeConfig', () => ({ public: { apiBase: 'http://api.test' } }))
vi.stubGlobal('logServerError', vi.fn())
vi.stubGlobal('$fetch', fetchMock)
vi.stubGlobal(
  'useAsyncData',
  async (_key: unknown, handler: () => Promise<unknown>, options?: AsyncDataOptions) => {
    capturedOptions = options
    return {
      data: ref(await handler()),
      pending: ref(false),
      error: ref(null),
      refresh: vi.fn()
    }
  }
)

beforeEach(() => {
  vi.clearAllMocks()
  fetchMock.mockResolvedValue([])
})

describe('buildCentresParams', () => {
  it('retourne un objet vide sans critère', () => {
    expect(buildCentresParams({})).toEqual({})
  })

  it('passe department et search trimmés', () => {
    expect(buildCentresParams({ department: ' Rhône ', search: ' lyon ' })).toEqual({
      department: 'Rhône',
      search: 'lyon'
    })
  })
})

describe('useCentres', () => {
  it('interroge l’API /centres avec les params de la query', async () => {
    fetchMock.mockResolvedValue([{ slug: 'lyon' }])

    const { data } = await useCentres(ref({ search: 'Lyon', department: 'Rhône' }))

    expect(fetchMock).toHaveBeenCalledWith('http://api.test/centres', {
      query: { search: 'Lyon', department: 'Rhône' }
    })
    expect(data.value).toEqual([{ slug: 'lyon' }])
  })

  it('dégrade à [] en cas d’erreur API', async () => {
    fetchMock.mockRejectedValue(new Error('network'))

    const { data } = await useCentres(ref({}))

    expect(data.value).toEqual([])
  })

  it('ne sert le payload Nuxt que sur la cause initiale (pas sur les refetches watch)', async () => {
    await useCentres(ref({}))

    const nuxtApp = {
      payload: { data: { 'centres:{}': [{ slug: 'cached' }] } },
      static: { data: {} }
    }
    const getCachedData = capturedOptions?.getCachedData

    expect(getCachedData?.('centres:{}', nuxtApp, { cause: 'initial' })).toEqual([
      { slug: 'cached' }
    ])
    expect(getCachedData?.('centres:{}', nuxtApp, { cause: 'watch' })).toBeUndefined()
    expect(getCachedData?.('centres:{}', nuxtApp, { cause: 'refresh:manual' })).toBeUndefined()
  })
})

describe('useCentreDepartments', () => {
  it('interroge l’API /centres/departments', async () => {
    fetchMock.mockResolvedValue(['Paris', 'Rhône'])

    const { data } = await useCentreDepartments()

    expect(fetchMock).toHaveBeenCalledWith('http://api.test/centres/departments')
    expect(data.value).toEqual(['Paris', 'Rhône'])
  })

  it('dégrade à [] en cas d’erreur API', async () => {
    fetchMock.mockRejectedValue(new Error('network'))

    const { data } = await useCentreDepartments()

    expect(data.value).toEqual([])
  })

  it('ne sert le payload Nuxt que sur la cause initiale', async () => {
    await useCentreDepartments()

    const nuxtApp = {
      payload: { data: { 'centres-departments': ['Paris'] } },
      static: { data: {} }
    }
    const getCachedData = capturedOptions?.getCachedData

    expect(getCachedData?.('centres-departments', nuxtApp, { cause: 'initial' })).toEqual(['Paris'])
    expect(getCachedData?.('centres-departments', nuxtApp, { cause: 'watch' })).toBeUndefined()
  })
})
