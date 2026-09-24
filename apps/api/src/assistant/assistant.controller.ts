import { Controller, Get, Query } from '@nestjs/common'
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import type { AssistantAnswer } from '@learnup/types'
import { FallbackQueryDto } from './assistant.dto'
import { FallbackRecommendationService } from './fallback/fallback-recommendation.service'

/**
 * Mode dégradé du moteur IA : recherche déterministe sur le catalogue
 * publié, sans appel Claude. L'endpoint conversationnel `/assistant`
 * (streaming, orchestration Anthropic) est porté par BACKEND-A et bascule
 * sur ce repli quand l'API IA est indisponible (`DegradedModeService`).
 */
@ApiTags('Assistant')
@Controller('assistant')
export class AssistantController {
  constructor(private readonly fallback: FallbackRecommendationService) {}

  @Get('fallback')
  @ApiOperation({ summary: 'Deterministic catalogue recommendation (degraded mode, no AI)' })
  @ApiOkResponse({ description: 'Recommendations, no-result or out-of-catalog outcome' })
  recommend(@Query() query: FallbackQueryDto): Promise<AssistantAnswer> {
    return this.fallback.recommend({ text: query.q, location: query.location })
  }
}
