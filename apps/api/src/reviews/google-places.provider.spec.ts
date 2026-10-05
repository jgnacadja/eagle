import { Test, TestingModule } from '@nestjs/testing'
import { ConfigService } from '@nestjs/config'
import { GooglePlacesProvider } from './google-places.provider'

const placeResponse = {
  rating: 4.7,
  userRatingCount: 214,
  reviews: [
    {
      name: 'places/ChIJ_place/reviews/ChdDSUhNMG9n',
      rating: 5,
      text: { text: 'Équipe très réactive.', languageCode: 'fr' },
      authorAttribution: {
        displayName: 'Marie D.',
        photoUri: 'https://lh3.googleusercontent.com/a/photo'
      },
      publishTime: '2026-01-15T10:00:00Z'
    },
    {
      name: 'places/ChIJ_place/reviews/Ci9DQUlRQ',
      rating: 4,
      originalText: { text: 'Bonne formation.', languageCode: 'en' },
      authorAttribution: { displayName: 'Bob' }
    },
    {
      // Avis sans texte : ignoré (la collection `avis` exige un témoignage).
      name: 'places/ChIJ_place/reviews/notext',
      rating: 5
    },
    {
      // Sans `name` : pas de clé d'idempotence — ignoré.
      rating: 3,
      text: { text: 'Orphaned' }
    }
  ]
}

describe('GooglePlacesProvider', () => {
  let fetch: ReturnType<typeof vi.fn>

  async function build(apiKey?: string) {
    fetch = vi.fn()
    global.fetch = fetch
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GooglePlacesProvider,
        {
          provide: ConfigService,
          useValue: { get: (key: string) => (key === 'GOOGLE_API_KEY' ? apiKey : undefined) }
        }
      ]
    }).compile()
    return module.get<GooglePlacesProvider>(GooglePlacesProvider)
  }

  it('is disabled without GOOGLE_API_KEY (mode dégradé)', async () => {
    const provider = await build(undefined)

    expect(provider.enabled).toBe(false)
    await expect(provider.fetchPlaceReviews('ChIJ_place')).resolves.toBeNull()
    expect(fetch).not.toHaveBeenCalled()
  })

  it('fetches place details and maps the snapshot', async () => {
    const provider = await build('test-key')
    fetch.mockResolvedValue(new Response(JSON.stringify(placeResponse), { status: 200 }))

    const snapshot = await provider.fetchPlaceReviews('ChIJ_place')

    expect(snapshot).toEqual({
      rating: 4.7,
      reviewsCount: 214,
      reviews: [
        {
          googleReviewId: 'ChdDSUhNMG9n',
          author: 'Marie D.',
          avatar: 'https://lh3.googleusercontent.com/a/photo',
          stars: 5,
          quote: 'Équipe très réactive.',
          publishedAt: '2026-01-15T10:00:00Z'
        },
        {
          googleReviewId: 'Ci9DQUlRQ',
          author: 'Bob',
          avatar: null,
          stars: 4,
          quote: 'Bonne formation.',
          publishedAt: null
        }
      ]
    })

    const [url, init] = fetch.mock.calls[0]!
    expect(url).toContain('/places/ChIJ_place')
    expect(url).toContain('languageCode=fr')
    expect(init.headers['X-Goog-Api-Key']).toBe('test-key')
    expect(init.headers['X-Goog-FieldMask']).toBe('rating,userRatingCount,reviews')
  })

  it('degrades to null on HTTP error (snapshot conservé)', async () => {
    const provider = await build('test-key')
    fetch.mockResolvedValue(new Response('Forbidden', { status: 403 }))

    await expect(provider.fetchPlaceReviews('ChIJ_place')).resolves.toBeNull()
  })

  it('degrades to null on network failure after retries', async () => {
    const provider = await build('test-key')
    fetch.mockRejectedValue(new Error('network down'))

    await expect(provider.fetchPlaceReviews('ChIJ_place')).resolves.toBeNull()
    expect(fetch).toHaveBeenCalledTimes(3) // 1 + 2 retries
  })

  it('does not retry on 4xx', async () => {
    const provider = await build('test-key')
    fetch.mockResolvedValue(new Response('Not Found', { status: 404 }))

    await expect(provider.fetchPlaceReviews('ChIJ_place')).resolves.toBeNull()
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('returns null when the API reports an error body', async () => {
    const provider = await build('test-key')
    fetch.mockResolvedValue(
      new Response(JSON.stringify({ error: { code: 400, status: 'INVALID_ARGUMENT' } }), {
        status: 200
      })
    )

    await expect(provider.fetchPlaceReviews('ChIJ_place')).resolves.toBeNull()
  })
})
