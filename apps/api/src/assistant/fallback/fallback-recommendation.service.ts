import { Injectable, Logger } from '@nestjs/common'
import type { AssistantAnswer, AssistantOutcome, AssistantRecommendation } from '@learnup/types'
import { RetrievalService } from '../../retrieval/retrieval.service'
import type { RetrievalCandidate, RetrievalResult } from '../../retrieval/retrieval.types'
import { SearchMissesService } from '../../search-misses/search-misses.service'
import { attributesOf, availabilityOf } from '../guardrails/recommendation.grounding'
import {
  ASSISTANT_NOTICE,
  MAX_ALTERNATIVES,
  SOURCE_MENTION,
  applyWordingGuardrails
} from '../guardrails/wording.guardrails'

export interface FallbackQuery {
  text: string
  location?: string
}

// Seuils du repli déterministe : aucun signal (pas un terme retrouvé,
// similarité négligeable) → hors catalogue (§18) ; signal trop faible
// (couverture minoritaire des termes saisis, similarité basse) → aucun
// résultat suffisamment pertinent (§16-17) ; sinon recommandations.
const NO_SIGNAL_SEMANTIC = 0.3
const WEAK_COVERAGE = 0.5
const WEAK_SEMANTIC = 0.45
const ALTERNATIVE_MIN_SCORE = 0.4
const CANDIDATES = 5

function quote(terms: string[]): string {
  return terms.map((term) => `« ${term} »`).join(', ')
}

function principalJustification(candidate: RetrievalCandidate): string {
  const terms = candidate.matchedTerms.slice(0, 3)
  if (terms.length === 0) {
    return 'Cette formation semble correspondre à votre besoin : son intitulé et son programme sont proches des termes de votre demande.'
  }
  return `Cette formation semble correspondre à votre besoin : elle reprend ${quote(terms)} dans son intitulé ou son programme.`
}

function alternativeJustification(candidate: RetrievalCandidate): string {
  const category = candidate.course.category
  const terms = candidate.matchedTerms.slice(0, 2)
  const reason = terms.length ? `elle reprend ${quote(terms)}` : 'elle relève du même domaine'
  return category
    ? `Semble pertinente si votre besoin porte plutôt sur ${category.toLowerCase()} : ${reason}.`
    : `Semble pertinente en alternative : ${reason}.`
}

function toRecommendation(
  candidate: RetrievalCandidate,
  justification: string,
  now: Date
): AssistantRecommendation {
  const { course } = candidate
  return {
    course: { title: course.title, slug: course.slug, familySlug: course.familySlug },
    justification,
    attributes: attributesOf(course),
    availability: availabilityOf(course, now)
  }
}

function hasSignal(candidate: RetrievalCandidate): boolean {
  return candidate.matchedTerms.length > 0 || candidate.semanticScore >= NO_SIGNAL_SEMANTIC
}

function isWeak(candidate: RetrievalCandidate): boolean {
  return candidate.coverage < WEAK_COVERAGE && candidate.semanticScore < WEAK_SEMANTIC
}

/**
 * Mode dégradé / repli déterministe : quand l'API IA est indisponible, une
 * recherche catalogue (retrieval hybride, sans Claude) renvoie des
 * formations pertinentes dans le même contrat que l'IA — justifications au
 * conditionnel, source citée, disponibilités issues du référentiel.
 */
@Injectable()
export class FallbackRecommendationService {
  private readonly logger = new Logger(FallbackRecommendationService.name)

  constructor(
    private readonly retrieval: RetrievalService,
    private readonly searchMisses: SearchMissesService
  ) {}

  async recommend(query: FallbackQuery, now = new Date()): Promise<AssistantAnswer> {
    const result = await this.retrieval.search({
      text: query.text,
      location: query.location,
      limit: CANDIDATES
    })
    const intent = result.terms.join(' ') || null
    const outcome = this.toOutcome(result, now)

    if (outcome.kind === 'no-result' || outcome.kind === 'out-of-catalog') {
      // Fire-and-forget : la journalisation n'échoue jamais et ne retarde pas la réponse.
      void this.searchMisses.record({
        query: query.text,
        outcome: outcome.kind === 'no-result' ? 'no_result' : 'out_of_catalog',
        source: 'assistant',
        intent,
        context: { mode: 'fallback', location: query.location ?? null }
      })
    }

    return { outcome, mode: 'fallback', notice: ASSISTANT_NOTICE, intent }
  }

  private toOutcome(result: RetrievalResult, now: Date): AssistantOutcome {
    const [best, ...rest] = result.candidates
    if (!best || !hasSignal(best)) return { kind: 'out-of-catalog' }
    if (isWeak(best)) return { kind: 'no-result' }

    const alternatives = rest
      .filter((candidate) => candidate.score >= ALTERNATIVE_MIN_SCORE)
      .slice(0, MAX_ALTERNATIVES)
      .map((candidate) => toRecommendation(candidate, alternativeJustification(candidate), now))

    const { set, issues } = applyWordingGuardrails({
      principal: toRecommendation(best, principalJustification(best), now),
      alternatives,
      source: SOURCE_MENTION
    })
    if (issues.length) {
      this.logger.warn(`Fallback wording adjusted: ${issues.join(', ')}`)
    }
    return { kind: 'recommendations', recommendations: set }
  }
}
