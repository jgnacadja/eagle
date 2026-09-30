import type { LocationQuery } from 'vue-router'

/**
 * Route dédiée du moteur de recherche & recommandation IA (« Recherche
 * assistée »). Une seule constante : le libellé de la route reste un
 * arbitrage ouvert (`/recherche-assistee` vs `/assistant`), le renommer ne
 * touche que ce fichier et `nuxt.config.ts` (routeRules).
 */
export const ASSISTANT_ROUTE = '/recherche-assistee'

/** Requête initiale transmise à l'entrée — deep-link partageable de l'entrée. */
export const ASSISTANT_QUERY_PARAM = 'q'

export interface AssistantRouteLocation {
  path: string
  query?: Record<string, string>
}

/** Emplacement de route vers le moteur, requête initiale en `?q=` si non vide. */
export function assistantRoute(query?: string): AssistantRouteLocation {
  const trimmed = query?.trim() ?? ''
  return trimmed
    ? { path: ASSISTANT_ROUTE, query: { [ASSISTANT_QUERY_PARAM]: trimmed } }
    : { path: ASSISTANT_ROUTE }
}

/** Requête initiale lue dans l'URL du moteur (chaîne vide si absente). */
export function readAssistantQuery(query: LocationQuery): string {
  const value = query[ASSISTANT_QUERY_PARAM]
  return typeof value === 'string' ? value.trim() : ''
}
