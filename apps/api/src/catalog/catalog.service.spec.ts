import { Test, TestingModule } from '@nestjs/testing'
import type { Course, CourseListItem, FamilyWithCount, Paginated } from '@learnup/types'
import { CatalogService } from './catalog.service'
import { CacheService } from '../common/cache/cache.service'
import { PrismaService } from '../prisma/prisma.service'
import { CourseSortField, CourseSortOrder, type ListCoursesDto } from './catalog.dto'

const rawListItem = {
  id: 1,
  slug: 'pilotage-de-projet',
  title: 'Pilotage de projet',
  description: 'Apprendre à piloter.',
  durationDays: 3,
  durationHours: 21,
  price: 1800,
  cpf: true,
  cpfCode: 'CPF-12345',
  certification: 'Certificat',
  certifierName: 'LEARN UP',
  category: 'Management',
  familySlug: 'management',
  centerSlug: null,
  imageUrl: null,
  status: 'published',
  seoTitle: 'Pilotage de projet',
  seoDescription: 'Apprendre à piloter.',
  seoCanonical: null
}

const rawCourse = {
  ...rawListItem,
  blocks: [{ title: 'Objectif' }],
  createdAt: new Date('2026-01-15T10:00:00.000Z'),
  updatedAt: new Date('2026-01-20T10:00:00.000Z')
}

const cachedCourse: Course = {
  ...rawListItem,
  blocks: [{ title: 'Objectif' }],
  createdAt: '2026-01-15T10:00:00.000Z',
  updatedAt: '2026-01-20T10:00:00.000Z'
}

function mockPrisma() {
  const findMany = vi.fn()
  const count = vi.fn()
  const findFirst = vi.fn()
  const groupBy = vi.fn()
  const $queryRawUnsafe = vi.fn()

  return {
    prisma: {
      course: { findMany, count, findFirst, groupBy },
      $queryRawUnsafe
    } as unknown as PrismaService,
    findMany,
    count,
    findFirst,
    groupBy,
    $queryRawUnsafe
  }
}

function mockCache() {
  const get = vi.fn()
  const set = vi.fn()

  return {
    cache: { get, set } as unknown as CacheService,
    get,
    set
  }
}

