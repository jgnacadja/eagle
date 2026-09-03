import { Test, TestingModule } from '@nestjs/testing'
import type { Course, CourseListItem, Paginated } from '@learnup/types'
import { CatalogService } from './catalog.service'
import { CacheService } from '../common/cache/cache.service'
import { PrismaService } from '../prisma/prisma.service'
import type { ListCoursesDto } from './catalog.dto'

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

  return {
    prisma: {
      course: { findMany, count, findFirst }
    } as unknown as PrismaService,
    findMany,
    count,
    findFirst
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
  let prisma: { findMany: ReturnType<typeof vi.fn>; count: ReturnType<typeof vi.fn>; findFirst: ReturnType<typeof vi.fn> }

  beforeEach(async () => {
    const { prisma: prismaMock, findMany, count, findFirst } = mockPrisma()
    const { cache: cacheMock, get, set } = mockCache()

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CatalogService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: CacheService, useValue: cacheMock }
      ]
    }).compile()

    service = module.get<CatalogService>(CatalogService)
    prisma = { findMany, count, findFirst }
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
        take: 20
      })
    )
  })

  it('applies family and search filters', async () => {
    cache.get.mockResolvedValue(null)
    prisma.findMany.mockResolvedValue([])
    prisma.count.mockResolvedValue(0)

    await service.list({ family: 'management', search: 'pilot', page: 2, limit: 10 } as ListCoursesDto)

    expect(prisma.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          status: 'published',
          familySlug: 'management',
          OR: [
            { title: { contains: 'pilot', mode: 'insensitive' } },
            { description: { contains: 'pilot', mode: 'insensitive' } }
          ]
        },
        skip: 10,
        take: 10
      })
    )
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
})
