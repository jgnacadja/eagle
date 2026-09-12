import { Test, TestingModule } from '@nestjs/testing'
import type { Course, CourseListItem, FamilyWithCount, Paginated } from '@learnup/types'
import { CatalogService } from './catalog.service'
import { CacheService } from '../common/cache/cache.service'
import {
  DirectusCatalogService,
  type DirectusFormation
} from '../directus/directus.catalog.service'
import { CourseSortField, CourseSortOrder, type ListCoursesDto } from './catalog.dto'

const baseFormation: DirectusFormation = {
  id: 1,
  status: 'published',
  digiforma_id: 'prog-001',
  slug: 'pilotage-de-projet',
  title: 'Pilotage de projet',
  description: 'Apprendre à piloter.',
  duration_days: 3,
  duration_hours: 21,
  price: 1500,
  cpf: true,
  cpf_code: 'CPF-12345',
  certification: 'Certificat',
  certifier_name: 'LEARN UP',
  category_name: 'Management',
  center_slug: null,
  center_slugs: [],
  modalities: [],
  sessions: null,
  locations_text: null,
  blocks: [{ name: 'Objectifs' }],
  pedagogy: [{ title: 'Inter, en centre.', description: 'Sessions planifiées' }],
  evaluation: ['Épreuve pratique'],
  validity: '5 ans',
  image: null,
  generated_program_url: null,
  seo_title: 'Pilotage de projet',
  seo_description: 'Apprendre à piloter.',
  seo_canonical: null,
  raw: { targets: [{ text: 'Managers' }], prerequisites: [{ text: 'Aucun' }] },
  famille: { id: 1, slug: 'management' },
  sous_famille: { id: 10, slug: 'pilotage-projet', name: 'Pilotage de projet' },
  created_at: '2026-01-15T10:00:00.000Z',
  updated_at: '2026-01-20T10:00:00.000Z'
}

const secondFormation: DirectusFormation = {
  ...baseFormation,
  id: 2,
  digiforma_id: 'prog-002',
  slug: 'securite',
  title: 'Sécurité',
  description: 'Bien se protéger.',
  duration_days: 1,
  duration_hours: 7,
  price: 800,
  cpf: false,
  certification: null,
  certifier_name: null,
  category_name: 'Sécurité',
  cpf_code: null,
  famille: { id: 2, slug: 'securite' },
  sous_famille: null,
  updated_at: '2026-01-22T10:00:00.000Z',
  raw: {}
} as unknown as DirectusFormation

const formations = [baseFormation, secondFormation]

function mockCache() {
  const get = vi.fn()
  const set = vi.fn()
  const invalidateCatalog = vi.fn()

  return {
    cache: { get, set, invalidateCatalog } as unknown as CacheService,
    get,
    set,
    invalidateCatalog
  }
}

function mockCatalog() {
  const fetchAllFormations = vi.fn().mockResolvedValue(formations)
  const fetchAllCentres = vi.fn().mockResolvedValue([])
  const getFamilyIdsBySlug = vi.fn().mockResolvedValue(new Map([['management', 1]]))
  const getSubFamilyIdsByFamilySlug = vi
    .fn()
    .mockResolvedValue(new Map([['management', new Map([['pilotage-projet', 10]])]]))
  const applyFamilyAssignments = vi
    .fn()
    .mockResolvedValue({ assigned: 1, cleared: 0, subAssigned: 0 })

  return {
    catalog: {
      fetchAllFormations,
      fetchAllCentres,
      getFamilyIdsBySlug,
      getSubFamilyIdsByFamilySlug,
      applyFamilyAssignments
    } as unknown as DirectusCatalogService,
    fetchAllFormations,
    fetchAllCentres,
    getFamilyIdsBySlug,
    getSubFamilyIdsByFamilySlug,
    applyFamilyAssignments
  }
}

