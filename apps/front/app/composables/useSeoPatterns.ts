import type { SeoPattern } from '@learnup/types'

// Patrons SEO administrables (ST-04) : une seule requête Directus par rendu,
// partagée entre toutes les pages qui résolvent leurs métas — l'édition d'un
// patron dans le CMS est répercutée sans déploiement (dépend du TTL ISR).
const CACHE_KEY = 'seo-patterns'

/**
 * Tous les patrons `seo_patterns`, indexés par `key` — [] si la collection
 * est vide/injoignable : les pages retombent alors sur leurs replis codés.
 */
export function useSeoPatterns() {
  const patterns = useDirectusList<SeoPattern>('seo_patterns', CACHE_KEY, {
    fields: ['key', 'title_pattern', 'description_pattern']
  })
  return computed<Record<string, SeoPattern>>(() =>
    Object.fromEntries((patterns.value ?? []).map((p) => [p.key, p]))
  )
}

/** Le patron d'un gabarit, `null` s'il n'est pas administré. */
export function useSeoPattern(key: string) {
  const byKey = useSeoPatterns()
  return computed(() => byKey.value[key] ?? null)
}
