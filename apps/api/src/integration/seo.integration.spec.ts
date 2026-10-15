import { ConfigService } from '@nestjs/config'
import { Test, TestingModule } from '@nestjs/testing'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CacheService } from '../common/cache/cache.service'
import { DirectusItemsClient } from '../directus/directus.items.client'
import { SeoService, type SeoResolution } from '../seo/seo.service'
import { DIRECTUS_URL, FakeDirectus, FakeNetwork } from './support/fake-network'

// ST-03 — la résolution `/seo/resolve` exercée à travers le vrai
// DirectusItemsClient : mêmes requêtes HTTP `/items/*` qu'en production,
// réponses du Directus simulé. Seul le cache est en mémoire.
describe('seo — resolve (intégration)', () => {
  const directus = new FakeDirectus(null)
  const network = new FakeNetwork(directus)
  const store = new Map<string, SeoResolution>()
  const cache = {
    get: async (key: string) => store.get(key),
    set: async (key: string, value: SeoResolution) => void store.set(key, value)
  }

  let service: SeoService

  async function boot() {
    vi.stubGlobal('fetch', network.fetch)
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SeoService,
        DirectusItemsClient,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) =>
              ({ DIRECTUS_TOKEN: 'tok-0001', DIRECTUS_INTERNAL_URL: DIRECTUS_URL })[key]
          }
        },
        { provide: CacheService, useValue: cache }
      ]
    }).compile()
    service = module.get(SeoService)
  }

  afterEach(() => {
    vi.unstubAllGlobals()
    for (const table of Object.values(directus.tables)) table.length = 0
    store.clear()
    directus.calls.length = 0
  })

  it('301 : une ligne redirects prime toute résolution', async () => {
    directus.tables.redirects = [
      {
        id: 1,
        from_path: '/formations/gestion/ancien-caces',
        to_path: '/formations/gestion/nouveau-caces',
        status: '301',
        origin: 'auto'
      }
    ]
    await boot()
    expect(await service.resolve('/formations/gestion/ancien-caces')).toEqual({
      redirect: { to: '/formations/gestion/nouveau-caces', status: 301 }
    })
    // Une seule requête items : la fiche n'est même pas cherchée.
    expect(directus.calls.filter((c) => c.url.includes('/items/'))).toHaveLength(1)
  })

  it('410 : page dépubliée → gone, conservé en cache', async () => {
    directus.tables.redirects = [
      { id: 1, from_path: '/vieille-formation', to_path: null, status: '410', origin: 'auto' }
    ]
    await boot()
    expect(await service.resolve('/vieille-formation/')).toEqual({ gone: true })
    const calls = directus.calls.length
    expect(await service.resolve('/vieille-formation/')).toEqual({ gone: true })
    expect(directus.calls.length).toBe(calls) // servi depuis le cache
  })

  it('route vivante : fiche formation résolue via slug + famille', async () => {
    directus.tables.redirects = []
    directus.tables.familles_formation = [{ id: 3, slug: 'securite', status: 'published' }]
    directus.tables.formations = [{ id: 42, slug: 'caces-r489', status: 'published', famille: 3 }]
    await boot()
    expect(await service.resolve('/formations/securite/caces-r489')).toEqual({
      type: 'formation',
      id: 42
    })
  })

  it('adresse inconnue : type/id null', async () => {
    directus.tables.redirects = []
    directus.tables.articles = []
    await boot()
    expect(await service.resolve('/actualites/nope')).toEqual({ type: null, id: null })
  })
})
