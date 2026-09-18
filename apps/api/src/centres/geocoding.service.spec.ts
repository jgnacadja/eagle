import { Test, TestingModule } from '@nestjs/testing'
import { GeocodingService } from './geocoding.service'
import { CacheService } from '../common/cache/cache.service'
import { DirectusCatalogService, type GeocodableCentre } from '../directus/directus.catalog.service'

const fetchMock = vi.fn()

const banResponse = {
  features: [
    {
      geometry: { coordinates: [4.85, 45.76] },
      properties: {
        city: 'Lyon',
        postcode: '69003',
        context: '69, Rhône, Auvergne-Rhône-Alpes'
      }
    }
  ]
}

function mockDeps(centres: GeocodableCentre[]) {
  const fetchCentresForGeocoding = vi.fn().mockResolvedValue(centres)
  const updateCentre = vi.fn().mockResolvedValue(undefined)
  const invalidateCatalog = vi.fn().mockResolvedValue(undefined)
  const cacheGet = vi.fn().mockResolvedValue(null)
  const cacheSet = vi.fn().mockResolvedValue(undefined)
  return {
    directus: {
      fetchCentresForGeocoding,
      updateCentre
    } as unknown as DirectusCatalogService,
    cache: {
      invalidateCatalog,
      get: cacheGet,
      set: cacheSet
    } as unknown as CacheService,
    fetchCentresForGeocoding,
    updateCentre,
    invalidateCatalog,
    cacheGet,
    cacheSet
  }
}

describe('GeocodingService', () => {
  let service: GeocodingService

  beforeEach(async () => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  async function build(centres: GeocodableCentre[]) {
    const deps = mockDeps(centres)
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GeocodingService,
        { provide: DirectusCatalogService, useValue: deps.directus },
        { provide: CacheService, useValue: deps.cache }
      ]
    }).compile()
    service = module.get<GeocodingService>(GeocodingService)
    return deps
  }

  it('géocode un centre dont l’adresse a changé et persiste les champs dérivés', async () => {
    const deps = await build([
      {
        id: 1,
        slug: 'lyon',
        name: 'Centre de Lyon',
        status: 'published',
        address: '12 rue de la Part-Dieu, 69003 Lyon',
        geocoded_address: null
      }
    ])
    fetchMock.mockResolvedValue({ ok: true, json: () => Promise.resolve(banResponse) })

    const result = await service.syncMissing()

    expect(result).toEqual({ geocoded: 1, failed: 0 })
    expect(deps.updateCentre).toHaveBeenCalledWith(1, {
      city: 'Lyon',
      postal_code: '69003',
      department: 'Rhône',
      region: 'Auvergne-Rhône-Alpes',
      latitude: 45.76,
      longitude: 4.85,
      geocoded_address: '12 rue de la Part-Dieu, 69003 Lyon'
    })
    expect(deps.invalidateCatalog).toHaveBeenCalled()
  })

  it('ignore les centres déjà géocodés pour la même adresse', async () => {
    const deps = await build([
      {
        id: 1,
        slug: 'lyon',
        name: 'Centre de Lyon',
        status: 'published',
        address: '12 rue de la Part-Dieu, 69003 Lyon',
        geocoded_address: '12 rue de la Part-Dieu, 69003 Lyon'
      }
    ])

    const result = await service.syncMissing()

    expect(result).toEqual({ geocoded: 0, failed: 0 })
    expect(fetchMock).not.toHaveBeenCalled()
    expect(deps.updateCentre).not.toHaveBeenCalled()
    expect(deps.invalidateCatalog).not.toHaveBeenCalled()
  })

  it('compte un échec quand la BAN ne trouve pas l’adresse', async () => {
    const deps = await build([
      {
        id: 2,
        slug: 'nowhere',
        name: 'Centre introuvable',
        status: 'draft',
        address: 'adresse inexistante',
        geocoded_address: null
      }
    ])
    fetchMock.mockResolvedValue({ ok: true, json: () => Promise.resolve({ features: [] }) })

    const result = await service.syncMissing()

    expect(result).toEqual({ geocoded: 0, failed: 1 })
    expect(deps.updateCentre).not.toHaveBeenCalled()
  })

  it('ne plante pas quand la requête BAN échoue', async () => {
    await build([
      {
        id: 3,
        slug: 'lyon',
        name: 'Centre de Lyon',
        status: 'published',
        address: 'Lyon',
        geocoded_address: null
      }
    ])
    fetchMock.mockRejectedValue(new Error('network'))

    const result = await service.syncMissing()

    expect(result).toEqual({ geocoded: 0, failed: 1 })
  })

  describe('reverseGeocode', () => {
    const reverseResponse = {
      features: [
        {
          geometry: { coordinates: [2.45, 48.79] },
          properties: {
            city: 'Créteil',
            postcode: '94000',
            context: '94, Val-de-Marne, Île-de-France'
          }
        }
      ]
    }

    it('résout ville et département depuis les coordonnées', async () => {
      const deps = await build([])
      fetchMock.mockResolvedValue({ ok: true, json: () => Promise.resolve(reverseResponse) })

      const result = await service.reverseGeocode(48.7909, 2.4534)

      expect(result).toEqual({
        city: 'Créteil',
        postcode: '94000',
        department: 'Val-de-Marne',
        region: 'Île-de-France'
      })
      const url = fetchMock.mock.calls[0]?.[0] as URL
      expect(url.pathname).toBe('/reverse/')
      expect(url.searchParams.get('lat')).toBe('48.7909')
      expect(url.searchParams.get('lon')).toBe('2.4534')
      expect(deps.cacheSet).toHaveBeenCalled()
    })

    it('sert le résultat depuis le cache sans rappeler la BAN', async () => {
      const cached = {
        city: 'Créteil',
        postcode: '94000',
        department: 'Val-de-Marne',
        region: 'Île-de-France'
      }
      const deps = await build([])
      deps.cacheGet.mockResolvedValue(cached)

      const result = await service.reverseGeocode(48.7909, 2.4534)

      expect(result).toEqual(cached)
      expect(fetchMock).not.toHaveBeenCalled()
      expect(deps.cacheSet).not.toHaveBeenCalled()
    })

    it('retourne des champs null et ne met pas en cache quand la BAN ne résout rien', async () => {
      const deps = await build([])
      fetchMock.mockResolvedValue({ ok: true, json: () => Promise.resolve({ features: [] }) })

      const result = await service.reverseGeocode(0, 0)

      expect(result).toEqual({ city: null, postcode: null, department: null, region: null })
      expect(deps.cacheSet).not.toHaveBeenCalled()
    })

    it('retourne des champs null et ne met pas en cache quand la BAN répond une erreur HTTP', async () => {
      const deps = await build([])
      fetchMock.mockResolvedValue({ ok: false, status: 500 })

      const result = await service.reverseGeocode(48.79, 2.45)

      expect(result).toEqual({ city: null, postcode: null, department: null, region: null })
      expect(deps.cacheSet).not.toHaveBeenCalled()
    })

    it('retourne des champs null quand la requête BAN échoue', async () => {
      await build([])
      fetchMock.mockRejectedValue(new Error('network'))

      const result = await service.reverseGeocode(48.79, 2.45)

      expect(result).toEqual({ city: null, postcode: null, department: null, region: null })
    })
  })
})
