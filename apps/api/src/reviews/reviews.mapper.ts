import type { PlaceReviewSnapshot } from './reviews.provider'

/**
 * Corps d'écriture Directus `avis` pour un avis Google. `status` est géré à
 * part : posé à la création (`published`), jamais réécrit ensuite — un avis
 * archivé par un modérateur ne doit pas repasser en ligne au run suivant.
 */
export interface GoogleAvisPayload {
  slug: string
  author: string
  published_at: string | null
  stars: number
  quote: string
  source: 'google'
  avatar: string | null
  google_review_id: string
  /** `null` = avis marque (fiche Google LEARN UP — `GOOGLE_LEARNUP_PLACE_ID`). */
  centre: number | null
}

/**
 * Mappe un avis Places vers la collection `avis`. Le slug embarque le slug
 * du centre : les ids Google sont propres à la fiche, et le préfixe reste
 * lisible dans l'admin (`google-creteil-…`). `centre` null = avis de la
 * fiche marque (`google-marque-…`) : affichés sur la home et toutes les
 * fiches centres.
 */
export function mapPlaceReview(
  centre: { id: number; slug: string } | null,
  review: PlaceReviewSnapshot
): GoogleAvisPayload {
  return {
    slug: `google-${centre?.slug ?? 'marque'}-${review.googleReviewId}`,
    author: review.author,
    published_at: review.publishedAt,
    stars: review.stars,
    quote: review.quote,
    source: 'google',
    avatar: review.avatar,
    google_review_id: review.googleReviewId,
    centre: centre?.id ?? null
  }
}
