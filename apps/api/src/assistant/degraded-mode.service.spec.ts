import { ConfigService } from '@nestjs/config'
import type { AssistantAnswer } from '@learnup/types'
import { AiUnavailableError, DegradedModeService } from './degraded-mode.service'
import { FallbackRecommendationService } from './fallback/fallback-recommendation.service'

const AI_ANSWER: AssistantAnswer = {
  outcome: { kind: 'clarification', clarification: { question: 'Pour qui ?', options: [] } },
  mode: 'ai',
  notice: 'n',
  intent: 'sst'
}
const FALLBACK_ANSWER: AssistantAnswer = {
  outcome: { kind: 'no-result' },
  mode: 'fallback',
  notice: 'n',
  intent: null
}

function makeService(env: Record<string, string> = {}) {
  const fallback = { recommend: vi.fn().mockResolvedValue(FALLBACK_ANSWER) }
  const config = { get: (key: string) => env[key] } as unknown as ConfigService
  const service = new DegradedModeService(
    config,
    fallback as unknown as FallbackRecommendationService
  )
  return { service, fallback }
}

describe('DegradedModeService', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns the AI answer when the orchestration succeeds', async () => {
    const { service, fallback } = makeService()

    const answer = await service.answer({ text: 'sst' }, async () => AI_ANSWER)

    expect(answer).toBe(AI_ANSWER)
    expect(fallback.recommend).not.toHaveBeenCalled()
  })

  it('falls back when the AI provider is unavailable (simulated outage)', async () => {
    const { service, fallback } = makeService()

    const answer = await service.answer({ text: 'sst', location: 'Lyon' }, async () => {
      throw new AiUnavailableError('anthropic 503')
    })

    expect(answer).toBe(FALLBACK_ANSWER)
    expect(fallback.recommend).toHaveBeenCalledWith({ text: 'sst', location: 'Lyon' })
  })

  it('falls back when the AI attempt exceeds the timeout', async () => {
    vi.useFakeTimers()
    const { service, fallback } = makeService({ ASSISTANT_AI_TIMEOUT_MS: '1000' })

    const pending = service.answer({ text: 'sst' }, () => new Promise(() => undefined))
    await vi.advanceTimersByTimeAsync(1001)

    await expect(pending).resolves.toBe(FALLBACK_ANSWER)
    expect(fallback.recommend).toHaveBeenCalledOnce()
  })

  it('answers with the fallback alone when no AI attempt is provided (no key)', async () => {
    const { service, fallback } = makeService({ ASSISTANT_AI_TIMEOUT_MS: 'abc' })

    await expect(service.answer({ text: 'sst' })).resolves.toBe(FALLBACK_ANSWER)
    expect(fallback.recommend).toHaveBeenCalledWith({ text: 'sst' })
  })

  it('wraps non-Error rejections and still falls back', async () => {
    const { service } = makeService()

    await expect(service.answer({ text: 'sst' }, () => Promise.reject('boom'))).resolves.toBe(
      FALLBACK_ANSWER
    )
  })
})
