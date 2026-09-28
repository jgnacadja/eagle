/**
 * Contrat de la recherche assistée (moteur conversationnel).
 * Le front envoie le fil complet de la conversation ; l'API répond une
 * décision typée — jamais de texte libre à parser.
 */

export type AssistantSource =
  'home' | 'header' | 'catalogue' | 'formation' | 'centre' | 'editorial' | 'engine'

export interface AssistantMessage {
  role: 'user' | 'assistant'
  content: string
}

/** Contexte transmis par le point d'entrée (page centre, fiche, article…). */
export interface AssistantContext {
  source?: AssistantSource
  /** Ville / territoire pré-rempli (page centre, géolocalisation). */
  location?: string
  centerSlug?: string
  /** Fiche formation d'origine — le moteur cherche une alternative. */
  formationSlug?: string
  /** Thème éditorial de l'article d'origine. */
  theme?: string
  /** Famille consultée (catalogue / page famille). */
  familleSlug?: string
  /** Filtres actifs du catalogue, en labels lisibles. */
  filters?: string[]
}

export interface AssistantRequest {
  message: string
  history?: AssistantMessage[]
  context?: AssistantContext
}

export type AssistantReplyKind =
  /** Le besoin est ambigu : une question de précision + suggestions. */
  | 'clarify'
  /** 1 recommandation principale + jusqu'à 2 alternatives. */
  | 'recommend'
  /** Rien d'assez pertinent dans le catalogue. */
  | 'no_results'
  /** Le besoin est clairement hors catalogue. */
  | 'out_of_catalog'

/** Disponibilité réelle issue du référentiel — affichée seulement si une session existe. */
export interface AssistantAvailability {
  sessionId: string | null
  startDate: string | null
  modality: string | null
  seatsRemaining: number | null
  centreName: string | null
  centreSlug: string | null
  city: string | null
  department: string | null
}

export interface AssistantRecommendation {
  slug: string
  familySlug: string | null
  /** Intitulé exact du catalogue — jamais reformulé par l'IA. */
  title: string
  description: string | null
  durationDays: number | null
  durationHours: number | null
  modalities: string[]
  certification: string | null
  rank: 'primary' | 'alternative'
  /** 1–2 phrases au conditionnel, reprenant les termes du besoin. */
  justification: string
  /** null = aucune session programmée (état « demander une session »). */
  availability: AssistantAvailability | null
  /** Lien fiche formation, null si la formation n'a pas de famille. */
  url: string | null
}

/** Créneaux structurés extraits du besoin — pré-remplissage de la demande. */
export interface AssistantSlots {
  headcount?: number
  location?: string
  modality?: string
  deadline?: string
}

export interface AssistantReply {
  kind: AssistantReplyKind
  /** Texte d'accompagnement affiché dans la bulle assistant. */
  text: string
  /** Question de clarification (kind = clarify). */
  question?: string
  /** Réponses rapides cliquables (kind = clarify). */
  suggestions?: string[]
  recommendations?: AssistantRecommendation[]
  /** Facettes agrégées du besoin (chips « Contexte » du fil). */
  contextChips?: string[]
  slots?: AssistantSlots
}
