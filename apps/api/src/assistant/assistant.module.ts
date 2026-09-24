import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { RetrievalModule } from '../retrieval/retrieval.module'
import { SearchMissesModule } from '../search-misses/search-misses.module'
import { AssistantController } from './assistant.controller'
import { DegradedModeService } from './degraded-mode.service'
import { FallbackRecommendationService } from './fallback/fallback-recommendation.service'

@Module({
  imports: [ConfigModule, RetrievalModule, SearchMissesModule],
  controllers: [AssistantController],
  providers: [FallbackRecommendationService, DegradedModeService],
  exports: [FallbackRecommendationService, DegradedModeService]
})
export class AssistantModule {}
