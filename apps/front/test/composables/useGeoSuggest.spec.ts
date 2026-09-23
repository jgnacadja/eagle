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

  it('conserve ville et département homonymes (« paris » → ville + département)', async () => {
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

    // La ville n'est plus absorbée par le département : des libellés
    // distincts (« (département XX) ») font coexister les deux entrées.
    expect(suggest.suggestions.value).toEqual([
      { label: 'Paris (75)', location: '48.8566,2.3522', term: 'Paris', kind: 'commune' },
      { label: 'Paris (département 75)', location: '75', term: 'Paris', kind: 'department' }
    ])
  })

  it('mappe un département en label + code + terme nom', async () => {
    fetchMock.mockImplementation((url: string) =>
      Promise.resolve(url.endsWith('/departements') ? [{ code: '69', nom: 'Rhône' }] : [])
    )
    const suggest = useGeoSuggest()

    await request(suggest, '69')

    expect(fetchMock).toHaveBeenCalledWith('https://geo.api.gouv.fr/departements')
    expect(suggest.suggestions.value).toEqual([
      { label: 'Rhône (département 69)', location: '69', term: 'Rhône', kind: 'department' }
    ])
  })

  it('propose les codes postaux du département pour une saisie de 2 chiffres', async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.endsWith('/departements')) {
        return Promise.resolve([
          { code: '75', nom: 'Paris' },
          { code: '77', nom: 'Seine-et-Marne' }
        ])
      }
      if (url.includes('/departements/75/communes')) {
        return Promise.resolve([
          {
            nom: 'Paris',
            codeDepartement: '75',
            codesPostaux: ['75001', '75002', '75020', '75116'],
            centre: { coordinates: [2.347, 48.8589] }
          }
        ])
      }
      return Promise.resolve([])
    })
    const suggest = useGeoSuggest()

    await request(suggest, '75')

    expect(fetchMock).toHaveBeenCalledWith(
      'https://geo.api.gouv.fr/departements/75/communes',
      expect.objectContaining({
        params: expect.objectContaining({ fields: expect.stringContaining('codesPostaux') })
      })
    )
    expect(suggest.suggestions.value).toEqual([
      { label: 'Paris (département 75)', location: '75', term: 'Paris', kind: 'department' },
      { label: '75001 Paris', location: '48.8589,2.347', term: '75001', kind: 'commune' },
      { label: '75002 Paris', location: '48.8589,2.347', term: '75002', kind: 'commune' },
      { label: '75020 Paris', location: '48.8589,2.347', term: '75020', kind: 'commune' },
      { label: '75116 Paris', location: '48.8589,2.347', term: '75116', kind: 'commune' }
    ])
  })

  it('filtre les codes postaux par préfixe pour une saisie de 3-4 chiffres', async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.endsWith('/departements')) return Promise.resolve([{ code: '75', nom: 'Paris' }])
      if (url.includes('/departements/75/communes')) {
        return Promise.resolve([
          { nom: 'Paris', codesPostaux: ['75001', '75011', '75010', '75116'] }
        ])
      }
      return Promise.resolve([])
    })
    const suggest = useGeoSuggest()

    await request(suggest, '7501')

    expect(suggest.suggestions.value.map((s) => s.label)).toEqual(['75010 Paris', '75011 Paris'])
  })

  it('résout un code postal complet en suggestion « CP + ville »', async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.endsWith('/departements')) return Promise.resolve([{ code: '69', nom: 'Rhône' }])
      if (url.includes('/departements/69/communes')) {
        return Promise.resolve([
          { nom: 'Lyon 3e', codesPostaux: ['69003'], centre: { coordinates: [4.9, 45.76] } }
        ])
      }
      return Promise.resolve([])
    })
    const suggest = useGeoSuggest()

    await request(suggest, '69003')

    expect(suggest.suggestions.value).toEqual([
      { label: '69003 Lyon 3e', location: '45.76,4.9', term: '69003', kind: 'commune' }
    ])
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
