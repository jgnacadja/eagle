import { describe, expect, it } from 'vitest'
import { mapPlaceReview } from './reviews.mapper'
import type { PlaceReviewSnapshot } from './reviews.provider'

const review: PlaceReviewSnapshot = {
  googleReviewId: 'ChdDSUhNMG9n',
  author: 'Marie D.',
  avatar: 'https://lh3.googleusercontent.com/a/photo',
  stars: 5,
  quote: 'Équipe très réactive.',
  publishedAt: '2026-01-15T10:00:00Z'
}

describe('mapPlaceReview', () => {
  it('mappe un avis Google vers la collection avis', () => {
    expect(mapPlaceReview({ id: 7, slug: 'creteil' }, review)).toEqual({
      slug: 'google-creteil-ChdDSUhNMG9n',
      author: 'Marie D.',
      published_at: '2026-01-15T10:00:00Z',
      stars: 5,
      quote: 'Équipe très réactive.',
      source: 'google',
      avatar: 'https://lh3.googleusercontent.com/a/photo',
      google_review_id: 'ChdDSUhNMG9n',
      centre: 7
    })
  })

  it('préfixe le slug du centre (lisibilité admin + unicité inter-centres)', () => {
    const mapped = mapPlaceReview({ id: 8, slug: 'vitry' }, review)
    expect(mapped.slug).toBe('google-vitry-ChdDSUhNMG9n')
    expect(mapped.centre).toBe(8)
  })
})
