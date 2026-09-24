/**
 * Modèles de vue des 11 états du moteur de recherche & recommandation IA
 * (maquette S0). Données 100 % catalogue publié (RG-IA-01) : intitulés
 * exacts du référentiel, liens vers les fiches, aucune session estimée
 * (RG-IA-02). DEV-CORE mappera la réponse de l'API `/assistant` sur ces
 * types ; UI-STATIC les alimente avec des fixtures.
 */
export type AssistantStateId =
  | 'initial'
  | 'analyzing'
  | 'clarification'
  | 'recommendation'
  | 'availability'
  | 'no-session'
  | 'no-result'
  | 'out-of-catalog'
  | 'unavailable'
  | 'comparison'
  | 'history'

export interface AssistantCourseLink {
  /** Intitulé exact du catalogue — jamais reformulé par l'IA. */
  title: string
  /** Route de la fiche formation. */
  to: string
}

export type AssistantSeats = 'available' | 'limited'

/** Bloc disponibilité (§20) — affiché seulement si une session existe (RG-IA-09). */
export interface AssistantAvailability {
  centre: string
  distance?: string
  nextSession: string
  seats?: AssistantSeats
  sessionsTo: string
  requestTo: string
}

export interface AssistantRecommendation {
  course: AssistantCourseLink
  /** 1-2 phrases au conditionnel (§14). */
  justification: string
  /** Attributs factuels du référentiel — chip masquée si absent. */
  attributes: string[]
  availability?: AssistantAvailability
  sessionsTo?: string
}

export interface AssistantRecommendationSet {
  principal: AssistantRecommendation
  /** Deux alternatives au plus (§13). */
  alternatives: AssistantRecommendation[]
}

export interface AssistantClarification {
  intro: string
  question: string
  options: string[]
}

export interface AssistantNoSession {
  course: AssistantCourseLink
  requestTo: string
}

export interface AssistantOutOfCatalog {
  message: string
}

export interface AssistantComparisonRow {
  course: AssistantCourseLink
  principal?: boolean
  why: string
  duration: string
  modality: string
}

export interface AssistantComparison {
  need: string
  rows: AssistantComparisonRow[]
}

export interface AssistantSummary {
  text: string
  course: AssistantCourseLink
  meta: string
  sessionsTo: string
}

export type AssistantTurn =
  | { role: 'user'; text: string }
  | { role: 'assistant'; kind: 'analyzing' }
  | { role: 'assistant'; kind: 'text'; text: string }
  | { role: 'assistant'; kind: 'clarification'; clarification: AssistantClarification }
  | { role: 'assistant'; kind: 'recommendations'; recommendations: AssistantRecommendationSet }
  | { role: 'assistant'; kind: 'no-session'; noSession: AssistantNoSession }
  | { role: 'assistant'; kind: 'no-result' }
  | { role: 'assistant'; kind: 'out-of-catalog'; outOfCatalog: AssistantOutOfCatalog }
  | { role: 'assistant'; kind: 'summary'; summary: AssistantSummary }

export interface AssistantConversation {
  /** Bandeau contexte (§26-29) : mémoire visible et modifiable. */
  context?: string[]
  turns: AssistantTurn[]
  /** Saisie libre en pied de conversation (réponse à une clarification). */
  composer?: boolean
}
