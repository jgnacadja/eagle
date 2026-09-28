import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { computed, ref } from 'vue'
import {
  useMenuCentres,
  useMenuFamilles,
  useMenuFormationsALaUne,
  useMenuFormationsParFamille,
  useMenuActualites,
  useMenuLegalPages,
  useMenuPreload,
  useMenuSousFamillesParFamille
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

vi.stubGlobal(
  'useAsyncData',
  (
    key: string,
    handler: () => Promise<unknown>,
    options?: {
      getCachedData?: (key: string, nuxtApp: unknown, ctx: { cause?: string }) => unknown
    }
  ) => {
    const nuxtApp = { isHydrating: true, payload: { data: {} }, static: { data: {} } }
    options?.getCachedData?.(key, nuxtApp, { cause: 'initial' })
    options?.getCachedData?.(key, nuxtApp, { cause: 'navigation' })
    options?.getCachedData?.(key, { ...nuxtApp, isHydrating: false }, { cause: 'initial' })
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
  }
)

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

    it('passe les en-têtes internes à /families quand disponibles', async () => {
      vi.stubGlobal('internalSsrHeaders', () => ({ 'x-internal-ssr': 'token' }))
      directusRequestMock.mockResolvedValue([])
      fetchMock.mockResolvedValue([])

      useMenuFamilles()
      await flushPromises()

      expect(fetchMock).toHaveBeenCalledWith('http://api.test/families', {
        headers: { 'x-internal-ssr': 'token' }
      })
      vi.stubGlobal('internalSsrHeaders', () => undefined)
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

    it('trie par libellé les familles à nombre de formations égal', async () => {
      directusRequestMock.mockResolvedValue([
        { slug: 'a-famille', name: 'Alpha' },
        { slug: 'b-famille', name: 'Beta' }
      ])
      fetchMock.mockResolvedValue([
        { slug: 'b-famille', count: 5 },
        { slug: 'a-famille', count: 5 }
      ])

      const familles = useMenuFamilles()
      await flushPromises()

      expect(familles.value.map((f) => f.slug)).toEqual(['a-famille', 'b-famille'])
    })

    it('expose les listes vides tant que les données ne sont pas résolues', () => {
      directusRequestMock.mockReturnValue(new Promise(() => {}))
      fetchMock.mockReturnValue(new Promise(() => {}))

      expect(useMenuFamilles().value).toEqual([])
      expect(useMenuFormationsParFamille().value).toEqual({})
      expect(useMenuSousFamillesParFamille().value).toEqual({})
      expect(useMenuLegalPages().value).toEqual([])

      const { regions, centresParRegion } = useMenuCentres()
      expect(regions.value).toEqual([])
      expect(centresParRegion.value.size).toBe(0)

      const menu = useMenuActualites()
      expect(menu.rubriques.value).toEqual([])
      expect(menu.regions.value).toEqual([])
      expect(menu.actualitesParRegion.value).toEqual({})
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
      directusRequestMock.mockResolvedValue([
        { ...centres[0], slug: 'orphelin', region: null },
        { ...centres[0], slug: 'espaces', region: '   ' }
      ])

      const { regions, centresParRegion } = useMenuCentres()
      await flushPromises()

      expect(regions.value[0]).toEqual({
        slug: 'autres-regions',
        label: 'Autres régions',
        count: 2
      })
      expect(centresParRegion.value.get('Autres régions')![0]!.slug).toBe('orphelin')
    })
  })

  describe('useMenuFormationsALaUne', () => {
    it('mappe les formations vers des liens famille/slug et appelle /courses avec limit=4', async () => {
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
        expect.objectContaining({ query: expect.objectContaining({ limit: 4 }) })
      )
    })

    it('dégrade en liste vide si /courses échoue', async () => {
      fetchMock.mockRejectedValue(new Error('api down'))

      const formations = useMenuFormationsALaUne()
      await flushPromises()

      expect(formations.value).toEqual([])
    })
  })

  describe('useMenuActualites', () => {
    it('mappe les articles publiés par rubrique et par région', async () => {
      directusRequestMock.mockResolvedValue([
        {
          slug: 'article-caces',
          title: 'Anticiper les échéances CACES',
          category: 'Réglementation',
          region: 'ile-de-france',
          publish_at: '2026-09-03T08:00:00.000Z'
        },
        {
          slug: 'article-reseau',
          title: 'Un nouveau centre ouvre',
          category: 'Vie du réseau',
          region: 'Occitanie',
          publish_at: '2026-08-19T08:00:00.000Z'
        }
      ])

      const menu = useMenuActualites()
      await flushPromises()

      expect(menu.rubriques.value).toEqual([
        { slug: 'toute-actualite', label: 'Toute l’actualité du réseau' },
        { slug: 'reglementation', label: 'Réglementation' },
        { slug: 'vie-du-reseau', label: 'Vie du réseau' }
      ])
      expect(menu.regions.value).toEqual([
        { slug: 'ile-de-france', label: 'Île-de-France', count: 1 },
        { slug: 'occitanie', label: 'Occitanie', count: 1 }
      ])
      expect(menu.actualitesParRegion.value['ile-de-france']?.[0]).toMatchObject({
        slug: 'article-caces',
        tag: 'Réglementation',
        title: 'Anticiper les échéances CACES'
      })
      expect(directusRequestMock).toHaveBeenCalled()
    })

    it('ignore les articles sans région et retombe sur la rubrique générique', async () => {
      directusRequestMock.mockResolvedValue([
        {
          slug: 'sans-region',
          title: 'Article national',
          category: null,
          region: null,
          publish_at: '2026-09-03T08:00:00.000Z'
        },
        {
          slug: 'region-sans-rubrique',
          title: 'Article régional',
          category: null,
          region: 'Occitanie',
          publish_at: '2026-09-04T08:00:00.000Z'
        }
      ])

      const menu = useMenuActualites()
      await flushPromises()

      expect(menu.regions.value).toEqual([{ slug: 'occitanie', label: 'Occitanie', count: 1 }])
      expect(menu.actualitesParRegion.value['occitanie']?.[0]).toMatchObject({
        slug: 'region-sans-rubrique',
        tag: 'Actualité',
        categorySlug: ''
      })
    })

    it('dégrade en vides si le fetch des articles échoue', async () => {
      directusRequestMock.mockRejectedValue(new Error('directus down'))

      const menu = useMenuActualites()
      await flushPromises()

      expect(menu.rubriques.value).toEqual([])
      expect(menu.regions.value).toEqual([])
      expect(menu.actualitesParRegion.value).toEqual({})
    })
  })

  describe('useMenuSousFamillesParFamille', () => {
    it('peuple les sous-familles avec les noms Directus et humanise les slugs orphelins', async () => {
      directusRequestMock
        .mockResolvedValueOnce([{ slug: 'caces', name: 'CACES' }])
        .mockResolvedValueOnce([
          {
            slug: 'chariots',
            name: 'Chariots & gerbeurs',
            famille: { slug: 'caces' }
          },
          { slug: 'orphelin', name: null, famille: { slug: 'caces' } },
          { slug: 'autre', name: 'Autre', famille: 'texte-brut' }
        ])
      fetchMock.mockImplementation((url: string, options?: unknown) => {
        if (url.endsWith('/families')) {
          return Promise.resolve([
            { slug: 'caces', count: 12 },
            { slug: 'sans-sous-familles', count: 2 }
          ])
        }
        const facets =
          (options as { query?: { family?: string } } | undefined)?.query?.family === 'caces'
            ? { subFamilies: { chariots: 3, 'slug-sans-nom': 2 } }
            : undefined
        return Promise.resolve({
          items: [],
          total: 0,
          page: 1,
          pageSize: 6,
          facets
        })
      })

      const parFamille = useMenuSousFamillesParFamille()
      await flushPromises()

      expect(parFamille.value['caces']).toEqual([
        { slug: 'chariots', label: 'Chariots & gerbeurs', count: 3 },
        { slug: 'slug-sans-nom', label: 'Slug Sans Nom', count: 2 }
      ])
      // Famille sans sous-familles nommées côté Directus → liste vide.
      expect(parFamille.value['sans-sous-familles']).toEqual([])
    })

    it('groupe plusieurs sous-familles sous une même famille et saute les entrées incomplètes', async () => {
      directusRequestMock
        .mockResolvedValueOnce([{ slug: 'caces', name: 'CACES' }])
        .mockResolvedValueOnce([
          { slug: 'chariots', name: 'Chariots', famille: { slug: 'caces' } },
          { slug: 'nacelles', name: 'Nacelles', famille: { slug: 'caces' } },
          { slug: 'sans-compte', name: 'Sans compte', famille: { slug: 'caces' } },
          { slug: 'orphelin', name: 'Orphelin', famille: null },
          { slug: null, name: 'Sans slug', famille: { slug: 'caces' } },
          { slug: 'sans-nom', name: null, famille: { slug: 'caces' } }
        ])
      fetchMock.mockImplementation((url: string, options?: unknown) => {
        if (url.endsWith('/families')) {
          return Promise.resolve([
            { slug: 'caces', count: 10 },
            { slug: 'vides', count: 3 }
          ])
        }
        const facets =
          (options as { query?: { family?: string } } | undefined)?.query?.family === 'caces'
            ? { subFamilies: { chariots: 2, nacelles: 1 } }
            : { subFamilies: { mystere: 4, zero: 0, abricot: 4 } }
        return Promise.resolve({
          items: [],
          total: 0,
          page: 1,
          pageSize: 6,
          facets
        })
      })

      const parFamille = useMenuSousFamillesParFamille()
      await flushPromises()

      expect(parFamille.value['caces']).toEqual([
        { slug: 'chariots', label: 'Chariots', count: 2 },
        { slug: 'nacelles', label: 'Nacelles', count: 1 }
      ])
      // « vides » n'a aucune sous-famille nommée : les slugs comptés sont humanisés
      // et triés par label à count égal (« zero » à 0 est masqué).
      expect(parFamille.value['vides']).toEqual([
        { slug: 'abricot', label: 'Abricot', count: 4 },
        { slug: 'mystere', label: 'Mystere', count: 4 }
      ])
    })
  })

  describe('useMenuLegalPages', () => {
    it('mappe les pages légales publiées', async () => {
      directusRequestMock.mockResolvedValue([
        { slug: 'mentions-legales', label: 'Mentions légales', show_in_tabs: true },
        { slug: 'cookies', label: 'Cookies', show_in_tabs: false }
      ])

      const pages = useMenuLegalPages()
      await flushPromises()

      expect(pages.value).toEqual([
        { slug: 'mentions-legales', label: 'Mentions légales', showInTabs: true },
        { slug: 'cookies', label: 'Cookies', showInTabs: false }
      ])
    })
  })

  describe('useMenuPreload', () => {
    it('précharge les données des méga-menus sans erreur', async () => {
      directusRequestMock.mockResolvedValue([])
      fetchMock.mockResolvedValue([])

      expect(() => useMenuPreload()).not.toThrow()
      await flushPromises()
    })
  })
})
