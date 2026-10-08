import { randomUUID } from 'node:crypto'
import { Inject, Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { waitUntil } from '@vercel/functions'
import { CacheService, type SyncRun } from '../common/cache/cache.service'
import { DirectusCatalogService } from '../directus/directus.catalog.service'
import { REVIEWS_PROVIDER, type ReviewsProvider } from './reviews.provider'
import { mapPlaceReview } from './reviews.mapper'

const REVIEWS_LOCK_KEY = 'sync:reviews:lock'
const REVIEWS_RUN_KEY = 'sync:reviews:last_run'
// TTL du verrou : borne la durée max d'un run (N centres × 1 appel Places).
const REVIEWS_LOCK_TTL_MS = 10 * 60 * 1000

/**
 * Synchro des avis Google Places → Directus. Même planification externe que
 * la sync catalogue : POST /admin/sync-reviews (workflow GitHub), le run
 * part en tâche de fond (`waitUntil`) — pas de cron in-process.
 *
 * Cibles : `GOOGLE_LEARNUP_PLACE_ID` (fiche marque → avis `centre = null`)
 * puis chaque centre portant un `google_place_id`.
 *
 * Mode dégradé : sans `GOOGLE_API_KEY` (ou avec un provider en échec), le
 * run est un no-op en `success` — le dernier snapshot Directus est conservé
 * et rien n'est écrit.
 */
@Injectable()
export class ReviewsService {
  private readonly logger = new Logger(ReviewsService.name)
  private running = false

  constructor(
    private readonly cache: CacheService,
    private readonly catalog: DirectusCatalogService,
    private readonly config: ConfigService,
    @Inject(REVIEWS_PROVIDER) private readonly provider: ReviewsProvider
  ) {}

  // Renvoie true si le run démarre, false si un run est déjà en cours
  // (local ou sur une autre instance via le verrou Redis).
  async trigger(): Promise<boolean> {
    if (this.running) {
      this.logger.warn('Reviews sync already in progress, skipping')
      return false
    }
    this.running = true

    const token = randomUUID()
    if (!(await this.cache.acquireSyncLock(token, REVIEWS_LOCK_TTL_MS, REVIEWS_LOCK_KEY))) {
      this.running = false
      this.logger.warn('Reviews sync already running on another instance, skipping')
      return false
    }

    const tracked = this.execute()
      .catch((error) => {
        this.logger.error(error, 'Reviews sync failed')
      })
      .finally(async () => {
        await this.cache.releaseSyncLock(token, REVIEWS_LOCK_KEY)
        this.running = false
      })

    waitUntil(tracked)

    return true
  }

  private async execute(): Promise<void> {
    const run: SyncRun = {
      status: 'running',
      startedAt: new Date().toISOString(),
      finishedAt: null,
      inserted: 0,
      updated: 0,
      failed: 0,
      error: null
    }

    await this.cache.setSyncRun(run, REVIEWS_RUN_KEY)

    try {
      if (!this.provider.enabled) {
        this.logger.log('Reviews sync skipped — aucun provider actif (GOOGLE_API_KEY absente)')
        run.status = 'success'
        run.finishedAt = new Date().toISOString()
        return
      }

      const centres = await this.catalog.fetchCentresForReviews()

      // Cibles Places : la fiche marque en premier (GOOGLE_LEARNUP_PLACE_ID —
      // avis `centre = null`, affichés sur la home), puis chaque centre
      // portant un google_place_id.
      const targets: { placeId: string; centre: { id: number; slug: string } | null }[] = []
      const brandPlaceId = this.config.get<string>('GOOGLE_LEARNUP_PLACE_ID')?.trim()
      if (brandPlaceId) targets.push({ placeId: brandPlaceId, centre: null })
      for (const centre of centres) {
        if (centre.google_place_id) targets.push({ placeId: centre.google_place_id, centre })
      }

      for (const target of targets) {
        try {
          const snapshot = await this.provider.fetchPlaceReviews(target.placeId)
          // null = provider en échec sur cette fiche : on conserve les
          // données existantes (jamais d'effacement) et on continue.
          if (!snapshot) {
            run.failed += 1
            continue
          }

          const payloads = snapshot.reviews.map((review) => mapPlaceReview(target.centre, review))
          const result = await this.catalog.upsertGoogleAvis(payloads)
          if (target.centre) {
            await this.catalog.updateCentreGoogleAggregate(target.centre.id, {
              google_rating: snapshot.rating,
              google_reviews_count: snapshot.reviewsCount
            })
          }

          run.inserted += result.inserted
          run.updated += result.updated
        } catch (error) {
          run.failed += 1
          this.logger.warn(
            { error, target: target.centre?.slug ?? 'marque' },
            'Reviews sync failed — snapshot conservé'
          )
        }
      }

      run.status = 'success'
      run.finishedAt = new Date().toISOString()
      this.logger.log(
        `Reviews sync finished: ${JSON.stringify({ inserted: run.inserted, updated: run.updated, failed: run.failed })}`
      )
    } catch (error) {
      run.status = 'failed'
      run.finishedAt = new Date().toISOString()
      run.error = error instanceof Error ? error.message : 'Unknown error'
      throw error
    } finally {
      await this.cache.setSyncRun(run, REVIEWS_RUN_KEY)
    }
  }

  async getLatestRun(): Promise<SyncRun | null> {
    return this.cache.getSyncRun(REVIEWS_RUN_KEY)
  }
}
