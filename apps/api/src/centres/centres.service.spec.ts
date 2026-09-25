import { Test, TestingModule } from '@nestjs/testing'
import type { CentreListItem } from '@learnup/types'
import { CentresService } from './centres.service'
import { GeocodingService } from './geocoding.service'
import { CacheService } from '../common/cache/cache.service'
import { DirectusCatalogService, type DirectusCentre } from '../directus/directus.catalog.service'
import type { ListCentresDto } from './centres.dto'

const centre = (overrides: Partial<DirectusCentre> = {}): DirectusCentre => ({
  id: 1,
  status: 'published',
  slug: 'lyon',
  name: 'Centre de Lyon',
  address: '12 cours Lafayette',
  city: 'Lyon',
  postal_code: '69003',
  department: 'Rhône',
  departments_covered: ['69', '01'],
  region: 'Auvergne-Rhône-Alpes',
  specialties: ['SST'],
  latitude: 45.76,
  longitude: 4.83,
  ...overrides
})

const centres: DirectusCentre[] = [
  centre({ id: 1, slug: 'lyon' }),
  centre({
    id: 2,
    slug: 'paris',
    name: 'Centre de Paris',
    city: 'Paris',
    postal_code: '75012',
    department: 'Paris',
    departments_covered: ['75', '92'],
    specialties: ['Management']
  }),
  centre({
    id: 3,
    slug: 'creteil',
    name: 'Centre de Créteil',
    city: 'Créteil',
    postal_code: '94000',
    department: 'Val-de-Marne',
    departments_covered: ['94'],
    specialties: ['CACES']
  })
]

function mockCache() {
  const get = vi.fn()
  const set = vi.fn()
  return { cache: { get, set } as unknown as CacheService, get, set }
}

function mockDirectus() {
  const fetchAllCentres = vi.fn().mockResolvedValue(centres)
  return {
    directus: { fetchAllCentres } as unknown as DirectusCatalogService,
    fetchAllCentres
  }
}

