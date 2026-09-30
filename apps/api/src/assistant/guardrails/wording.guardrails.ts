import type { AssistantRecommendation, AssistantReply } from '@learnup/types'

/** Mention de source affichée sous les recommandations (RG-IA-01). */
export const SOURCE_MENTION =
  'Recommandations issues des formations publiées du catalogue LEARN UP.'

/** Transparence : le visiteur dialogue avec un assistant automatisé. */
export const ASSISTANT_NOTICE =
  'Réponses générées par un assistant automatisé à partir du catalogue publié LEARN UP — un conseiller reste disponible pour valider votre choix.'

export const MAX_ALTERNATIVES = 2
const MAX_SENTENCES = 2

export type GuardrailIssue =
  | 'assertive-wording'
  | 'regulatory-promise'
  | 'too-long'
  | 'missing-justification'
  | 'duplicate-course'
  | 'too-many-alternatives'

/** Justification de secours quand le modèle n'en fournit aucune. */
export const FALLBACK_JUSTIFICATION =
  'Cette formation semble correspondre aux termes de votre demande, à confirmer avec un conseiller.'

const CONDITIONAL_MARKERS =
  /\b(semble|semblent|devrait|devraient|devriez|pourrait|pourraient|pourriez|parait|paraît|serait|seraient|peut|peuvent)\b/i

// Formulations assertives (§14) → équivalent au conditionnel.
const ASSERTIVE_REWRITES: Array<[RegExp, string]> = [
  [
    /\bc['’]est (la|une) formation (qu['’]il vous faut|idéale|parfaite)\b[^.!?]*/gi,
    'cette formation semble correspondre à votre besoin'
  ],
  [
    /\b(est|sera)\s+(parfaitement\s+|exactement\s+|tout à fait\s+|idéalement\s+)?(adaptée?|idéale?|faite?|parfaite?|pertinente?|indiquée?|recommandée?)\b/gi,
    'semble $3'
  ],
  [/\b(répond|répondra|répondent)\b/gi, 'semble répondre'],
  [/\b(correspond|correspondra|correspondent)\b/gi, 'semble correspondre'],
  [/\b(couvre|couvrira|couvrent)\b/gi, 'semble couvrir'],
  [/\bvous permettra\b/gi, 'devrait vous permettre'],
  [/\bvous permettront\b/gi, 'devraient vous permettre']
]

// Promesses d'exactitude réglementaire ou de résultat : jamais (§14, RG-IA-01).
const REGULATORY_REWRITES: Array<[RegExp, string]> = [
  [/\bvous garantit\b/gi, 'vise à vous apporter'],
  [/\b(garantit|garantissent)\b/gi, 'vise'],
  [/\b(une )?garantie\b/gi, 'un objectif'],
  [
    /\bvous serez (certifiée?s?|habilitée?s?|en règle|conformes?)\b/gi,
    'vous pourrez viser la certification'
  ],
  [
    /\bassure (la |votre )?conformité\b/gi,
    "s'inscrit dans le cadre réglementaire, à vérifier selon votre situation"
  ],
  [
    /\bconforme à la (réglementation|loi|législation)\b/gi,
    'inscrite dans le cadre réglementaire, à vérifier selon votre situation'
  ],
  [/\bcertification (assurée|garantie)\b/gi, 'certification visée']
]

// Promesses de résultat au futur (« vous obtiendrez la certification ») :
// un marqueur conditionnel ailleurs dans la phrase ne les excuse pas —
// chaque verbe est ramené au conditionnel.
const FUTURE_PROMISES: Record<string, string> = {
  obtiendrez: 'pourriez obtenir',
  aurez: 'pourriez avoir',
  serez: 'pourriez être',
  deviendrez: 'pourriez devenir',
  saurez: 'pourriez savoir',
  maîtriserez: 'pourriez maîtriser',
  maitriserez: 'pourriez maîtriser',
  réussirez: 'pourriez réussir',
  reussirez: 'pourriez réussir',
  acquerrez: 'pourriez acquérir',
  disposerez: 'pourriez disposer',
  pourrez: 'pourriez'
}
const FUTURE_PROMISE_PATTERN = new RegExp(
  `\\bvous (${Object.keys(FUTURE_PROMISES).join('|')})\\b`,
  'gi'
)