describe('CatalogService', () => {
  let service: CatalogService
  let cache: { get: ReturnType<typeof vi.fn>; set: ReturnType<typeof vi.fn> }
  let catalog: {
    fetchAllFormations: ReturnType<typeof vi.fn>
    fetchAllCentres: ReturnType<typeof vi.fn>
  }

  beforeEach(async () => {
    const { cache: cacheMock, get, set } = mockCache()
    const { catalog: catalogMock, fetchAllFormations, fetchAllCentres } = mockCatalog()

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CatalogService,
        { provide: CacheService, useValue: cacheMock },
        { provide: DirectusCatalogService, useValue: catalogMock }
      ]
    }).compile()

    service = module.get<CatalogService>(CatalogService)
    cache = { get, set }
    catalog = { fetchAllFormations, fetchAllCentres }
  })

  it('returns cached list when available', async () => {
    const cached: Paginated<CourseListItem> = {
      items: [{ id: 1, slug: 'pilotage-de-projet', title: 'Pilotage de projet' } as CourseListItem],
      total: 1,
      page: 1,
      pageSize: 20
    }
    cache.get.mockResolvedValue(cached)

    const result = await service.list({} as ListCoursesDto)

    expect(result).toEqual(cached)
    expect(catalog.fetchAllFormations).not.toHaveBeenCalled()
  })

  it('queries Directus and sets the cache on list miss', async () => {
    cache.get.mockResolvedValue(null)

    const result = await service.list({ page: 1, limit: 20 } as ListCoursesDto)

    expect(result.items).toHaveLength(2)
    expect(result.total).toBe(2)
    expect(result.page).toBe(1)
    expect(result.pageSize).toBe(20)
    expect(cache.set).toHaveBeenCalledWith(expect.stringMatching(/^courses:list:/), result)
    expect(catalog.fetchAllFormations).toHaveBeenCalled()
  })

  it('filters by family, CPF and search', async () => {
    cache.get.mockResolvedValue(null)

    const result = await service.list({
      family: 'management',
      search: 'piloter',
      page: 1,
      limit: 10
    } as ListCoursesDto)

    expect(result.items).toHaveLength(1)
    expect(result.items[0].slug).toBe('pilotage-de-projet')
  })

  it('filters by sub-family', async () => {
    cache.get.mockResolvedValue(null)

    const result = await service.list({
      family: 'management',
      subFamily: 'pilotage-projet',
      page: 1,
      limit: 10
    } as ListCoursesDto)

    expect(result.items).toHaveLength(1)
    expect(result.items[0].subFamilySlug).toBe('pilotage-projet')
    expect(result.items[0].subFamilyName).toBe('Pilotage de projet')
  })

  it('returns no item for an unknown sub-family', async () => {
    cache.get.mockResolvedValue(null)

    const result = await service.list({
      subFamily: 'inexistant',
      page: 1,
      limit: 10
    } as ListCoursesDto)

    expect(result.items).toHaveLength(0)
    expect(result.total).toBe(0)
  })

  it('filters by price and duration', async () => {
    cache.get.mockResolvedValue(null)

    const result = await service.list({
      priceMin: 1000,
      priceMax: 2000,
      durationMin: 20,
      durationMax: 30,
      page: 1,
      limit: 20
    } as ListCoursesDto)

    expect(result.items).toHaveLength(1)
    expect(result.items[0].slug).toBe('pilotage-de-projet')
  })

  it.each([
    { sort: CourseSortField.updatedAt, order: CourseSortOrder.asc },
    { sort: CourseSortField.name, order: undefined },
    { sort: CourseSortField.price, order: CourseSortOrder.desc },
    { sort: undefined, order: undefined }
  ])('sorts by $sort $order', async ({ sort, order }) => {
    cache.get.mockResolvedValue(null)

    const result = await service.list({ sort, order, page: 1, limit: 20 } as ListCoursesDto)

    expect(result.items.length).toBeGreaterThan(0)
  })

  it('paginates correctly', async () => {
    cache.get.mockResolvedValue(null)

    const result = await service.list({ page: 2, limit: 1 } as ListCoursesDto)

    expect(result.items).toHaveLength(1)
    expect(result.page).toBe(2)
  })

  it('returns cached detail when available', async () => {
    const cached: Course = {
      id: 1,
      slug: 'pilotage-de-projet',
      title: 'Pilotage de projet',
      description: 'Apprendre à piloter.',
      durationDays: 3,
      durationHours: 21,
      price: 1500,
      cpf: true,
      cpfCode: 'CPF-12345',
      certification: 'Certificat',
      certifierName: 'LEARN UP',
      category: 'Management',
      familySlug: 'management',
      subFamilySlug: 'pilotage-projet',
      subFamilyName: 'Pilotage de projet',
      centerSlug: null,
      centerSlugs: [],
      modalities: [],
      sessions: null,
      image: null,
      imageUrl: null,
      generatedProgramUrl: null,
      status: 'published',
      seoTitle: 'Pilotage de projet',
      seoDescription: 'Apprendre à piloter.',
      seoCanonical: null,
      blocks: null,
      targets: ['Managers'],
      prerequisites: ['Aucun'],
      pedagogy: null,
      evaluation: null,
      validity: null,
      createdAt: '2026-01-15T10:00:00.000Z',
      updatedAt: '2026-01-20T10:00:00.000Z'
    }
    cache.get.mockResolvedValue(cached)

    const result = await service.findBySlug('pilotage-de-projet', 'management')

    expect(result).toEqual(cached)
    expect(catalog.fetchAllFormations).not.toHaveBeenCalled()
  })

  it('finds a course by slug and family', async () => {
    cache.get.mockResolvedValue(null)

    const result = await service.findBySlug('pilotage-de-projet', 'management')

    expect(result).not.toBeNull()
    expect(result?.slug).toBe('pilotage-de-projet')
    expect(result?.familySlug).toBe('management')
    expect(result?.createdAt).toBe('2026-01-15T10:00:00.000Z')
  })

  it('exposes editable pedagogy, evaluation and validity fields', async () => {
    cache.get.mockResolvedValue(null)

    const result = await service.findBySlug('pilotage-de-projet', 'management')

    expect(result?.pedagogy).toEqual([
      { title: 'Inter, en centre.', description: 'Sessions planifiées' }
    ])
    expect(result?.evaluation).toEqual(['Épreuve pratique'])
    expect(result?.validity).toBe('5 ans')
  })

  it('returns null when a course is not found', async () => {
    cache.get.mockResolvedValue(null)

    const result = await service.findBySlug('inexistant')

    expect(result).toBeNull()
    expect(cache.set).toHaveBeenCalledWith('formations:all', expect.any(Array))
  })

  it('returns cached families', async () => {
    const cached: FamilyWithCount[] = [{ slug: 'management', count: 5 }]
    cache.get.mockResolvedValue(cached)

    const result = await service.families()

    expect(result).toEqual(cached)
    expect(catalog.fetchAllFormations).not.toHaveBeenCalled()
  })

  it('counts families from Directus formations', async () => {
    cache.get.mockResolvedValue(null)

    const result = await service.families()

    expect(result).toEqual([
      { slug: 'management', count: 1 },
      { slug: 'securite', count: 1 }
    ])
    expect(cache.set).toHaveBeenCalledWith('courses:families', result)
  })

  it('returns an empty family list when nothing is published', async () => {
    cache.get.mockResolvedValue(null)
    catalog.fetchAllFormations.mockResolvedValue([])

    const result = await service.families()

    expect(result).toEqual([])
  })

  describe('location filter', () => {
    const geoFormation = {
      ...baseFormation,
      id: 4,
      digiforma_id: 'prog-geo',
      slug: 'geo',
      sessions: [
        {
          id: 's1',
          startDate: null,
          endDate: null,
          modality: 'presentiel',
          seatsRemaining: null,
          location: {
            name: 'Centre LEARN UP de Lyon',
            city: 'Lyon',
            postalCode: '69003',
            department: 'Rhône',
            region: 'Auvergne-Rhône-Alpes',
            centreSlug: null
          }
        },
        {
          id: 's2',
          startDate: null,
          endDate: null,
          modality: 'presentiel',
          seatsRemaining: null,
          location: {
            name: 'Centre LEARN UP de Marseille',
            city: 'Marseille',
            postalCode: '13002',
            department: 'Bouches-du-Rhône',
            region: 'Provence-Alpes-Côte d’Azur',
            centreSlug: null
          }
        }
      ]
    } as unknown as DirectusFormation

    async function listWithLocation(location: string) {
      cache.get.mockResolvedValue(null)
      catalog.fetchAllFormations.mockResolvedValue([geoFormation])
      const result = await service.list({ location, page: 1, limit: 10 } as ListCoursesDto)
      return result.items.length
    }

    it.each([
      { query: '69003', expected: 1 },
      { query: '69', expected: 1 },
      { query: 'lyon', expected: 1 },
      { query: 'lyon 69003', expected: 1 },
      { query: 'rhone', expected: 1 },
      { query: 'auvergne', expected: 1 }
    ])('matches « $query » → $expected résultat(s)', async ({ query, expected }) => {
      expect(await listWithLocation(query)).toBe(expected)
    })

    it('ne matche pas « lyon 13002 » (tokens répartis sur deux sessions)', async () => {
      expect(await listWithLocation('lyon 13002')).toBe(0)
    })

    it('ne matche pas « aris » (pas de sous-chaîne — frontière de mot)', async () => {
      expect(await listWithLocation('aris')).toBe(0)
    })

    it('résout la localisation via le centre rattaché (centreSlug)', async () => {
      cache.get.mockResolvedValue(null)
      const centred = {
        ...geoFormation,
        sessions: [
          {
            id: 's1',
            startDate: null,
            endDate: null,
            modality: 'presentiel',
            seatsRemaining: null,
            location: {
              name: null,
              city: null,
              postalCode: null,
              department: null,
              region: null,
              centreSlug: 'lyon'
            }
          }
        ]
      } as unknown as DirectusFormation
      catalog.fetchAllFormations.mockResolvedValue([centred])
      catalog.fetchAllCentres.mockResolvedValue([
        {
          id: 1,
          slug: 'lyon',
          name: 'Centre LEARN UP de Lyon',
          status: 'published',
          address: '12 rue de la Part-Dieu, 69003 Lyon',
          city: 'Lyon',
          postal_code: '69003',
          department: 'Rhône',
          region: 'Auvergne-Rhône-Alpes',
          latitude: 45.76,
          longitude: 4.85
        }
      ])

      for (const query of ['lyon', '69003', '69', 'part-dieu', 'rhone']) {
        const result = await service.list({ location: query, page: 1, limit: 10 } as ListCoursesDto)
        expect(result.items, `query ${query}`).toHaveLength(1)
      }
    })

    it('matche par rayon (lat,lng) sur les coordonnées du centre', async () => {
      cache.get.mockResolvedValue(null)
      const centred = {
        ...geoFormation,
        sessions: [
          {
            id: 's1',
            startDate: null,
            endDate: null,
            modality: 'presentiel',
            seatsRemaining: null,
            location: {
              name: null,
              city: null,
              postalCode: null,
              department: null,
              region: null,
              centreSlug: 'lyon'
            }
          }
        ]
      } as unknown as DirectusFormation
      catalog.fetchAllFormations.mockResolvedValue([centred])
      catalog.fetchAllCentres.mockResolvedValue([
        {
          id: 1,
          slug: 'lyon',
          name: 'Centre LEARN UP de Lyon',
          status: 'published',
          address: '12 rue de la Part-Dieu, 69003 Lyon',
          city: 'Lyon',
          postal_code: '69003',
          department: 'Rhône',
          region: 'Auvergne-Rhône-Alpes',
          latitude: 45.76,
          longitude: 4.85
        }
      ])

      // Villeurbanne ≈ 5 km du centre → match ; Brest ≈ 700 km → pas de match.
      const near = await service.list({
        location: '45.77,4.88',
        page: 1,
        limit: 10
      } as ListCoursesDto)
      expect(near.items).toHaveLength(1)
      const far = await service.list({
        location: '48.39,-4.49',
        page: 1,
        limit: 10
      } as ListCoursesDto)
      expect(far.items).toHaveLength(0)
    })

    it('retombe sur locations_text quand aucune session n’est géolocalisée', async () => {
      cache.get.mockResolvedValue(null)
      catalog.fetchAllFormations.mockResolvedValue([
        { ...geoFormation, sessions: null, locations_text: 'Toute la France' }
      ])
      const result = await service.list({
        location: 'france',
        page: 1,
        limit: 10
      } as ListCoursesDto)
      expect(result.items).toHaveLength(1)
    })
  })

  it('proposes famille and sous-famille on applyFamilies, without overwriting', async () => {
    const {
      catalog: catalogMock,
      applyFamilyAssignments,
      fetchAllFormations,
      getSubFamilyIdsByFamilySlug
    } = mockCatalog()
    getSubFamilyIdsByFamilySlug.mockResolvedValue(
      new Map([['management', new Map([['management', 42]])]])
    )
    const unset: DirectusFormation = {
      ...baseFormation,
      id: 3,
      digiforma_id: 'prog-003',
      slug: 'coaching',
      famille: null,
      sous_famille: null
    }
    fetchAllFormations.mockResolvedValue([unset])

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CatalogService,
        { provide: CacheService, useValue: mockCache().cache },
        { provide: DirectusCatalogService, useValue: catalogMock }
      ]
    }).compile()
    const local = module.get<CatalogService>(CatalogService)

    await local.applyFamilies()

    expect(applyFamilyAssignments).toHaveBeenCalledWith(
      new Map([['prog-003', { famille: 'management', sousFamille: 'management' }]])
    )
  })

  it('never proposes a sous-famille already set', async () => {
    const {
      catalog: catalogMock,
      applyFamilyAssignments,
      fetchAllFormations,
      getSubFamilyIdsByFamilySlug
    } = mockCatalog()
    getSubFamilyIdsByFamilySlug.mockResolvedValue(
      new Map([['management', new Map([['management', 42]])]])
    )
    fetchAllFormations.mockResolvedValue([baseFormation])

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CatalogService,
        { provide: CacheService, useValue: mockCache().cache },
        { provide: DirectusCatalogService, useValue: catalogMock }
      ]
    }).compile()
    const local = module.get<CatalogService>(CatalogService)

    await local.applyFamilies()

    expect(applyFamilyAssignments).toHaveBeenCalledWith(
      new Map([['prog-001', { famille: 'management' }]])
    )
  })
})
