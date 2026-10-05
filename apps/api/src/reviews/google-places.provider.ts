import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import type { PlaceReviewsSnapshot, PlaceReviewSnapshot, ReviewsProvider } from './reviews.provider'

// Sous-ensemble de la réponse Place Details (Places API New) — seuls les
// champs demandés par le field mask sont typés.
interface PlacesReview {
  name?: string
  rating?: number
  text?: { text?: string; languageCode?: string }
  originalText?: { text?: string; languageCode?: string }
  authorAttribution?: { displayName?: string; photoUri?: string }
  publishTime?: string
}

interface PlaceDetailsResponse {
  rating?: number
  userRatingCount?: number
  reviews?: PlacesReview[]
  error?: { code?: number; message?: string; status?: string }
}

interface FetchLikeResponse {
  ok: boolean
  status: number
  json(): Promise<unknown>
  text(): Promise<string>
}

const FIELD_MASK = 'rating,userRatingCount,reviews'
// Place Details ne remonte que 5 avis au plus — borne de sécurité.
const MAX_REVIEWS = 5

/**
 * Places API (New) : `GET /v1/places/{placeId}` avec clé en header.
 * Toute erreur (réseau, quota, 4xx/5xx) dégrade en `null` — le run de synchro
 * conserve alors le dernier snapshot au lieu d'échouer.
 */
@Injectable()
export class GooglePlacesProvider implements ReviewsProvider {
  private readonly logger = new Logger(GooglePlacesProvider.name)
  private readonly apiKey: string
  private readonly baseUrl: string
  private readonly timeoutMs = 10_000
  private readonly maxRetries = 2

  constructor(config: ConfigService) {
    this.apiKey = config.get<string>('GOOGLE_API_KEY') ?? ''
    this.baseUrl = config.get<string>('GOOGLE_PLACES_API_URL') ?? 'https://places.googleapis.com/v1'
    if (!this.enabled) {
      this.logger.log('GOOGLE_API_KEY absente — synchro des avis en mode dégradé (no-op)')
    }
  }

  get enabled(): boolean {
    return Boolean(this.apiKey)
  }

  async fetchPlaceReviews(placeId: string): Promise<PlaceReviewsSnapshot | null> {
    if (!this.enabled) return null

    try {
      const url = new URL(`${this.baseUrl}/places/${encodeURIComponent(placeId)}`)
      url.searchParams.set('languageCode', 'fr')
      const body = await this.request<PlaceDetailsResponse>(url.toString())

      if (body.error) {
        this.logger.warn({ placeId, error: body.error }, 'Places API error — snapshot conservé')
        return null
      }

      return {
        rating: typeof body.rating === 'number' ? body.rating : null,
        reviewsCount: typeof body.userRatingCount === 'number' ? body.userRatingCount : null,
        reviews: (body.reviews ?? [])
          .slice(0, MAX_REVIEWS)
          .map((review) => this.mapReview(review))
          .filter((review): review is PlaceReviewSnapshot => review !== null)
      }
    } catch (error) {
      this.logger.warn({ error, placeId }, 'Places fetch failed — snapshot conservé')
      return null
    }
  }

  private mapReview(review: PlacesReview): PlaceReviewSnapshot | null {
    const quote = review.text?.text?.trim() || review.originalText?.text?.trim()
    const googleReviewId = review.name?.split('/').pop()?.trim()
    if (!quote || !googleReviewId) return null

    return {
      googleReviewId,
      author: review.authorAttribution?.displayName?.trim() || 'Utilisateur Google',
      avatar: review.authorAttribution?.photoUri ?? null,
      stars: Math.min(5, Math.max(0, Math.round(review.rating ?? 0))),
      quote,
      publishedAt: review.publishTime ?? null
    }
  }

  private async request<T>(url: string, attempt = 0): Promise<T> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs)

    try {
      const response = (await fetch(url, {
        headers: {
          'X-Goog-Api-Key': this.apiKey,
          'X-Goog-FieldMask': FIELD_MASK
        },
        signal: controller.signal
      })) as unknown as FetchLikeResponse

      if (!response.ok) {
        const text = await response.text()
        throw new PlacesRequestError(
          `Places GET ${url} failed: ${response.status} ${text}`,
          response.status
        )
      }

      return (await response.json()) as T
    } catch (error) {
      // Rejouables : erreurs réseau/timeout (non HTTP) et 5xx/429 — un 4xx
      // (clé invalide, place_id inconnu) ne serait pas corrigé par un retry.
      const retryable =
        !(error instanceof PlacesRequestError) || error.status >= 500 || error.status === 429

      if (attempt >= this.maxRetries || !retryable) {
        throw error
      }

      const delay = 2 ** attempt * 100
      this.logger.warn(`Places request retry ${attempt + 1} after ${delay}ms`)
      await new Promise((resolve) => setTimeout(resolve, delay))
      return this.request<T>(url, attempt + 1)
    } finally {
      clearTimeout(timeout)
    }
  }
}

/** Transporte le statut HTTP pour distinguer 5xx (rejouables) des 4xx. */
class PlacesRequestError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message)
    this.name = 'PlacesRequestError'
  }
}
