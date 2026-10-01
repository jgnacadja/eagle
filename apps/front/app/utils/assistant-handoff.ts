import type { RouteLocationRaw } from 'vue-router'

/** Page conseiller — cible de toutes les sorties « être accompagné ». */
export const ADVISOR_PATH = '/parler-a-votre-conseiller'
/** Tunnel de demande de formation. */
export const DEMANDE_PATH = '/centres/demande-de-formation'

/** Clé du besoin dans `history.state` de l'entrée de navigation cible. */
export const HANDOFF_STATE_KEY = 'assistantHandoff'

/** Longueur maximale du besoin transmis (le fil complet reste dans le panneau). */
export const NEED_MAX_LENGTH = 500

/**
 * Besoin décrit dans la recherche assistée, transmis au tunnel de demande et
 * à la page conseiller **hors URL** (RGPD) : le texte libre du visiteur ne
 * doit apparaître ni dans `page_location` côté analytics, ni dans le
 * `Referer`, ni dans les journaux. Il voyage dans l'état d'historique de la
 * navigation (`router.push({ state })`), conservé au rechargement et au
 * retour arrière, propre à cette entrée d'historique.
 */
export type AssistantHandoff = {
  need: string
  headcount?: number
  location?: string
}

/** Tronque sans couper une paire de substitution (emoji, symboles). */
export function truncateNeed(need: string): string {
  return Array.from(need.trim()).slice(0, NEED_MAX_LENGTH).join('')
}

function stateOf(handoff: AssistantHandoff | null | undefined): Record<string, AssistantHandoff> {
  const need = handoff ? truncateNeed(handoff.need) : ''
  if (!need) return {}
  const value: AssistantHandoff = { need }
  if (handoff?.headcount) value.headcount = handoff.headcount
  if (handoff?.location) value.location = handoff.location
  return { [HANDOFF_STATE_KEY]: value }
}

/** Lien vers la page conseiller, besoin transmis hors URL s'il existe. */
export function advisorLink(handoff?: AssistantHandoff | null): RouteLocationRaw {
  const state = stateOf(handoff)
  return Object.keys(state).length ? { path: ADVISOR_PATH, state } : ADVISOR_PATH
}

/** Lien vers le tunnel de demande : identifiants en query, besoin hors URL. */
export function demandeLink(
  query: Record<string, string | undefined>,
  handoff?: AssistantHandoff | null
): RouteLocationRaw {
  const cleaned = Object.fromEntries(
    Object.entries(query).filter((entry): entry is [string, string] => !!entry[1])
  )
  const state = stateOf(handoff)
  return {
    path: DEMANDE_PATH,
    query: cleaned,
    ...(Object.keys(state).length ? { state } : {})
  }
}

function isHandoff(value: unknown): value is AssistantHandoff {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.need === 'string' &&
    (candidate.headcount === undefined || typeof candidate.headcount === 'number') &&
    (candidate.location === undefined || typeof candidate.location === 'string')
  )
}

/**
 * Besoin transmis à l'entrée d'historique courante — client uniquement,
 * `null` côté serveur ou sans transmission.
 */
export function readHandoff(): AssistantHandoff | null {
  if (typeof window === 'undefined') return null
  const state: unknown = window.history.state
  if (typeof state !== 'object' || state === null) return null
  const value = (state as Record<string, unknown>)[HANDOFF_STATE_KEY]
  if (!isHandoff(value)) return null
  const need = truncateNeed(value.need)
  return need ? { ...value, need } : null
}
