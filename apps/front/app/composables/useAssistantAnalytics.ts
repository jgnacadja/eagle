import type {
  AssistantMode,
  AssistantRecommendation,
  AssistantReplyKind,
  AssistantSource
} from '@learnup/types'
import { trackEvent } from '~/utils/analytics'

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

interface TurnParams {
  /** Point d'entrée de la conversation. */
  source?: AssistantSource
  /** Rang du tour utilisateur concerné (1 = premier message). */
  turn: number
}

/**
 * Jalons analytics du moteur IA (DEV-CORE) : ouverture, envoi, clarification,
 * recommandation, sélection. Jamais le contenu des messages.
 */
export function useAssistantAnalytics() {
  return {
    /** Le panneau s'ouvre depuis un point d'entrée. */
    searchStart: (source?: AssistantSource) => trackEvent('ai_search_start', { source }),

    /** Un besoin est exprimé (premier message ou nouveau besoin). */
    searchSubmit: (params: TurnParams & { via: AssistantSubmitVia }) =>
      trackEvent('ai_search_submit', params),

    /** L'assistant demande une précision. */
    clarificationRequested: (params: TurnParams & { kind?: AssistantReplyKind }) =>
      trackEvent('ai_clarification_requested', params),

    /** Le visiteur répond à la précision demandée (chip ou saisie libre). */
    clarificationAnswer: (params: TurnParams & { via: AssistantSubmitVia }) =>
      trackEvent('ai_clarification_answer', params),

    /** Des recommandations sont affichées. */
    recommendationDisplay: (params: TurnParams & { count: number; mode?: AssistantMode }) =>
      trackEvent('ai_recommendation_display', params),

    /** Un CTA d'une recommandation est cliqué (fiche, sessions, demande). */
    recommendationSelect: (params: AssistantSelection & { source?: AssistantSource }) =>
      trackEvent('ai_recommendation_select', params)
  }
}
