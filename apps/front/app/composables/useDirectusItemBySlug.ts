import { readItems } from '@directus/sdk'

/** Fetch un item par slug, 404 Nuxt si absent. Partagé par les 3 pages de détail. */
export async function useDirectusItemBySlug<T extends { slug: string }>(
  collection: string,
  slug: string,
  cacheKey: string
) {
  const directus = useDirectusClient()

  const { data } = await useAsyncData(cacheKey, async () => {
    const results = await directus.request<T[]>(
      readItems(collection, { filter: { slug: { _eq: slug } }, limit: 1 })
    )
    return results[0] ?? null
  })

  if (!data.value) {
    throw createError({ statusCode: 404, statusMessage: 'Page introuvable' })
  }

  return data.value
}