describe('CatalogService', () => {
  let service: CatalogService
  let cache: { get: ReturnType<typeof vi.fn>; set: ReturnType<typeof vi.fn> }
  let prisma: {
    findMany: ReturnType<typeof vi.fn>
    count: ReturnType<typeof vi.fn>
    findFirst: ReturnType<typeof vi.fn>
    groupBy: ReturnType<typeof vi.fn>
    $queryRawUnsafe: ReturnType<typeof vi.fn>
  }

  beforeEach(async () => {
    const {
      prisma: prismaMock,
      findMany,
      count,
      findFirst,
      groupBy,
      $queryRawUnsafe
    } = mockPrisma()
    const { cache: cacheMock, get, set } = mockCache()

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CatalogService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: CacheService, useValue: cacheMock }
      ]
    }).compile()

    service = module.get<CatalogService>(CatalogService)
    prisma = { findMany, count, findFirst, groupBy, $queryRawUnsafe }
    cache = { get, set }
  })

  it('returns cached list when available', async () => {
    const cached: Paginated<CourseListItem> = {
      items: [rawListItem],
      total: 1,
      page: 1,
      pageSize: 20
    }
    cache.get.mockResolvedValue(cached)

    const result = await service.list({} as ListCoursesDto)

    expect(result).toEqual(cached)
    expect(prisma.findMany).not.toHaveBeenCalled()
  })

  it('queries the database and sets the cache on list miss', async () => {
    cache.get.mockResolvedValue(null)
    prisma.findMany.mockResolvedValue([rawListItem])
    prisma.count.mockResolvedValue(1)

    const result = await service.list({ page: 1, limit: 20 } as ListCoursesDto)

    expect(result.items).toHaveLength(1)
    expect(result.items[0].slug).toBe('pilotage-de-projet')
    expect(result.total).toBe(1)
    expect(result.page).toBe(1)
    expect(result.pageSize).toBe(20)
    expect(cache.set).toHaveBeenCalledWith(expect.stringMatching(/^courses:list:/), result)
    expect(prisma.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: 'published' },
        skip: 0,
        take: 20,
        orderBy: { updatedAt: 'desc' }
      })
    )
    expect(prisma.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: 'published' }
      })
    )
  })

  it('applies family and search filters with French full-text', async () => {
    cache.get.mockResolvedValue(null)
    prisma.$queryRawUnsafe.mockResolvedValueOnce([{ count: 0 }]).mockResolvedValueOnce([])

    await service.list({
      family: 'management',
      search: 'pilot',
      page: 2,
      limit: 10
    } as ListCoursesDto)

    const countCall = prisma.$queryRawUnsafe.mock.calls[0]
    const listCall = prisma.$queryRawUnsafe.mock.calls[1]

    expect(countCall[0]).toContain("to_tsquery('french'")
    expect(countCall[0]).toContain('title_tsv')
    expect(countCall.slice(1)).toEqual(expect.arrayContaining(['management', 'pilot']))

    expect(listCall[0]).toContain('ts_rank_cd')
    expect(listCall[0]).toContain('LIMIT')
    expect(listCall[0]).toContain('OFFSET')
    expect(listCall.slice(1)).toEqual(expect.arrayContaining(['management', 'pilot', 10, 10]))
  })

  it('applies all filters', async () => {
    cache.get.mockResolvedValue(null)
    prisma.findMany.mockResolvedValue([])
    prisma.count.mockResolvedValue(0)

    await service.list({
      family: 'management',
      cpf: true,
      certifying: true,
      durationMin: 10,
      durationMax: 100,
      priceMin: 500,
      priceMax: 2000,
      center: 'paris',
      page: 1,
      limit: 20
    } as ListCoursesDto)

    expect(prisma.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          status: 'published',
          familySlug: 'management',
          cpf: true,
          certification: { not: null },
          durationHours: { gte: 10, lte: 100 },
          price: { gte: 500, lte: 2000 },
          centerSlug: 'paris'
        }
      })
    )
  })

  it.each([
    { sort: CourseSortField.updatedAt, order: CourseSortOrder.asc, expected: { updatedAt: 'asc' } },
    {
      sort: CourseSortField.duration,
      order: CourseSortOrder.desc,
      expected: { durationHours: 'desc' }
    },
    { sort: CourseSortField.price, order: CourseSortOrder.asc, expected: { price: 'asc' } },
    { sort: CourseSortField.name, order: undefined, expected: { title: 'asc' } },
    { sort: undefined, order: undefined, expected: { updatedAt: 'desc' } }
  ])('sorts by $sort $order', async ({ sort, order, expected }) => {
    cache.get.mockResolvedValue(null)
    prisma.findMany.mockResolvedValue([])
    prisma.count.mockResolvedValue(0)

    await service.list({ sort, order, page: 1, limit: 20 } as ListCoursesDto)

    expect(prisma.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: expected
      })
    )
  })

  it('sorts by relevance when sort is relevance and search is provided', async () => {
    cache.get.mockResolvedValue(null)
    prisma.$queryRawUnsafe.mockResolvedValueOnce([{ count: 0 }]).mockResolvedValueOnce([])

    await service.list({
      sort: CourseSortField.relevance,
      search: 'pilot',
      page: 1,
      limit: 20
    } as ListCoursesDto)

    const listCall = prisma.$queryRawUnsafe.mock.calls[1]
    expect(listCall[0]).toContain('ts_rank_cd')
    expect(listCall[0]).toMatch(/ORDER BY.*ts_rank_cd.*DESC/)
  })

  it('falls back to ILIKE search when query has no usable full-text tokens', async () => {
    cache.get.mockResolvedValue(null)
    prisma.$queryRawUnsafe.mockResolvedValueOnce([{ count: 0 }]).mockResolvedValueOnce([])

    await service.list({ search: 'le', page: 1, limit: 20 } as ListCoursesDto)

    const countCall = prisma.$queryRawUnsafe.mock.calls[0]
    const listCall = prisma.$queryRawUnsafe.mock.calls[1]

    expect(countCall[0]).toContain('unaccent(title) ILIKE')
    expect(countCall[0]).not.toContain('to_tsquery')
    expect(countCall[1]).toContain('%le%')

    expect(listCall[0]).toContain('unaccent(title) ILIKE')
    expect(listCall[0]).toContain('LIMIT')
    expect(listCall[1]).toContain('%le%')
  })

  it('paginates correctly', async () => {
    cache.get.mockResolvedValue(null)
    prisma.findMany.mockResolvedValue([])
    prisma.count.mockResolvedValue(0)

    await service.list({ page: 3, limit: 15 } as ListCoursesDto)

    expect(prisma.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 30, take: 15 }))
  })

  it('returns cached detail when available', async () => {
    cache.get.mockResolvedValue(cachedCourse)

    const result = await service.findBySlug('pilotage-de-projet', 'management')

    expect(result).toEqual(cachedCourse)
    expect(prisma.findFirst).not.toHaveBeenCalled()
  })

  it('queries the database and sets the cache on detail miss', async () => {
    cache.get.mockResolvedValue(null)
    prisma.findFirst.mockResolvedValue(rawCourse)

    const result = await service.findBySlug('pilotage-de-projet', 'management')

    expect(result).not.toBeNull()
    expect(result?.slug).toBe('pilotage-de-projet')
    expect(result?.createdAt).toBe('2026-01-15T10:00:00.000Z')
    expect(result?.updatedAt).toBe('2026-01-20T10:00:00.000Z')
    expect(cache.set).toHaveBeenCalledWith(
      'courses:detail:management:pilotage-de-projet',
      expect.any(Object)
    )
    expect(prisma.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          slug: 'pilotage-de-projet',
          status: 'published',
          familySlug: 'management'
        }
      })
    )
  })

  it('finds a course without a family filter', async () => {
    cache.get.mockResolvedValue(null)
    prisma.findFirst.mockResolvedValue(rawCourse)

    await service.findBySlug('pilotage-de-projet')

    expect(prisma.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { slug: 'pilotage-de-projet', status: 'published' }
      })
    )
  })

  it('returns null when a course is not found', async () => {
    cache.get.mockResolvedValue(null)
    prisma.findFirst.mockResolvedValue(null)

    const result = await service.findBySlug('inexistant')

    expect(result).toBeNull()
    expect(cache.set).not.toHaveBeenCalled()
  })

  it('maps null and invalid prices to null', async () => {
    cache.get.mockResolvedValue(null)
    prisma.findMany.mockResolvedValue([
      { ...rawListItem, price: null },
      { ...rawListItem, price: 'not-a-number' }
    ])
    prisma.count.mockResolvedValue(2)

    const result = await service.list({ page: 1, limit: 20 } as ListCoursesDto)

    expect(result.items[0].price).toBeNull()
    expect(result.items[1].price).toBeNull()
  })

  it('maps string dates and non-array blocks defensively', async () => {
    cache.get.mockResolvedValue(null)
    prisma.findFirst.mockResolvedValue({
      ...rawCourse,
      blocks: { notAnArray: true },
      createdAt: '2026-01-15T10:00:00.000Z',
      updatedAt: '2026-01-20T10:00:00.000Z'
    })

    const result = await service.findBySlug('pilotage-de-projet')

    expect(result?.blocks).toBeNull()
    expect(result?.createdAt).toBe('2026-01-15T10:00:00.000Z')
    expect(result?.updatedAt).toBe('2026-01-20T10:00:00.000Z')
  })

  it('returns cached families', async () => {
    const cached: FamilyWithCount[] = [{ slug: 'management', count: 5 }]
    cache.get.mockResolvedValue(cached)

    const result = await service.families()

    expect(result).toEqual(cached)
    expect(prisma.groupBy).not.toHaveBeenCalled()
  })

  it('queries the database and sets the cache for families', async () => {
    cache.get.mockResolvedValue(null)
    prisma.groupBy.mockResolvedValue([
      { familySlug: 'management', _count: { id: 2 } },
      { familySlug: 'informatique', _count: { id: 7 } }
    ])

    const result = await service.families()

    expect(result).toEqual([
      { slug: 'management', count: 2 },
      { slug: 'informatique', count: 7 }
    ])
    expect(cache.set).toHaveBeenCalledWith('courses:families', result)
    expect(prisma.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        by: ['familySlug'],
        where: { status: 'published', familySlug: { not: null } },
        _count: { id: true },
        orderBy: { familySlug: 'asc' }
      })
    )
  })

  it('returns an empty family list when nothing is published', async () => {
    cache.get.mockResolvedValue(null)
    prisma.groupBy.mockResolvedValue([])

    const result = await service.families()

    expect(result).toEqual([])
    expect(cache.set).toHaveBeenCalledWith('courses:families', [])
  })
})
