import { Injectable } from '@nestjs/common'

/**
 * Snapshot d'une fiche Google Places : agrégat (note globale + volume) et
 * les ≤5 avis remontés par Place Details.
 */
export interface PlaceReviewSnapshot {
  /** Dernier segment du `name` de la review (`places/{id}/reviews/{id}`). */
  googleReviewId: string
  author: string
  avatar: string | null
  stars: number
  quote: string
  publishedAt: string | null
}

export interface PlaceReviewsSnapshot {
  rating: number | null
  reviewsCount: number | null
  reviews: PlaceReviewSnapshot[]
}

/**
 * Source des avis Google. `enabled=false` = mode dégradé du ticket parent :
 * le job de synchro est un no-op et le dernier snapshot Directus est
 * conservé (aucune erreur).
 */
export interface ReviewsProvider {
  readonly enabled: boolean
  /** `null` = rien à écrire (provider inactif ou appel en échec). */
  fetchPlaceReviews(placeId: string): Promise<PlaceReviewsSnapshot | null>
}

export const REVIEWS_PROVIDER = Symbol('REVIEWS_PROVIDER')

/** Provider no-op injecté tant que GOOGLE_API_KEY n'est pas renseignée. */
@Injectable()
export class NoopReviewsProvider implements ReviewsProvider {
  readonly enabled = false

  fetchPlaceReviews(): Promise<PlaceReviewsSnapshot | null> {
    return Promise.resolve(null)
  }
}
