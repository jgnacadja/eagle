import { computed, toValue, type MaybeRefOrGetter } from 'vue'

interface SeoSource {
  seo_title?: string | null
  seo_description?: string | null
  seo_canonical?: string | null
  /** Ajoute une meta robots noindex (pages d'erreur, contenus non indexables). */
  seo_noindex?: boolean | null
}

/** Alimente useHead depuis les champs SEO Directus (title/meta/canonique). */
export function useContentSeo(
  source: MaybeRefOrGetter<SeoSource>,
  fallbackTitle: MaybeRefOrGetter<string>
) {
  useHead(
    computed(() => {
      const resolved = toValue(source)
      const title = resolved.seo_title || toValue(fallbackTitle)
      return {
        title,
        meta: [
          ...(resolved.seo_description
            ? [{ name: 'description', content: resolved.seo_description }]
            : []),
          { property: 'og:title', content: title },
          ...(resolved.seo_noindex ? [{ name: 'robots', content: 'noindex' }] : [])
        ],
        link: resolved.seo_canonical
          ? [{ rel: 'canonical' as const, href: resolved.seo_canonical }]
          : []
      }
    })
  )
}
