interface SeoSource {
  seo_title?: string | null
  seo_description?: string | null
  seo_canonical?: string | null
}

/** Alimente useHead depuis les champs SEO Directus (title/meta/canonique). */
export function useContentSeo(source: SeoSource, fallbackTitle: string) {
  const title = source.seo_title || fallbackTitle
  useHead({
    title,
    meta: [
      ...(source.seo_description
        ? [{ name: 'description', content: source.seo_description }]
        : []),
      { property: 'og:title', content: title }
    ],
    link: source.seo_canonical ? [{ rel: 'canonical' as const, href: source.seo_canonical }] : []
  })
}
