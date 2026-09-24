import type { AssistantRecommendation, AssistantRecommendationSet } from '@learnup/types'

/** Mention de source affichée sous chaque recommandation (RG-IA-01). */
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
  | 'duplicate-course'
  | 'too-many-alternatives'

const CONDITIONAL_MARKERS =
  /\b(semble|semblent|devrait|devraient|pourrait|pourraient|parait|paraît|serait|seraient|peut|peuvent)\b/i

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

  const conditional = applyRewrites(result, ASSERTIVE_REWRITES)
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
 * Garde-fous wording sur un jeu de recommandations : justifications
 * conditionnelles, 2 alternatives au plus, aucune formation en double,
 * mention de source. Applicable à la sortie IA comme au repli déterministe.
 */
export function applyWordingGuardrails(set: AssistantRecommendationSet): {
  set: AssistantRecommendationSet
  issues: GuardrailIssue[]
} {
  const issues = new Set<GuardrailIssue>()

  const sanitize = (recommendation: AssistantRecommendation): AssistantRecommendation => {
    const { text, issues: found } = sanitizeJustification(recommendation.justification)
    found.forEach((issue) => issues.add(issue))
    return { ...recommendation, justification: text }
  }

  const principal = sanitize(set.principal)
  const seen = new Set([principal.course.slug])
  const alternatives: AssistantRecommendation[] = []
  for (const alternative of set.alternatives) {
    if (seen.has(alternative.course.slug)) {
      issues.add('duplicate-course')
      continue
    }
    if (alternatives.length >= MAX_ALTERNATIVES) {
      issues.add('too-many-alternatives')
      break
    }
    seen.add(alternative.course.slug)
    alternatives.push(sanitize(alternative))
  }

  return { set: { principal, alternatives, source: SOURCE_MENTION }, issues: [...issues] }
}
