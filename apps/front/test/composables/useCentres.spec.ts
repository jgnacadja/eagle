import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import type { CourseListItem } from '@learnup/types'
import {
  availabilityStatus,
  buildCentresParams,
  useCentres,
  useCentreDepartments,
  useCentreSessionDates,
  useCentresTotal
} from '~/composables/useCentres'

const fetchMock = vi.fn()

const { useCatalogMock } = vi.hoisted(() => ({ useCatalogMock: vi.fn() }))
vi.mock('~/composables/useCatalog', async (importOriginal) => ({
  ...(await importOriginal<typeof import('~/composables/useCatalog')>()),
  useCatalog: useCatalogMock
}))

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

describe('availabilityStatus', () => {
  const iso = (d: Date) => d.toISOString().slice(0, 10)
  const addDays = (days: number) => {
    const d = new Date()
    d.setUTCDate(d.getUTCDate() + days)
    return iso(d)
  }

  it('retourne « Sur demande » neutre sans session', () => {
    expect(availabilityStatus([])).toEqual({ type: 'neutral', label: 'Sur demande' })
  })

  it('retourne « Sessions cette semaine » quand une session tombe dans la semaine', () => {
    expect(availabilityStatus([addDays(0)])).toEqual({
      type: 'success',
      label: 'Sessions cette semaine'
    })
  })

  it('retourne « Sessions ce mois-ci » ou la date selon la position dans le mois', () => {
    // Lundi de la semaine prochaine : même mois → « Sessions ce mois-ci »,
    // mois suivant → « Prochaine session le … » en warning.
    const nextMonday = new Date()
    nextMonday.setUTCHours(0, 0, 0, 0)
    nextMonday.setUTCDate(nextMonday.getUTCDate() + ((8 - nextMonday.getUTCDay()) % 7 || 7))

    const status = availabilityStatus([iso(nextMonday)])
    const today = new Date()
    if (nextMonday.getUTCMonth() === today.getUTCMonth()) {
      expect(status).toEqual({ type: 'success', label: 'Sessions ce mois-ci' })
    } else {
      expect(status.type).toBe('warning')
      expect(status.label).toContain('Prochaine session le')
    }
  })

  it('retourne la prochaine session en warning quand elle est au-delà du mois', () => {
    const status = availabilityStatus([addDays(45)])
    expect(status.type).toBe('warning')
    expect(status.label).toMatch(/^Prochaine session le \d{2}\/\d{2}$/)
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
      isHydrating: true,
      payload: { data: { 'centres:{}': [{ slug: 'cached' }] } },
      static: { data: {} }
    }
    const getCachedData = capturedOptions?.getCachedData

    expect(getCachedData?.('centres:{}', nuxtApp, { cause: 'initial' })).toEqual([
      { slug: 'cached' }
    ])
    expect(
      getCachedData?.('centres:{}', { ...nuxtApp, isHydrating: false }, { cause: 'initial' })
    ).toBeUndefined()
    expect(getCachedData?.('centres:{}', nuxtApp, { cause: 'watch' })).toBeUndefined()
    expect(getCachedData?.('centres:{}', nuxtApp, { cause: 'refresh:manual' })).toBeUndefined()
  })
})

describe('useCentresTotal', () => {
  it('interroge /centres/count et retourne le compteur', async () => {
    fetchMock.mockResolvedValue({ count: 2 })

    const { data } = await useCentresTotal()

    expect(fetchMock).toHaveBeenCalledWith('http://api.test/centres/count', expect.anything())
    expect(data.value).toBe(2)
  })

  it('dégrade à 0 en cas d’erreur API', async () => {
    fetchMock.mockRejectedValue(new Error('network'))

    const { data } = await useCentresTotal()

    expect(data.value).toBe(0)
  })
})

describe('useCentreSessionDates', () => {
  const makeCourse = (i: number): CourseListItem =>
    ({
      sessions: [
        {
          id: `s${i}`,
          startDate: '2999-01-01',
          endDate: null,
          modality: 'presentiel',
          seatsRemaining: 3,
          location: { centreSlug: `centre-${i % 2}` }
        }
      ]
    }) as unknown as CourseListItem

  it('pagine le catalogue au-delà de la limite API de 100', async () => {
    useCatalogMock
      .mockResolvedValueOnce({
        data: ref({
          items: Array.from({ length: 100 }, (_, i) => makeCourse(i)),
          total: 101,
          page: 1,
          pageSize: 100
        })
      })
      .mockResolvedValueOnce({
        data: ref({ items: [makeCourse(100)], total: 101, page: 2, pageSize: 100 })
      })

    const dates = await useCentreSessionDates()

    expect(useCatalogMock).toHaveBeenCalledTimes(2)
    expect(useCatalogMock).toHaveBeenNthCalledWith(1, { limit: 100, page: 1 })
    expect(useCatalogMock).toHaveBeenNthCalledWith(2, { limit: 100, page: 2 })
    expect(dates.value.get('centre-0')).toHaveLength(51)
    expect(dates.value.get('centre-1')).toHaveLength(50)
  })

  it('dégrade à une map vide en cas d’erreur catalogue', async () => {
    useCatalogMock.mockRejectedValueOnce(new Error('400 limit'))

    const dates = await useCentreSessionDates()

    expect(dates.value.size).toBe(0)
  })
})

describe('useCentreDepartments', () => {
  it('interroge l’API /centres/departments et retourne la liste normalisée', async () => {
    fetchMock.mockResolvedValue(['Hauts-de-Seine', 'Paris', 'Val-de-Marne'])

    const { data } = await useCentreDepartments()

    expect(fetchMock).toHaveBeenCalledWith('http://api.test/centres/departments')
    expect(data.value).toEqual(['Hauts-de-Seine', 'Paris', 'Val-de-Marne'])
  })

  it('dégrade à [] en cas d’erreur API', async () => {
    fetchMock.mockRejectedValue(new Error('network'))

    const { data } = await useCentreDepartments()

    expect(data.value).toEqual([])
  })

  it('ne sert le payload Nuxt que sur la cause initiale', async () => {
    await useCentreDepartments()

    const nuxtApp = {
      isHydrating: true,
      payload: { data: { 'centres-departments': ['Paris'] } },
      static: { data: {} }
    }
    const getCachedData = capturedOptions?.getCachedData

    expect(getCachedData?.('centres-departments', nuxtApp, { cause: 'initial' })).toEqual(['Paris'])
    expect(
      getCachedData?.(
        'centres-departments',
        { ...nuxtApp, isHydrating: false },
        { cause: 'initial' }
      )
    ).toBeUndefined()
    expect(getCachedData?.('centres-departments', nuxtApp, { cause: 'watch' })).toBeUndefined()
  })
})
