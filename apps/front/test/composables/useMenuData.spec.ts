import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { computed, ref } from 'vue'
import {
  useMenuCentres,
  useMenuFamilles,
  useMenuFormationsALaUne,
  useMenuFormationsParFamille
} from '~/composables/useMenuData'

const fetchMock = vi.fn()
const directusRequestMock = vi.fn()

vi.stubGlobal('useRuntimeConfig', () => ({ public: { apiBase: 'http://api.test' } }))
vi.stubGlobal('$fetch', fetchMock)
vi.stubGlobal('useDirectusClient', () => ({ request: directusRequestMock }))
vi.stubGlobal(
  'useDirectusList',
  (_collection: string, _key: string, _query?: Record<string, unknown>) => {
    const data = ref<unknown>(null)
    const result = directusRequestMock()
    if (result && typeof (result as { then?: unknown }).then === 'function') {
      result.then((res: unknown) => {
        data.value = res
      })
    } else {
      data.value = result
    }
    return data
  }
)
vi.stubGlobal('logServerError', vi.fn())
vi.stubGlobal('computed', computed)

vi.stubGlobal('useAsyncData', (_key: string, handler: () => Promise<unknown>) => {
  const data = ref<unknown>(null)
  const result = handler()
  if (result && typeof (result as { then?: unknown }).then === 'function') {
    result.then((res: unknown) => {
      data.value = res
    })
  } else {
    data.value = result
  }
  return { data }
})

