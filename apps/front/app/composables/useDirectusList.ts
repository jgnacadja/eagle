import { readItems } from '@directus/sdk'

function getCachedData<T>(key: string, nuxtApp: ReturnType<typeof useNuxtApp>): T | undefined {
  return nuxtApp.payload.data[key] ?? nuxtApp.static.data[key]
}

/**
 * Fetch une liste d'items Directus, dégradée à [] en cas d'erreur — mais
 * loggée côté serveur avant de dégrader, pour qu'un trou de permission sur
 * le rôle Public (voir ST-12) apparaisse dans les logs serveur au lieu de se
 * traduire silencieusement par une section vide.
 */
export function useDirectusList<T>(
  collection: string,
  cacheKey: string,
  query?: Record<string, unknown>
) {
  const directus = useDirectusClient()

  const { data } = useAsyncData(
    cacheKey,
    async () => {
      try {
        return await directus.request<T[]>(readItems(collection, query))
      } catch (error) {
        if (import.meta.server) {
          logServerError(`[useDirectusList] ${collection} (${cacheKey}) :`, error)
        }
        return []
      }
    },
    {
      getCachedData: (key, nuxtApp) => getCachedData<T[]>(key, nuxtApp)
    }
  )

  return data
}
