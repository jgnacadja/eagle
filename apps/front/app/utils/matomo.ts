// helpers du tracker Matomo. Logique pure (testable hors Nuxt) :
// nettoyage de l'URL suivie et détection de prévisualisation.
//
// MAT-15 : les variantes d'une même page (utm_*, tri, pagination, ordre)
// n'ont pas à créer de lignes distinctes dans les rapports — elles sont
// retirées de l'URL envoyée à Matomo, qui agrège alors les pages réelles.
// `q` et `lieu` (saisie libre du visiteur) sont exclus aussi : la recherche
// est mesurée par `trackSiteSearch`, et un texte libre n'a rien à faire
// dans les URLs des rapports (cardinalité, données personnelles saisies).
const EXCLUDED_QUERY_KEYS = new Set(['page', 'tri', 'sort', 'order', 'q', 'lieu'])

export function cleanTrackedUrl(pathname: string, search: string): string {
  if (!search || search === '?') return pathname
  const kept = new URLSearchParams(search)
  const keptParams = new URLSearchParams()
  for (const [key, value] of kept) {
    const lower = key.toLowerCase()
    if (lower.startsWith('utm_') || EXCLUDED_QUERY_KEYS.has(lower)) continue
    keptParams.append(key, value)
  }
  const query = keptParams.toString()
  return query ? `${pathname}?${query}` : pathname
}

/** Une prévisualisation Directus (`?preview=…`) n'est jamais tracée. */
export function isPreviewQuery(query: Record<string, unknown>): boolean {
  return 'preview' in query
}

export type MatomoCommand = [string, ...Array<string | number | boolean>]

/**
 * Commande fonction : exécutée par matomo.js une fois chargé, `this` = l'API
 * du tracker (ex. `isUserOptedOut()` pour l'opt-out). La queue reste
 * typée tableau — la queue de tuple évite les erreurs d'indexation en spec.
 */
export type MatomoCallback = [() => void, ...Array<string | number | boolean>]

/**
 * File de commandes du tracker. Avant le chargement de `matomo.js` c'est un
 * simple tableau ; une fois le script exécuté, Matomo le remplace par son
 * proxy asynchrone — un objet qui expose toujours `push` (d'où le test
 * `typeof push === 'function'` dans `useAnalytics.ready`, pas `isArray`).
 * Le typage garde la forme tableau : seule `push` est utilisée au runtime
 * et les specs insèrent/inspectent les commandes. Les éléments sont des
 * commandes classiques ou des commandes-fonction (opt-out).
 */
export type MatomoQueue = Array<MatomoCommand | MatomoCallback>

declare global {
  interface Window {
    _paq?: MatomoQueue
  }
}
