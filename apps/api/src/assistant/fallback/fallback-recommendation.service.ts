import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common'
import type { AssistantReply, AssistantRequest } from '@learnup/types'
import { CatalogService, type CatalogRow } from '../../catalog/catalog.service'
import { stemToken, tokenize } from '../../common/utils/text.util'
import { RetrievalService, analyzeQuery, type QueryTerm } from '../../retrieval/retrieval.service'
import type { RetrievalCandidate } from '../../retrieval/retrieval.types'
import { toRecommendation } from '../assistant.service'
import { MAX_ALTERNATIVES } from '../guardrails/wording.guardrails'

// Seuils du repli déterministe : aucun signal (pas un terme retrouvé,
// similarité négligeable) → hors catalogue (§18) ; signal trop faible
// (couverture minoritaire des termes saisis, similarité basse) → aucun
// résultat suffisamment pertinent (§16-17) ; sinon recommandations.
const NO_SIGNAL_SEMANTIC = 0.3
const WEAK_COVERAGE = 0.5
const WEAK_SEMANTIC = 0.45
const ALTERNATIVE_MIN_SCORE = 0.4
const CANDIDATES = 5

// Le besoin s'agrège sur la conversation : la réponse à une question de
// clarification (« présentiel », « 8 personnes ») n'a de sens qu'avec les
// derniers tours du visiteur.
const HISTORY_USER_TURNS = 2
const MAX_NEED_LENGTH = 1000

// Wording exact de la spec (§13, §17, §18).
const RECOMMEND_TEXT = 'Nous vous recommandons'
const NO_RESULTS_TEXT =
  "Nous n'avons pas identifié de formation correspondant exactement à votre besoin."
const OUT_OF_CATALOG_TEXT =
  'Ce besoin ne correspond pas aux formations actuellement proposées dans le catalogue LEARN UP. Nous ne vous proposons pas de formation approchante pour ne pas vous orienter à tort.'

const WORD = /[\p{L}\p{N}]+/gu

interface Need {
  text: string
  terms: QueryTerm[]
}

interface Match {
  candidate: RetrievalCandidate
  row: CatalogRow
}

/** Besoin exprimé : derniers tours du visiteur + message courant. */
export function needText(request: AssistantRequest): string {
  const turns = (request.history ?? [])
    .filter((message) => message.role === 'user')
    .map((message) => message.content)
    .slice(-HISTORY_USER_TURNS)
  return [...turns, request.message].join(' ').trim().slice(-MAX_NEED_LENGTH)
}

/**
 * Mots du besoin, tels que saisis, que la formation couvre — directement ou
 * par une expansion métier (« managers » → management). Jamais les termes
 * racinisés de l'index, illisibles pour le visiteur.
 */
function coveredWords(need: Need, candidate: RetrievalCandidate, max: number): string[] {
  const matched = new Set(candidate.matchedTerms)
  const covered = new Set(
    need.terms.filter((term) => matched.has(term.term)).map((term) => term.source)
  )
  const words = new Map<string, string>()
  for (const [word] of need.text.matchAll(WORD)) {
    const [token] = tokenize(word)
    if (token && covered.has(stemToken(token)) && !words.has(token)) words.set(token, word)
  }
  return [...words.values()].slice(0, max)
}

function quote(words: string[]): string {
  return words.map((word) => `« ${word} »`).join(', ')
}

function principalJustification(need: Need, candidate: RetrievalCandidate): string {
  const words = coveredWords(need, candidate, 3)
  if (words.length === 0) {
    return 'Cette formation semble correspondre à votre besoin : son intitulé et son programme sont proches des termes de votre demande.'
  }
  return `Cette formation semble correspondre à votre besoin : elle couvre ${quote(words)} dans son intitulé ou son programme.`
}

