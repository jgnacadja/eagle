import { readItems } from '@directus/sdk'
import type { MultiWatchSources } from 'vue'

// Le payload SSR n'est servi que pendant l'hydratation : un mount ultérieur
// (navigation client) repart sur des données fraîches plutôt que de servir
// une liste figée — potentiellement vide — pour toute la session.
function getCachedData<T>(
  key: string,
  nuxtApp: ReturnType<typeof useNuxtApp>,
  ctx: { cause?: string }
): T | undefined {
  if (ctx.cause !== 'initial' || !nuxtApp.isHydrating) return undefined
  return nuxtApp.payload.data[key] ?? nuxtApp.static.data[key]
}

/**
 * Fetch une liste d'items Directus, dégradée à [] en cas d'erreur — mais
 * loggée côté serveur avant de dégrader, pour qu'un trou de permission sur
 * le rôle Public (voir ST-12) apparaisse dans les logs serveur au lieu de se
 * traduire silencieusement par une section vide.
 */
// `query` peut être un getter : il est réévalué à chaque fetch et peut
// renvoyer `null` pour sauter l'appel (contexte pas encore résolu). À
// combiner avec `options.watch` quand la requête dépend d'une source
// réactive — sans ça une navigation client vers la même route figerait le
// premier jeu de paramètres.
export function useDirectusList<T>(
  collection: string,
  cacheKey: string,
  query?: Record<string, unknown> | (() => Record<string, unknown> | null),
  options?: { watch?: MultiWatchSources }
) {
  const directus = useDirectusClient()

  const { data } = useAsyncData(
    cacheKey,
    async () => {
      const resolvedQuery = typeof query === 'function' ? query() : query
      if (resolvedQuery === null) return []
      try {
        return await directus.request<T[]>(readItems(collection, resolvedQuery))
      } catch (error) {
        if (import.meta.server) {
          logServerError(`[useDirectusList] ${collection} (${cacheKey}) :`, error)
        }
        return []
      }
    },
    {
      getCachedData: (key, nuxtApp, ctx) => getCachedData<T[]>(key, nuxtApp, ctx),
      watch: options?.watch
    }
  )

  return data
}
