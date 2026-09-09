// utils/asyncDataCache.ts
// Lecture de cache useAsyncData « sûre » : un résultat vide n'est jamais
// considéré comme une valeur cachable. Les composables dégradent les erreurs
// en [] — si ce [] était resservi depuis le cache (payload/static.data), un
// démarrage du front avant l'API figerait des menus vides jusqu'au redémarrage.
// Un cache vide est donc ignoré : la requête suivante repart vers la source.

interface AsyncDataCacheStore {
  payload: { data: Record<string, unknown> }
  static: { data: Record<string, unknown> }
}

export function nonEmptyCachedData<T>(key: string, nuxtApp: AsyncDataCacheStore): T | undefined {
  const cached = nuxtApp.payload.data[key] ?? nuxtApp.static.data[key]
  if (cached == null) return undefined
  if (Array.isArray(cached) && cached.length === 0) return undefined
  return cached as T
}
