import { computed, toValue, type MaybeRefOrGetter } from 'vue'

interface SeoSource {
  seo_title?: string | null
  seo_description?: string | null
  seo_canonical?: string | null
  /** Ajoute une meta robots noindex (pages d'erreur, contenus non indexables). */
  seo_noindex?: boolean | null
}

interface UseContentSeoOptions {
  /**
   * Données structurées JSON-LD (schema.org) — objet unique ou tableau.
   * Getter réactif : renvoyer `null`/`[]` tant que la donnée manque ou que
   * la page n'est pas indexable — aucun script n'est alors émis.
   */
  jsonLd?: MaybeRefOrGetter<Record<string, unknown> | Record<string, unknown>[] | null>
}

/** Alimente useHead depuis les champs SEO Directus (title/meta/canonique) + JSON-LD. */
export function useContentSeo(
  source: MaybeRefOrGetter<SeoSource>,
  fallbackTitle: MaybeRefOrGetter<string>,
  options?: UseContentSeoOptions
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
          : [],
        script: jsonLdScripts(toValue(options?.jsonLd))
      }
    })
  )
}

// `</script>` dans une chaîne JSON-LD casserait le document (ou pire) —
// échappement standard `<` → \u003c, invisible pour les parsers.
function serializeJsonLd(entry: Record<string, unknown>): string {
  return JSON.stringify(entry).replaceAll('<', String.raw`\u003c`)
}

function jsonLdScripts(
  input: Record<string, unknown> | Record<string, unknown>[] | null | undefined
): { type: 'application/ld+json'; innerHTML: string }[] {
  const items = Array.isArray(input) ? input : [input]
  const entries = items.filter(
    (entry): entry is Record<string, unknown> =>
      Boolean(entry) && typeof entry === 'object' && !Array.isArray(entry)
  )
  return entries.map((entry) => ({
    type: 'application/ld+json',
    innerHTML: serializeJsonLd(entry)
  }))
}