function softenFuturePromises(text: string): string {
  return text.replace(
    FUTURE_PROMISE_PATTERN,
    (_match, verb: string) => `vous ${FUTURE_PROMISES[verb.toLowerCase()]}`
  )
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean)
}

function applyRewrites(text: string, rewrites: Array<[RegExp, string]>): string {
  return rewrites.reduce(
    (current, [pattern, replacement]) => current.replace(pattern, replacement),
    text
  )
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/**
 * Justification conforme : au conditionnel, sans promesse réglementaire,
 * 2 phrases au plus. Retourne le texte corrigé et les écarts constatés.
 */
export function sanitizeJustification(text: string): { text: string; issues: GuardrailIssue[] } {
  const issues: GuardrailIssue[] = []
  let result = text.trim()

  const softened = applyRewrites(result, REGULATORY_REWRITES)
  if (softened !== result) issues.push('regulatory-promise')
  result = softened

  const conditional = softenFuturePromises(applyRewrites(result, ASSERTIVE_REWRITES))
  if (conditional !== result) issues.push('assertive-wording')
  result = conditional

  let sentences = splitSentences(result)
  if (sentences.length > MAX_SENTENCES) {
    issues.push('too-long')
    sentences = sentences.slice(0, MAX_SENTENCES)
  }
  result = sentences.join(' ')

  if (result && !CONDITIONAL_MARKERS.test(result)) {
    if (!issues.includes('assertive-wording')) issues.push('assertive-wording')
    result = `Cette formation semble adaptée à votre besoin : ${result.charAt(0).toLowerCase()}${result.slice(1)}`
  }

  return { text: result ? capitalize(result) : result, issues }
}

/**
 * Garde-fous wording sur les recommandations : justifications au
 * conditionnel, aucune formation en double, 1 principale + 2 alternatives
 * au plus — la première conservée est toujours la principale. Applicable à
 * la sortie IA comme au repli déterministe.
 */
export function applyWordingGuardrails(recommendations: AssistantRecommendation[]): {
  recommendations: AssistantRecommendation[]
  issues: GuardrailIssue[]
} {
  const issues = new Set<GuardrailIssue>()
  const seen = new Set<string>()
  const kept: AssistantRecommendation[] = []

  for (const recommendation of recommendations) {
    if (seen.has(recommendation.slug)) {
      issues.add('duplicate-course')
      continue
    }
    if (kept.length > MAX_ALTERNATIVES) {
      issues.add('too-many-alternatives')
      break
    }
    seen.add(recommendation.slug)
    const { text, issues: found } = sanitizeJustification(recommendation.justification)
    found.forEach((issue) => issues.add(issue))
    // Une recommandation sans explication ne sort jamais telle quelle (1 à 2
    // phrases attendues) : texte de secours conditionnel, écart signalé.
    if (!text) issues.add('missing-justification')
    kept.push({
      ...recommendation,
      justification: text || FALLBACK_JUSTIFICATION,
      rank: kept.length === 0 ? 'primary' : 'alternative'
    })
  }

  return { recommendations: kept, issues: [...issues] }
}

/**
 * Post-traitement d'une réponse avant renvoi au front : garde-fous sur les
 * recommandations, mention de source (RG-IA-01) et transparence
 * « assistant automatisé ».
 */
export function guardReply(reply: AssistantReply): {
  reply: AssistantReply
  issues: GuardrailIssue[]
} {
  const guarded: AssistantReply = { ...reply, notice: ASSISTANT_NOTICE }
  if (!reply.recommendations?.length) return { reply: guarded, issues: [] }

  const { recommendations, issues } = applyWordingGuardrails(reply.recommendations)
  return { reply: { ...guarded, recommendations, source: SOURCE_MENTION }, issues }
}
