import type {
  AssistantMode,
  AssistantRecommendation,
  AssistantReplyKind,
  AssistantSource
} from '@learnup/types'
import { trackEvent, type AnalyticsEvent } from '~/utils/analytics'

/**
 * Comment un message utilisateur est parti : réponse rapide (chip), saisie
 * libre, message transmis par le point d'entrée (champ Home, catalogue) ou
 * modification d'un message précédent.
 */
export type AssistantSubmitVia = 'suggestion' | 'text' | 'entry' | 'edit'

/** CTA cliqué sur une recommandation. */
export type AssistantSelectAction = 'formation' | 'sessions' | 'demande'

// Alias de type, pas interfaces : ces formes partent telles quelles dans
// `trackEvent`, dont le paramètre est un `Record` — seule une forme
// littérale porte la signature d'index implicite qui la rend assignable.
export type AssistantSelection = {
  slug: string
  rank: AssistantRecommendation['rank']
  action: AssistantSelectAction
}

export type AssistantTurnParams = {
  /** Point d'entrée de la recherche en cours. */
  source?: AssistantSource
  /** Rang du tour utilisateur concerné (1 = premier message). */
  turn: number
}

/**
 * Attribut porté par chaque lien de sortie conseiller du panneau : l'état
 * d'où il part. `AssistantChat` le lit par délégation au clic — aucune
 * détection par `href`, aucune constante de chemin dupliquée.
 */
export const ADVISOR_ESCALATION_ATTR = 'data-advisor-escalation'

/** États du panneau d'où part une sortie conseiller. */
export const ESCALATION_ORIGINS = [
  'clarify',
  'recommend',
  'no_results',
  'out_of_catalog',
  'unavailable',
  'no_session',
  'compare',
  'degraded'
] as const satisfies readonly (AssistantReplyKind | string)[]

export type AssistantEscalationFrom = (typeof ESCALATION_ORIGINS)[number]

export function isEscalationFrom(value: string): value is AssistantEscalationFrom {
  return (ESCALATION_ORIGINS as readonly string[]).includes(value)
}

/** Jalons du moteur IA — contrat public, documenté dans `AGENTS.md`. */
export interface AssistantAnalytics {
  /** Le panneau s'ouvre depuis un point d'entrée. */
  searchStart(source?: AssistantSource): AnalyticsEvent | null
  /** Un besoin est exprimé (premier message ou nouveau besoin). */
  searchSubmit(params: AssistantTurnParams & { via: AssistantSubmitVia }): AnalyticsEvent | null
  /** L'assistant demande une précision. */
  clarificationRequested(params: AssistantTurnParams): AnalyticsEvent | null
  /** Le visiteur répond à la précision demandée (chip ou saisie libre). */
  clarificationAnswer(
    params: AssistantTurnParams & { via: AssistantSubmitVia }
  ): AnalyticsEvent | null
  /** Des recommandations sont affichées. */
  recommendationDisplay(
    params: AssistantTurnParams & { count: number; mode?: AssistantMode }
  ): AnalyticsEvent | null
  /** Un CTA d'une recommandation est cliqué (fiche, sessions, demande). */
  recommendationSelect(
    params: AssistantSelection & { source?: AssistantSource }
  ): AnalyticsEvent | null
  /** Le tableau comparatif des recommandations est ouvert. */
  recommendationCompare(params: { source?: AssistantSource; count: number }): AnalyticsEvent | null
  /** Impasse : aucun résultat assez pertinent, ou besoin hors catalogue. */
  noResults(
    params: AssistantTurnParams & { kind: 'no_results' | 'out_of_catalog'; mode?: AssistantMode }
  ): AnalyticsEvent | null
  /** Le moteur ne répond pas (erreur API) : état indisponible affiché. */
  unavailable(params: AssistantTurnParams): AnalyticsEvent | null
  /** Réponse produite par la recherche déterministe (IA indisponible). */
  fallbackMode(params: AssistantTurnParams & { kind: AssistantReplyKind }): AnalyticsEvent | null
  /** Sortie « conseiller » cliquée depuis un état du panneau. */
  advisorEscalation(params: {
    source?: AssistantSource
    from?: AssistantEscalationFrom
    mode?: AssistantMode
  }): AnalyticsEvent | null
}

/**
 * Jalons analytics du moteur IA : parcours nominal (DEV-CORE — ouverture,
 * envoi, clarification, recommandation, sélection) et états limites
 * (DEV-EDGE — impasses, indisponibilité, mode dégradé, comparaison, sortie
 * conseiller). Jamais le contenu des messages.
 */
export function useAssistantAnalytics(): AssistantAnalytics {
  return {
    searchStart: (source) => trackEvent('ai_search_start', { source }),
    searchSubmit: (params) => trackEvent('ai_search_submit', params),
    clarificationRequested: (params) => trackEvent('ai_clarification_requested', params),
    clarificationAnswer: (params) => trackEvent('ai_clarification_answer', params),
    recommendationDisplay: (params) => trackEvent('ai_recommendation_display', params),
    recommendationSelect: (params) => trackEvent('ai_recommendation_select', params),
    recommendationCompare: (params) => trackEvent('ai_recommendation_compare', params),
    noResults: (params) => trackEvent('ai_no_results', params),
    unavailable: (params) => trackEvent('ai_unavailable', params),
    fallbackMode: (params) => trackEvent('ai_fallback_mode', params),
    advisorEscalation: (params) => trackEvent('ai_advisor_escalation', params)
  }
}
