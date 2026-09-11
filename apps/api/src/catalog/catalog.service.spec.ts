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
  image_url: null,
  generated_program_url: null,
  seo_title: 'Pilotage de projet',
  seo_description: 'Apprendre à piloter.',
  seo_canonical: null,
  raw: { targets: [{ text: 'Managers' }], prerequisites: [{ text: 'Aucun' }] },
  famille: { id: 1, slug: 'management' },
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
  updated_at: '2026-01-22T10:00:00.000Z',
  raw: {}
} as unknown as DirectusFormation

const formations = [baseFormation, secondFormation]

function mockCache() {
  const get = vi.fn()
  const set = vi.fn()

  return {
    cache: { get, set } as unknown as CacheService,
    get,
    set
  }
}

function mockCatalog() {
  const fetchAllFormations = vi.fn().mockResolvedValue(formations)
  const getFamilyIdsBySlug = vi.fn().mockResolvedValue(new Map([['management', 1]]))
  const applyFamilyAssignments = vi.fn().mockResolvedValue({ assigned: 1, cleared: 0 })

  return {
    catalog: {
      fetchAllFormations,
      getFamilyIdsBySlug,
      applyFamilyAssignments
    } as unknown as DirectusCatalogService,
    fetchAllFormations,
    getFamilyIdsBySlug,
    applyFamilyAssignments
  }
}

describe('CatalogService', () => {
  let service: CatalogService
  let cache: { get: ReturnType<typeof vi.fn>; set: ReturnType<typeof vi.fn> }
  let catalog: { fetchAllFormations: ReturnType<typeof vi.fn> }

  beforeEach(async () => {
    const { cache: cacheMock, get, set } = mockCache()
    const { catalog: catalogMock, fetchAllFormations } = mockCatalog()

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CatalogService,
        { provide: CacheService, useValue: cacheMock },
        { provide: DirectusCatalogService, useValue: catalogMock }
      ]
    }).compile()

    service = module.get<CatalogService>(CatalogService)
    cache = { get, set }
    catalog = { fetchAllFormations }
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
      centerSlug: null,
      centerSlugs: [],
      modalities: [],
      sessions: null,
      imageUrl: null,
      generatedProgramUrl: null,
      status: 'published',
      seoTitle: 'Pilotage de projet',
      seoDescription: 'Apprendre à piloter.',
      seoCanonical: null,
      blocks: null,
      targets: ['Managers'],
      prerequisites: ['Aucun'],
      evaluation: null,
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
})
