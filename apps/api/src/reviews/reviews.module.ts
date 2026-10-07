import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ReviewsController } from './reviews.controller'
import { ReviewsService } from './reviews.service'
import { GooglePlacesProvider } from './google-places.provider'
import { NoopReviewsProvider, REVIEWS_PROVIDER, type ReviewsProvider } from './reviews.provider'
import { CacheModule } from '../common/cache/cache.module'
import { DirectusModule } from '../directus/directus.module'

@Module({
  imports: [ConfigModule, CacheModule, DirectusModule],
  controllers: [ReviewsController],
  providers: [
    ReviewsService,
    GooglePlacesProvider,
    NoopReviewsProvider,
    {
      provide: REVIEWS_PROVIDER,
      // Activation = poser la clé : avec GOOGLE_API_KEY c'est le provider
      // Places qui tourne, sinon le no-op (mode dégradé — aucun code à
      // modifier pour activer).
      useFactory: (google: GooglePlacesProvider, noop: NoopReviewsProvider): ReviewsProvider =>
        google.enabled ? google : noop,
      inject: [GooglePlacesProvider, NoopReviewsProvider]
    }
  ]
})
export class ReviewsModule {}
