import { beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, ref } from 'vue'
import { useMenuCentres, useMenuFamilles, useMenuFormationsALaUne } from '~/composables/useMenuData'

const directusRequestMock = vi.fn()
const fetchMock = vi.fn()
const directusListMock = vi.fn()

vi.stubGlobal('useDirectusClient', () => ({ request: directusRequestMock }))
vi.stubGlobal('useRuntimeConfig', () => ({ public: { apiBase: 'http://api.test' } }))
vi.stubGlobal('$fetch', fetchMock)
vi.stubGlobal('useDirectusList', (...args: unknown[]) => directusListMock(...args))
vi.stubGlobal('logServerError', vi.fn())
vi.stubGlobal('computed', computed)
vi.stubGlobal('useAsyncData', async (_key: string, handler: () => Promise<unknown>) => ({
  data: ref(await handler())
}))

describe('useMenuData', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('useMenuFamilles', () => {
    it('fusionne les familles Directus avec les compteurs du catalogue', async () => {
      directusRequestMock.mockResolvedValue([
        { slug: 'management', name: 'Management' },
        { slug: 'sante', name: 'Santé & secours' }
      ])
      fetchMock.mockResolvedValue([
        { slug: 'sante', count: 8 },
        { slug: 'management', count: 3 }
      ])

      const familles = await useMenuFamilles()

      expect(familles.value).toEqual([
        { slug: 'sante', label: 'Santé & secours', count: 8 },
        { slug: 'management', label: 'Management', count: 3 }
      ])
    })

    it('inclut les familles présentes seulement côté catalogue', async () => {
      directusRequestMock.mockResolvedValue([])
      fetchMock.mockResolvedValue([{ slug: 'rse', count: 4 }])

      const familles = await useMenuFamilles()

      expect(familles.value).toEqual([{ slug: 'rse', label: 'rse', count: 4 }])
    })

    it('dégrade en liste vide si les deux sources échouent', async () => {
      directusRequestMock.mockRejectedValue(new Error('directus down'))
      fetchMock.mockRejectedValue(new Error('api down'))

      const familles = await useMenuFamilles()

      expect(familles.value).toEqual([])
    })
  })

  describe('useMenuCentres', () => {
    const centres = [
      {
        slug: 'creteil',
        name: 'Centre de Créteil',
        city: 'Créteil',
        department: 'Val-de-Marne',
        region: 'Île-de-France'
      },
      {
        slug: 'paris',
        name: 'Centre de Paris',
        city: 'Paris',
        department: 'Paris',
        region: 'Île-de-France'
      },
      {
        slug: 'lyon',
        name: 'Centre de Lyon',
        city: 'Lyon',
        department: 'Rhône',
        region: 'Auvergne-Rhône-Alpes'
      }
    ]

    it('groupe les centres par région avec compteurs', async () => {
      directusListMock.mockResolvedValue(ref(centres))

      const { regions, centresParRegion } = await useMenuCentres()

      expect(regions.value).toEqual([
        { slug: 'ile-de-france', label: 'Île-de-France', count: 2 },
        { slug: 'auvergne-rhone-alpes', label: 'Auvergne-Rhône-Alpes', count: 1 }
      ])
      expect(centresParRegion.value.get('Île-de-France')).toHaveLength(2)
      expect(centresParRegion.value.get('Auvergne-Rhône-Alpes')![0]!.slug).toBe('lyon')
    })

    it('regroupe les centres sans région sous « Autres régions »', async () => {
      directusListMock.mockResolvedValue(ref([{ ...centres[0], slug: 'orphelin', region: null }]))

      const { regions, centresParRegion } = await useMenuCentres()

      expect(regions.value[0]).toEqual({
        slug: 'autres-regions',
        label: 'Autres régions',
        count: 1
      })
      expect(centresParRegion.value.get('Autres régions')![0]!.slug).toBe('orphelin')
    })
  })

  describe('useMenuFormationsALaUne', () => {
    it('mappe les formations vers des liens famille/slug', async () => {
      fetchMock.mockResolvedValue({
        items: [
          { slug: 'sst-initial', title: 'SST', familySlug: 'sante' },
          { slug: 'orpheline', title: 'Sans famille', familySlug: null }
        ],
        total: 2,
        page: 1,
        pageSize: 3
      })

      const formations = await useMenuFormationsALaUne()

      expect(formations.value).toEqual([
        { slug: 'sst-initial', label: 'SST', to: '/formations/sante/sst-initial' },
        { slug: 'orpheline', label: 'Sans famille', to: '/formations' }
      ])
      expect(fetchMock).toHaveBeenCalledWith(
        'http://api.test/courses',
        expect.objectContaining({ query: expect.objectContaining({ limit: 3 }) })
      )
    })

    it('dégrade en liste vide si l’API échoue', async () => {
      fetchMock.mockRejectedValue(new Error('api down'))

      const formations = await useMenuFormationsALaUne()

      expect(formations.value).toEqual([])
    })
  })
})
