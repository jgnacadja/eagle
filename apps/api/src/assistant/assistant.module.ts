import { Module } from '@nestjs/common'
import { CatalogModule } from '../catalog/catalog.module'
import { RetrievalModule } from '../retrieval/retrieval.module'
import { SearchMissesModule } from '../search-misses/search-misses.module'
import { AssistantController } from './assistant.controller'
import { AssistantModelClient } from './assistant.client'
import { AssistantService } from './assistant.service'
import { DegradedModeService } from './degraded-mode.service'
import { FallbackRecommendationService } from './fallback/fallback-recommendation.service'

@Module({
  imports: [CatalogModule, RetrievalModule, SearchMissesModule],
  controllers: [AssistantController],
  providers: [
    AssistantService,
    AssistantModelClient,
    FallbackRecommendationService,
    DegradedModeService
  ]
})
export class AssistantModule {}