describe('useMenuData', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  describe('useMenuFamilles', () => {
    it('renvoie les familles du catalogue avec le nom Directus, triées et limitées à 4', async () => {
      directusRequestMock.mockResolvedValue([
        { slug: 'sante-secours', name: 'Santé & secours' },
        { slug: 'caces', name: 'CACES' },
        { slug: 'habilitations', name: 'Habilitations électriques' },
        { slug: 'qualite', name: 'Qualité' },
        { slug: 'management', name: 'Management' },
        { slug: 'last-one', name: 'Last one' }
      ])
      fetchMock.mockResolvedValue([
        { slug: 'sante-secours', count: 8 },
        { slug: 'management', count: 3 },
        { slug: 'caces', count: 12 },
        { slug: 'habilitations', count: 5 },
        { slug: 'qualite', count: 4 },
        { slug: 'last-one', count: 1 }
      ])

      const familles = useMenuFamilles()
      await flushPromises()

      expect(familles.value).toHaveLength(4)
      expect(familles.value).toEqual([
        { slug: 'caces', label: 'CACES', count: 12 },
        { slug: 'sante-secours', label: 'Santé & secours', count: 8 },
        { slug: 'habilitations', label: 'Habilitations électriques', count: 5 },
        { slug: 'qualite', label: 'Qualité', count: 4 }
      ])
      expect(directusRequestMock).toHaveBeenCalled()
      expect(fetchMock).toHaveBeenCalledWith('http://api.test/families')
    })

    it('dégrade avec les noms Directus si /families échoue', async () => {
      directusRequestMock.mockResolvedValue([
        { slug: 'caces', name: 'CACES' },
        { slug: 'management', name: 'Management' }
      ])
      fetchMock.mockRejectedValue(new Error('api down'))

      const familles = useMenuFamilles()
      await flushPromises()

      expect(familles.value).toEqual([
        { slug: 'caces', label: 'CACES', count: 0 },
        { slug: 'management', label: 'Management', count: 0 }
      ])
    })

    it('retourne une liste vide si /families et Directus échouent', async () => {
      directusRequestMock.mockRejectedValue(new Error('directus down'))
      fetchMock.mockRejectedValue(new Error('api down'))

      const familles = useMenuFamilles()
      await flushPromises()

      expect(familles.value).toEqual([])
    })

    it('fallback sur humanizeSlug si le nom Directus est absent', async () => {
      directusRequestMock.mockResolvedValue([])
      fetchMock.mockResolvedValue([{ slug: 'unknown-family', count: 1 }])

      const familles = useMenuFamilles()
      await flushPromises()

      expect(familles.value).toEqual([
        { slug: 'unknown-family', label: 'Unknown Family', count: 1 }
      ])
    })
  })

  describe('useMenuFormationsParFamille', () => {
    it('charge les formations de chaque famille affichée via /courses?family=', async () => {
      directusRequestMock.mockResolvedValue([
        { slug: 'caces', name: 'CACES' },
        { slug: 'sante', name: 'Santé & secours' }
      ])
      fetchMock.mockImplementation((url: string) => {
        if (url.endsWith('/families')) {
          return Promise.resolve([
            { slug: 'caces', count: 12 },
            { slug: 'sante', count: 8 }
          ])
        }
        return Promise.resolve({
          items: [{ slug: 'caces-r489', title: 'CACES R489', familySlug: 'caces' }],
          total: 1,
          page: 1,
          pageSize: 6
        })
      })

      const formationsParFamille = useMenuFormationsParFamille()
      await flushPromises()

      expect(formationsParFamille.value).toEqual({
        caces: [
          {
            slug: 'caces-r489',
            label: 'CACES R489',
            to: '/formations/caces/caces-r489',
            meta: ''
          }
        ],
        sante: [
          {
            slug: 'caces-r489',
            label: 'CACES R489',
            to: '/formations/sante/caces-r489',
            meta: ''
          }
        ]
      })
      expect(fetchMock).toHaveBeenCalledWith(
        'http://api.test/courses',
        expect.objectContaining({
          query: expect.objectContaining({ family: 'caces', limit: 4, page: 1 })
        })
      )
    })

    it('dégrade en liste vide par famille si /courses échoue', async () => {
      directusRequestMock.mockResolvedValue([{ slug: 'caces', name: 'CACES' }])
      fetchMock.mockImplementation((url: string) =>
        url.endsWith('/families')
          ? Promise.resolve([{ slug: 'caces', count: 12 }])
          : Promise.reject(new Error('api down'))
      )

      const formationsParFamille = useMenuFormationsParFamille()
      await flushPromises()

      expect(formationsParFamille.value).toEqual({ caces: [] })
    })
  })

  describe('useMenuCentres', () => {
    const centres = Array.from({ length: 12 }, (_, i) => ({
      slug: `centre-${i}`,
      name: `Centre ${i}`,
      city: `Ville ${i}`,
      department: `Département ${i}`,
      region: i < 6 ? 'Île-de-France' : 'Auvergne-Rhône-Alpes'
    }))

    it('groupe les centres par région et limite à 4 par région et 4 régions', async () => {
      directusRequestMock.mockResolvedValue(centres)

      const { regions, centresParRegion } = useMenuCentres()
      await flushPromises()

      expect(regions.value).toHaveLength(2)
      expect(regions.value[0]).toEqual({
        slug: 'auvergne-rhone-alpes',
        label: 'Auvergne-Rhône-Alpes',
        count: 6
      })
      expect(regions.value[1]).toEqual({
        slug: 'ile-de-france',
        label: 'Île-de-France',
        count: 6
      })
      expect(centresParRegion.value.get('Île-de-France')).toHaveLength(4)
    })

    it('regroupe les centres sans région sous « Autres régions »', async () => {
      directusRequestMock.mockResolvedValue([{ ...centres[0], slug: 'orphelin', region: null }])

      const { regions, centresParRegion } = useMenuCentres()
      await flushPromises()

      expect(regions.value[0]).toEqual({
        slug: 'autres-regions',
        label: 'Autres régions',
        count: 1
      })
      expect(centresParRegion.value.get('Autres régions')![0]!.slug).toBe('orphelin')
    })
  })

  describe('useMenuFormationsALaUne', () => {
    it('mappe les formations vers des liens famille/slug et appelle /courses avec limit=6', async () => {
      fetchMock.mockResolvedValue({
        items: [
          { slug: 'sst-initial', title: 'SST', familySlug: 'sante' },
          { slug: 'orpheline', title: 'Sans famille', familySlug: null }
        ],
        total: 2,
        page: 1,
        pageSize: 6
      })

      const formations = useMenuFormationsALaUne()
      await flushPromises()

      expect(formations.value).toEqual([
        { slug: 'sst-initial', label: 'SST', to: '/formations/sante/sst-initial' },
        { slug: 'orpheline', label: 'Sans famille', to: '/formations' }
      ])
      expect(fetchMock).toHaveBeenCalledWith(
        'http://api.test/courses',
        expect.objectContaining({ query: expect.objectContaining({ limit: 6 }) })
      )
    })

    it('dégrade en liste vide si /courses échoue', async () => {
      fetchMock.mockRejectedValue(new Error('api down'))

      const formations = useMenuFormationsALaUne()
      await flushPromises()

      expect(formations.value).toEqual([])
    })
  })
})
