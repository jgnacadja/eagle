/**
 * Contrat du moteur de recherche & recommandation IA (`/assistant`) : les
 * réponses produites par l'orchestration Anthropic (BACKEND-A/B) comme par
 * le repli déterministe (BACKEND-C) passent par les mêmes garde-fous et
 * prennent cette forme. Données 100 % catalogue publié (RG-IA-01), aucune
 * disponibilité estimée (RG-IA-02/09), justifications au conditionnel (§14).
 */
export type AssistantSeats = 'available' | 'limited'

export interface AssistantCourseRef {
  /** Intitulé exact du catalogue publié — jamais reformulé par l'IA. */
  title: string
  slug: string
  familySlug: string | null
}

/** Bloc disponibilité (§20) — présent seulement si une session est programmée. */
export interface AssistantAvailability {
  centre: string | null
  /** Date ISO (YYYY-MM-DD) de la prochaine session. */
  nextSession: string
  seats: AssistantSeats | null
  modality: string | null
}

export interface AssistantRecommendation {
  course: AssistantCourseRef
  /** 1 à 2 phrases, au conditionnel (« semble adaptée parce que… »). */
  justification: string
  /** Attributs factuels du référentiel (durée, modalité, certification). */
  attributes: string[]
  availability: AssistantAvailability | null
}

export interface AssistantRecommendationSet {
  principal: AssistantRecommendation
  /** Deux alternatives au plus, chacune différenciée (§13-15). */
  alternatives: AssistantRecommendation[]
  /** Mention de source (RG-IA-01). */
  source: string
}

export interface AssistantClarification {
  /** Une seule question, courte (RG-IA-03). */
  question: string
  options: string[]
}

export type AssistantOutcome =
  | { kind: 'recommendations'; recommendations: AssistantRecommendationSet }
  | { kind: 'clarification'; clarification: AssistantClarification }
  | { kind: 'no-result' }
  | { kind: 'out-of-catalog' }

export type AssistantMode = 'ai' | 'fallback'

export interface AssistantAnswer {
  outcome: AssistantOutcome
  /** `ai` = orchestration Anthropic · `fallback` = recherche déterministe (mode dégradé). */
  mode: AssistantMode
  /** Transparence : réponse d'un assistant automatisé. */
  notice: string
  /** Intention détectée (IA) ou termes retenus de la requête (repli). */
  intent: string | null
}
