import { ConfigService } from '@nestjs/config'
import { Test, TestingModule } from '@nestjs/testing'
import { CacheService } from '../common/cache/cache.service'
import { DirectusCatalogService } from '../directus/directus.catalog.service'
import { ReviewsService } from './reviews.service'
import {
  REVIEWS_PROVIDER,
  type PlaceReviewsSnapshot,
  type ReviewsProvider
} from './reviews.provider'

const centre = { id: 7, slug: 'creteil', google_place_id: 'ChIJ_place' }

const snapshot: PlaceReviewsSnapshot = {
  rating: 4.7,
  reviewsCount: 214,
  reviews: [
    {
      googleReviewId: 'rev-1',
      author: 'Marie D.',
      avatar: 'https://lh3.googleusercontent.com/a/photo',
      stars: 5,
      quote: 'Équipe très réactive.',
      publishedAt: '2026-01-15T10:00:00Z'
    }
  ]
}

// Déclenche la sync et attend sa fin : la libération du verrou est le
// dernier maillon de la chaîne trigger → execute → finally.
async function runAndWait(service: ReviewsService, cache: CacheService): Promise<void> {
  await service.trigger()
  await vi.waitFor(() => {
    expect(vi.mocked(cache.releaseSyncLock)).toHaveBeenCalledTimes(1)
  })
}

function makeProvider(overrides: Partial<ReviewsProvider> = {}): ReviewsProvider {
  return {
    enabled: true,
    fetchPlaceReviews: vi.fn().mockResolvedValue(snapshot),
    ...overrides
  }
}

