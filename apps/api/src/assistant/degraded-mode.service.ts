import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import type { AssistantAnswer } from '@learnup/types'
import {
  FallbackRecommendationService,
  type FallbackQuery
} from './fallback/fallback-recommendation.service'

const DEFAULT_AI_TIMEOUT_MS = 12_000

export class AiUnavailableError extends Error {
  constructor(message = 'AI provider unavailable') {
    super(message)
    this.name = 'AiUnavailableError'
  }
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new AiUnavailableError(`AI timeout after ${timeoutMs}ms`)),
      timeoutMs
    )
    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (error: unknown) => {
        clearTimeout(timer)
        reject(error instanceof Error ? error : new Error(String(error)))
      }
    )
  })
}

/**
 * Bascule automatique sur la recherche déterministe quand l'orchestration
 * IA (BACKEND-A) échoue, expire ou est désactivée : le visiteur obtient
 * toujours des formations du catalogue. L'orchestrateur passe sa tentative
 * IA en `attempt` — sans tentative (clé absente), le repli répond seul.
 */
@Injectable()
export class DegradedModeService {
  private readonly logger = new Logger(DegradedModeService.name)
  private readonly aiTimeoutMs: number

  constructor(
    config: ConfigService,
    private readonly fallback: FallbackRecommendationService
  ) {
    const raw = Number.parseInt(config.get<string>('ASSISTANT_AI_TIMEOUT_MS') ?? '', 10)
    this.aiTimeoutMs = Number.isNaN(raw) || raw <= 0 ? DEFAULT_AI_TIMEOUT_MS : raw
  }

  async answer(
    query: FallbackQuery,
    attempt?: () => Promise<AssistantAnswer>
  ): Promise<AssistantAnswer> {
    if (!attempt) return this.fallback.recommend(query)

    try {
      return await withTimeout(attempt(), this.aiTimeoutMs)
    } catch (error) {
      this.logger.warn(
        { error },
        'AI orchestration unavailable — answering with the deterministic fallback'
      )
      return this.fallback.recommend(query)
    }
  }
}
