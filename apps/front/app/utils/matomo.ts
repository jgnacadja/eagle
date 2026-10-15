// ST-27 — helpers du tracker Matomo. Logique pure (testable hors Nuxt) :
// nettoyage de l'URL suivie et détection de prévisualisation.
//
// MAT-15 : les variantes d'une même page (utm_*, tri, pagination, ordre)
// n'ont pas à créer de lignes distinctes dans les rapports — elles sont
// retirées de l'URL envoyée à Matomo, qui agrège alors les pages réelles.
const EXCLUDED_QUERY_KEYS = new Set(['page', 'tri', 'sort', 'order'])

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
 * du tracker (ex. `isUserOptedOut()` pour l'opt-out ST-33).
 */
export type MatomoCallback = [() => void]

/**
 * File de commandes du tracker. Avant le chargement de `matomo.js` c'est un
 * simple tableau ; une fois le script exécuté, Matomo le remplace par son
 * proxy asynchrone — un objet qui expose toujours `push`. Le contrat retenu
 * est donc la méthode `push`, pas la forme tableau.
 */
export interface MatomoQueue {
  push: (command: MatomoCommand | MatomoCallback) => unknown
}

declare global {
  interface Window {
    _paq?: MatomoQueue
  }
}