function alternativeJustification(need: Need, candidate: RetrievalCandidate): string {
  const category = candidate.course.category
  const words = coveredWords(need, candidate, 2)
  const reason = words.length ? `elle couvre ${quote(words)}` : 'elle relève du même domaine'
  return category
    ? `Semble pertinente si votre besoin porte plutôt sur ${category.toLowerCase()} : ${reason}.`
    : `Semble pertinente en alternative : ${reason}.`
}

function hasSignal(candidate: RetrievalCandidate): boolean {
  return candidate.matchedTerms.length > 0 || candidate.semanticScore >= NO_SIGNAL_SEMANTIC
}

function isWeak(candidate: RetrievalCandidate): boolean {
  return candidate.coverage < WEAK_COVERAGE && candidate.semanticScore < WEAK_SEMANTIC
}

function isUsable(match: Match | undefined): match is Match {
  return !!match && hasSignal(match.candidate) && !isWeak(match.candidate)
}

function toReply(matches: Match[], need: Need, location: string | undefined): AssistantReply {
  const [best, ...rest] = matches
  if (!best || !hasSignal(best.candidate)) {
    return { kind: 'out_of_catalog', text: OUT_OF_CATALOG_TEXT }
  }
  if (isWeak(best.candidate)) return { kind: 'no_results', text: NO_RESULTS_TEXT }

  const alternatives = rest
    .filter(({ candidate }) => candidate.score >= ALTERNATIVE_MIN_SCORE)
    .slice(0, MAX_ALTERNATIVES)

  return {
    kind: 'recommend',
    text: RECOMMEND_TEXT,
    recommendations: [
      toRecommendation(best.row, 'primary', principalJustification(need, best.candidate), location),
      ...alternatives.map(({ candidate, row }) =>
        toRecommendation(row, 'alternative', alternativeJustification(need, candidate), location)
      )
    ]
  }
}

/**
 * Mode dégradé / repli déterministe : quand l'API IA est indisponible, une
 * recherche catalogue (retrieval hybride, sans modèle) renvoie des
 * formations pertinentes dans le même contrat que l'IA — justifications au
 * conditionnel, disponibilités issues du référentiel.
 */
@Injectable()
export class FallbackRecommendationService {
  private readonly logger = new Logger(FallbackRecommendationService.name)

  constructor(
    private readonly catalog: CatalogService,
    private readonly retrieval: RetrievalService
  ) {}

  async recommend(request: AssistantRequest): Promise<AssistantReply> {
    try {
      const reply = await this.answer(request)
      if (reply) return reply
    } catch (error) {
      this.logger.warn({ error }, 'Deterministic fallback failed')
    }
    // Catalogue vide ou inaccessible : aucun repli possible, même déterministe.
    throw new ServiceUnavailableException('assistant unavailable')
  }

  private async answer(request: AssistantRequest): Promise<AssistantReply | null> {
    const rows = await this.catalog.allCourses()
    if (rows.length === 0) return null

    // Fiche d'origine : le visiteur cherche une alternative, jamais la même.
    const origin = request.context?.formationSlug
    const bySlug = new Map(
      rows.filter((row) => row.course.slug !== origin).map((row) => [row.course.slug, row])
    )
    const text = needText(request)
    const location = request.context?.location

    // Les formations proposées près du lieu transmis priment ; sans candidat
    // solide sur place, la recherche porte sur tout le catalogue — le lieu
    // ne sert alors qu'à choisir la session affichée.
    const nearby = location ? await this.search(bySlug, text, location) : []
    const matches = isUsable(nearby[0]) ? nearby : await this.search(bySlug, text)

    return toReply(matches, { text, terms: analyzeQuery(text) }, location)
  }

  private async search(
    bySlug: ReadonlyMap<string, CatalogRow>,
    text: string,
    location?: string
  ): Promise<Match[]> {
    const { candidates } = await this.retrieval.search({ text, location, limit: CANDIDATES })

    // L'index peut retarder sur le catalogue : un candidat sans row publiée est écarté.
    return candidates.flatMap((candidate) => {
      const row = bySlug.get(candidate.course.slug)
      return row ? [{ candidate, row }] : []
    })
  }
}
