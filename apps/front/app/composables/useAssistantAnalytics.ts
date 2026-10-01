import type { AssistantMode, AssistantRecommendation, AssistantSource } from '@learnup/types'
import { trackEvent, type AnalyticsEvent } from '~/utils/analytics'

/**
 * Comment un message utilisateur est parti : réponse rapide (chip), saisie
 * libre, message transmis par le point d'entrée (champ Home, catalogue) ou
 * modification d'un message précédent.
 */
export type AssistantSubmitVia = 'suggestion' | 'text' | 'entry' | 'edit'

/** CTA cliqué sur une recommandation. */
export type AssistantSelectAction = 'formation' | 'sessions' | 'demande'

export interface AssistantSelection {
  slug: string
  rank: AssistantRecommendation['rank']
  action: AssistantSelectAction
}

export interface AssistantTurnParams {
  /** Point d'entrée de la conversation. */
  source?: AssistantSource
  /** Rang du tour utilisateur concerné (1 = premier message). */
  turn: number
}

/** Jalons du parcours nominal — contrat public, documenté dans `AGENTS.md`. */
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
}

/**
 * Jalons analytics du moteur IA (DEV-CORE) : ouverture, envoi, clarification,
 * recommandation, sélection. Jamais le contenu des messages.
 */
export function useAssistantAnalytics(): AssistantAnalytics {
  return {
    searchStart: (source) => trackEvent('ai_search_start', { source }),
    searchSubmit: (params) => trackEvent('ai_search_submit', params),
    clarificationRequested: (params) => trackEvent('ai_clarification_requested', params),
    clarificationAnswer: (params) => trackEvent('ai_clarification_answer', params),
    recommendationDisplay: (params) => trackEvent('ai_recommendation_display', params),
    recommendationSelect: (params) => trackEvent('ai_recommendation_select', params)
  }
}