describe('CentresService', () => {
  let service: CentresService
  let cache: { get: ReturnType<typeof vi.fn>; set: ReturnType<typeof vi.fn> }
  let directus: { fetchAllCentres: ReturnType<typeof vi.fn> }

  beforeEach(async () => {
    const { cache: cacheMock, get, set } = mockCache()
    const { directus: directusMock, fetchAllCentres } = mockDirectus()

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CentresService,
        { provide: CacheService, useValue: cacheMock },
        { provide: DirectusCatalogService, useValue: directusMock },
        {
          provide: GeocodingService,
          useValue: { syncMissing: vi.fn().mockResolvedValue({ geocoded: 0, failed: 0 }) }
        }
      ]
    }).compile()

    service = module.get<CentresService>(CentresService)
    cache = { get, set }
    directus = { fetchAllCentres }
  })

  it('returns cached list when available', async () => {
    const cached = [centre()] as CentreListItem[]
    cache.get.mockResolvedValue(cached)

    const result = await service.list({} as ListCentresDto)

    expect(result).toEqual(cached)
    expect(directus.fetchAllCentres).not.toHaveBeenCalled()
  })

  it('fetches all centres and caches the filtered list on miss', async () => {
    cache.get.mockResolvedValue(null)

    const result = await service.list({} as ListCentresDto)

    expect(result).toHaveLength(3)
    expect(directus.fetchAllCentres).toHaveBeenCalled()
    expect(cache.set).toHaveBeenCalledWith('centres:all', centres)
    expect(cache.set).toHaveBeenCalledWith('centres:list:|', result)
  })

  it('uses a param-order-independent cache key', async () => {
    cache.get.mockResolvedValue(null)

    await service.list({ department: 'Rhône', search: 'lyon' } as ListCentresDto)

    expect(cache.get).toHaveBeenCalledWith('centres:list:Rhône|lyon')
  })

  it('filters by department including departments_covered', async () => {
    cache.get.mockResolvedValue(null)

    const result = await service.list({ department: '01' } as ListCentresDto)

    expect(result.map((c) => c.slug)).toEqual(['lyon'])
  })

  it('filters by department name matching a covered code', async () => {
    cache.get.mockResolvedValue(null)

    const result = await service.list({ department: 'Hauts-de-Seine' } as ListCentresDto)

    expect(result.map((c) => c.slug)).toEqual(['paris'])
  })

  it('filters by code matching the geocoded department name', async () => {
    cache.get.mockResolvedValue(null)
    directus.fetchAllCentres.mockResolvedValue([
      centre({ slug: 'nice', department: 'Alpes-Maritimes', departments_covered: [] })
    ])

    const result = await service.list({ department: '06' } as ListCentresDto)

    expect(result.map((c) => c.slug)).toEqual(['nice'])
  })

  it('filters a covered tag despite different separators', async () => {
    cache.get.mockResolvedValue(null)
    directus.fetchAllCentres.mockResolvedValue([
      centre({ slug: 'tag', department: null, departments_covered: ['Val de Marne'] })
    ])

    const result = await service.list({ department: 'Val-de-Marne' } as ListCentresDto)

    expect(result.map((c) => c.slug)).toEqual(['tag'])
  })

  it('filters search accent- and case-insensitively on name/city/CP/address/specialties', async () => {
    cache.get.mockResolvedValue(null)

    const result = await service.list({ search: 'creteil' } as ListCentresDto)

    expect(result.map((c) => c.slug)).toEqual(['creteil'])
  })

  it('matches search on department name and covered codes', async () => {
    cache.get.mockResolvedValue(null)
    directus.fetchAllCentres.mockResolvedValue([
      centre({ slug: 'lyon', department: 'Rhône', departments_covered: ['69'], region: null }),
      centre({
        slug: 'paris',
        city: 'Paris',
        postal_code: '75012',
        department: 'Paris',
        departments_covered: ['75', '92'],
        region: null
      })
    ])

    expect((await service.list({ search: 'rhone' } as ListCentresDto)).map((c) => c.slug)).toEqual([
      'lyon'
    ])
    expect(
      (await service.list({ search: 'hauts-de-seine' } as ListCentresDto)).map((c) => c.slug)
    ).toEqual(['paris'])
  })

  it('matches search on a covered department code', async () => {
    cache.get.mockResolvedValue(null)
    directus.fetchAllCentres.mockResolvedValue([
      centre({
        slug: 'bourg',
        city: 'Bourg-en-Bresse',
        postal_code: '01000',
        department: 'Ain',
        departments_covered: ['39']
      })
    ])

    const result = await service.list({ search: '39' } as ListCentresDto)

    expect(result.map((c) => c.slug)).toEqual(['bourg'])
  })

  it('matches search on specialties (JSON field impossible à filtrer côté Directus)', async () => {
    cache.get.mockResolvedValue(null)

    const result = await service.list({ search: 'caces' } as ListCentresDto)

    expect(result.map((c) => c.slug)).toEqual(['creteil'])
  })

  it('combines department and search', async () => {
    cache.get.mockResolvedValue(null)

    const result = await service.list({
      department: 'Paris',
      search: 'management'
    } as ListCentresDto)

    expect(result.map((c) => c.slug)).toEqual(['paris'])
  })

  it('degrades to [] when Directus fails without caching the empty result', async () => {
    cache.get.mockResolvedValue(null)
    directus.fetchAllCentres.mockRejectedValue(new Error('network'))

    const result = await service.list({} as ListCentresDto)

    expect(result).toEqual([])
    expect(cache.set).not.toHaveBeenCalledWith(expect.stringContaining('centres:list'), [])
  })

  it('returns cached departments when available', async () => {
    cache.get.mockResolvedValue(['Rhône'])

    const result = await service.departments()

    expect(result).toEqual(['Rhône'])
    expect(directus.fetchAllCentres).not.toHaveBeenCalled()
  })

  it('dedupes department and covered codes as names, sorted fr', async () => {
    cache.get.mockResolvedValue(null)

    const result = await service.departments()

    expect(result).toEqual(['Ain', 'Hauts-de-Seine', 'Paris', 'Rhône', 'Val-de-Marne'])
    expect(cache.set).toHaveBeenCalledWith('centres:departments:v2', result)
  })

  it('dedupes names differing only by separators, geocoded graphie first', async () => {
    cache.get.mockResolvedValue(null)
    directus.fetchAllCentres.mockResolvedValue([
      centre({ slug: 'a', department: 'Val-de-Marne', departments_covered: ['val de marne'] })
    ])

    const result = await service.departments()

    expect(result).toEqual(['Val-de-Marne'])
  })

  it('count returns the number of published centres', async () => {
    cache.get.mockResolvedValue(null)

    expect(await service.count()).toBe(3)
  })

  it('count degrades to 0 when Directus fails', async () => {
    cache.get.mockResolvedValue(null)
    directus.fetchAllCentres.mockRejectedValue(new Error('network'))

    expect(await service.count()).toBe(0)
  })
})
