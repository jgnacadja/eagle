import { readItems } from '@directus/sdk'

/**
 * Fetch une liste d'items Directus, dégradée à [] en cas d'échec — mais
 * loggée côté serveur avant de dégrader, pour qu'un trou de permission sur
 * le rôle Public (voir ST-12) apparaisse dans les logs serveur au lieu de se
 * traduire silencieusement par une section vide.
 */
export async function useDirectusList<T>(
  collection: string,
  cacheKey: string,
  query?: Record<string, unknown>
) {
  const directus = useDirectusClient()

  const { data } = await useAsyncData(cacheKey, async () => {
    try {
      return await directus.request<T[]>(readItems(collection, query))
    } catch (error) {
      if (import.meta.server) {
        logServerError(`[useDirectusList] ${collection} (${cacheKey}) :`, error)
      }
      return []
    }
  })

  return data
}