describe('ReviewsService', () => {
  let service: ReviewsService
  let cache: CacheService
  let catalog: DirectusCatalogService
  let provider: ReviewsProvider
  let brandPlaceId: string | undefined

  async function build(p: ReviewsProvider = provider) {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewsService,
        { provide: CacheService, useValue: cache },
        { provide: DirectusCatalogService, useValue: catalog },
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => (key === 'GOOGLE_LEARNUP_PLACE_ID' ? brandPlaceId : undefined)
          }
        },
        { provide: REVIEWS_PROVIDER, useValue: p }
      ]
    }).compile()
    service = module.get<ReviewsService>(ReviewsService)
  }

  beforeEach(async () => {
    brandPlaceId = undefined
    cache = {
      setSyncRun: vi.fn(),
      getSyncRun: vi.fn(),
      acquireSyncLock: vi.fn().mockResolvedValue(true),
      releaseSyncLock: vi.fn().mockResolvedValue(undefined)
    } as unknown as CacheService
    catalog = {
      fetchCentresForReviews: vi.fn().mockResolvedValue([centre]),
      upsertGoogleAvis: vi.fn().mockResolvedValue({ inserted: 1, updated: 0 }),
      updateCentreGoogleAggregate: vi.fn().mockResolvedValue(undefined)
    } as unknown as DirectusCatalogService
    provider = makeProvider()
    await build()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  it('trigger() starts the run and returns true', async () => {
    await expect(service.trigger()).resolves.toBe(true)
    await vi.waitFor(() => expect(cache.releaseSyncLock).toHaveBeenCalledTimes(1))

    expect(provider.fetchPlaceReviews).toHaveBeenCalledWith('ChIJ_place')
    expect(cache.setSyncRun).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: 'success' }),
      'sync:reviews:last_run'
    )
  })

  it('trigger() refuses a second run while one is in progress', async () => {
    vi.mocked(provider.fetchPlaceReviews).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(snapshot), 20))
    )

    const [first, second] = await Promise.all([service.trigger(), service.trigger()])

    expect([first, second].sort()).toEqual([false, true])
    await vi.waitFor(() => expect(cache.releaseSyncLock).toHaveBeenCalledTimes(1))
    expect(provider.fetchPlaceReviews).toHaveBeenCalledTimes(1)
  })

  it('trigger() skips when another instance holds the reviews lock', async () => {
    vi.mocked(cache.acquireSyncLock).mockResolvedValue(false)

    await expect(service.trigger()).resolves.toBe(false)

    expect(cache.acquireSyncLock).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Number),
      'sync:reviews:lock'
    )
    expect(provider.fetchPlaceReviews).not.toHaveBeenCalled()
    expect(cache.releaseSyncLock).not.toHaveBeenCalled()
  })

  it('is a no-op success when no provider is active (mode dégradé sans clé)', async () => {
    const noop = makeProvider({ enabled: false, fetchPlaceReviews: vi.fn() })
    await build(noop)

    await runAndWait(service, cache)

    expect(noop.fetchPlaceReviews).not.toHaveBeenCalled()
    expect(catalog.fetchCentresForReviews).not.toHaveBeenCalled()
    expect(catalog.upsertGoogleAvis).not.toHaveBeenCalled()
    expect(cache.setSyncRun).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: 'success', inserted: 0, updated: 0, failed: 0 }),
      'sync:reviews:last_run'
    )
  })

  it('upserts mapped avis and writes the centre aggregate', async () => {
    await runAndWait(service, cache)

    expect(catalog.upsertGoogleAvis).toHaveBeenCalledWith([
      expect.objectContaining({
        slug: 'google-creteil-rev-1',
        source: 'google',
        google_review_id: 'rev-1',
        centre: 7,
        stars: 5
      })
    ])
    expect(catalog.updateCentreGoogleAggregate).toHaveBeenCalledWith(7, {
      google_rating: 4.7,
      google_reviews_count: 214
    })
    expect(cache.setSyncRun).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: 'success', inserted: 1, updated: 0 }),
      'sync:reviews:last_run'
    )
  })

  it('syncs the brand listing (GOOGLE_LEARNUP_PLACE_ID) into avis marque', async () => {
    brandPlaceId = 'ChIJ_marque'
    await build()

    await runAndWait(service, cache)

    // Fiche marque en premier, puis le centre.
    expect(provider.fetchPlaceReviews).toHaveBeenNthCalledWith(1, 'ChIJ_marque')
    expect(provider.fetchPlaceReviews).toHaveBeenNthCalledWith(2, 'ChIJ_place')
    expect(catalog.upsertGoogleAvis).toHaveBeenCalledWith([
      expect.objectContaining({
        slug: 'google-marque-rev-1',
        source: 'google',
        google_review_id: 'rev-1',
        centre: null
      })
    ])
    // L'agrégat reste un champ centre : rien à écrire pour la marque.
    expect(catalog.updateCentreGoogleAggregate).toHaveBeenCalledTimes(1)
    expect(cache.setSyncRun).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: 'success', inserted: 2, updated: 0 }),
      'sync:reviews:last_run'
    )
  })

  it('keeps going when the brand listing fetch fails', async () => {
    brandPlaceId = 'ChIJ_marque'
    await build()
    vi.mocked(provider.fetchPlaceReviews).mockResolvedValueOnce(null).mockResolvedValue(snapshot)

    await runAndWait(service, cache)

    expect(catalog.updateCentreGoogleAggregate).toHaveBeenCalledWith(7, {
      google_rating: 4.7,
      google_reviews_count: 214
    })
    expect(cache.setSyncRun).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: 'success', failed: 1, inserted: 1 }),
      'sync:reviews:last_run'
    )
  })

  it('keeps the last snapshot when the provider returns null for a centre', async () => {
    vi.mocked(provider.fetchPlaceReviews).mockResolvedValue(null)

    await runAndWait(service, cache)

    expect(catalog.upsertGoogleAvis).not.toHaveBeenCalled()
    expect(catalog.updateCentreGoogleAggregate).not.toHaveBeenCalled()
    expect(cache.setSyncRun).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: 'success', failed: 1 }),
      'sync:reviews:last_run'
    )
  })

  it('counts a failing centre without interrupting the run', async () => {
    vi.mocked(catalog.fetchCentresForReviews).mockResolvedValue([
      centre,
      { id: 8, slug: 'vitry', google_place_id: 'ChIJ_vitry' }
    ])
    vi.mocked(provider.fetchPlaceReviews)
      .mockResolvedValueOnce(snapshot)
      .mockRejectedValueOnce(new Error('boom'))

    await runAndWait(service, cache)

    expect(catalog.updateCentreGoogleAggregate).toHaveBeenCalledTimes(1)
    expect(cache.setSyncRun).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: 'success', failed: 1, inserted: 1 }),
      'sync:reviews:last_run'
    )
  })

  it('skips centres without place_id returned by the catalogue', async () => {
    vi.mocked(catalog.fetchCentresForReviews).mockResolvedValue([
      { id: 9, slug: 'sans-place', google_place_id: null }
    ])

    await runAndWait(service, cache)

    expect(provider.fetchPlaceReviews).not.toHaveBeenCalled()
    expect(cache.setSyncRun).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: 'success', inserted: 0 }),
      'sync:reviews:last_run'
    )
  })

  it('records a failed run when the centres fetch throws', async () => {
    vi.mocked(catalog.fetchCentresForReviews).mockRejectedValue(new Error('directus down'))

    await runAndWait(service, cache)

    expect(cache.setSyncRun).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: 'failed', error: 'directus down' }),
      'sync:reviews:last_run'
    )
  })

  it('returns the latest reviews run', async () => {
    const run = { status: 'success' } as Awaited<ReturnType<ReviewsService['getLatestRun']>>
    vi.mocked(cache.getSyncRun).mockResolvedValue(run)

    const latest = await service.getLatestRun()

    expect(cache.getSyncRun).toHaveBeenCalledWith('sync:reviews:last_run')
    expect(latest).toEqual(run)
  })
})
