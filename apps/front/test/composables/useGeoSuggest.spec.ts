import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useGeoSuggest } from '~/composables/useGeoSuggest'

const fetchMock = vi.fn()

beforeEach(() => {
  vi.useFakeTimers()
  fetchMock.mockReset()
  vi.stubGlobal('$fetch', fetchMock)
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

async function request(suggest: ReturnType<typeof useGeoSuggest>, value: string) {
  suggest.request(value)
  await vi.advanceTimersByTimeAsync(250)
}

describe('useGeoSuggest', () => {
  it('debounce : pas de fetch avant 200 ms', async () => {
    fetchMock.mockResolvedValue([])
    const suggest = useGeoSuggest()

    suggest.request('lyon')
    await vi.advanceTimersByTimeAsync(150)
    expect(fetchMock).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(100)
    expect(fetchMock).toHaveBeenCalled()
  })

  it('mappe une commune en label + lat,lng + terme nom', async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.endsWith('/communes')) {
        return Promise.resolve([
          { nom: 'Lyon', codeDepartement: '69', centre: { coordinates: [4.8357, 45.764] } }
        ])
      }
      return Promise.resolve([])
    })
    const suggest = useGeoSuggest()

    await request(suggest, 'lyon')

    expect(suggest.suggestions.value).toEqual([
      { label: 'Lyon (69)', location: '45.764,4.8357', term: 'Lyon', kind: 'commune' }
    ])
    expect(suggest.byLabel('Lyon (69)')?.term).toBe('Lyon')
    expect(suggest.byLocation('45.764,4.8357')?.label).toBe('Lyon (69)')
  })

  it('déduplique département et commune de même libellé (« Paris (75) »)', async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.endsWith('/communes')) {
        return Promise.resolve([
          { nom: 'Paris', codeDepartement: '75', centre: { coordinates: [2.3522, 48.8566] } }
        ])
      }
      return Promise.resolve([{ code: '75', nom: 'Paris' }])
    })
    const suggest = useGeoSuggest()

    await request(suggest, 'paris')

    // Le département (listé en premier) gagne : une seule entrée, kind department.
    expect(suggest.suggestions.value).toEqual([
      { label: 'Paris (75)', location: '75', term: 'Paris', kind: 'department' }
    ])
  })

  it('mappe un département en label + code + terme nom', async () => {
    fetchMock.mockResolvedValue([{ code: '69', nom: 'Rhône' }])
    const suggest = useGeoSuggest()

    await request(suggest, '69')

    expect(fetchMock).toHaveBeenCalledWith(
      'https://geo.api.gouv.fr/departements',
      expect.objectContaining({ params: { code: '69' } })
    )
    expect(suggest.suggestions.value).toEqual([
      { label: 'Rhône (69)', location: '69', term: 'Rhône', kind: 'department' }
    ])
  })

  it('interroge les communes par code postal pour 5 chiffres', async () => {
    fetchMock.mockResolvedValue([{ nom: 'Lyon', codeDepartement: '69' }])
    const suggest = useGeoSuggest()

    await request(suggest, '69003')

    expect(fetchMock).toHaveBeenCalledWith(
      'https://geo.api.gouv.fr/communes',
      expect.objectContaining({ params: expect.objectContaining({ codePostal: '69003' }) })
    )
  })

  it('dégrade à [] quand l’API geo échoue', async () => {
    fetchMock.mockRejectedValue(new Error('network'))
    const suggest = useGeoSuggest()

    await request(suggest, 'lyon')

    expect(suggest.suggestions.value).toEqual([])
  })

  it('ignore une réponse périmée (garde de séquence)', async () => {
    let resolveFirst!: (v: unknown) => void
    fetchMock
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveFirst = resolve
          })
      )
      .mockImplementation((url: string) =>
        Promise.resolve(url.endsWith('/communes') ? [{ nom: 'Lille', codeDepartement: '59' }] : [])
      )
    const suggest = useGeoSuggest()

    suggest.request('lyo')
    await vi.advanceTimersByTimeAsync(250)
    suggest.request('lil')
    await vi.advanceTimersByTimeAsync(250)
    resolveFirst([{ nom: 'Lyon', codeDepartement: '69' }])
    await vi.advanceTimersByTimeAsync(0)

    expect(suggest.suggestions.value).toEqual([
      { label: 'Lille (59)', location: 'Lille', term: 'Lille', kind: 'commune' }
    ])
  })

  it('reset vide les suggestions', async () => {
    fetchMock.mockResolvedValue([{ code: '69', nom: 'Rhône' }])
    const suggest = useGeoSuggest()

    await request(suggest, '69')
    suggest.reset()

    expect(suggest.suggestions.value).toEqual([])
  })
})
