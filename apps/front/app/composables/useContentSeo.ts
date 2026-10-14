import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { jsonLdScriptTags } from '~/utils/jsonLd'

interface SeoSource {
  seo_title?: string | null
  seo_description?: string | null
  seo_canonical?: string | null
  /** Ajoute une meta robots noindex (pages d'erreur, contenus non indexables). */
  seo_noindex?: boolean | null
  /**
   * Directive robots verbatim (« noindex, follow », « noindex, nofollow »…)
   * — prime sur `seo_noindex` pour les cas nuancés (recherche filtrée,
   * confirmation). Les pages indexables n'ont pas besoin du champ.
   */
  seo_robots?: string | null
  /**
   * URL absolue de l'image OG/Twitter propre à la page (visuel Directus ou
   * catalogue). Absente → image par défaut définie dans `app.vue`.
   */
  seo_image?: string | null
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
  const route = useRoute()
  const requestUrl = useRequestURL()
  useHead(
    computed(() => {
      const resolved = toValue(source)
      const title = resolved.seo_title || toValue(fallbackTitle)
      // Self-canonical garanti (ST-03) : champ Directus explicite, sinon
      // l'URL canonique de la requête — `route.path` est toujours la forme
      // sans slash final (middleware 301 amont), sans query ni fragment.
      // Origine de
      // la requête et non siteUrl : la canonical reste cohérente sur les
      // previews Vercel.
      const canonical = resolved.seo_canonical || `${requestUrl.origin}${route.path}`
      return {
        title,
        meta: [
          ...(resolved.seo_description
            ? [
              { name: 'description', content: resolved.seo_description },
              { property: 'og:description', content: resolved.seo_description },
              { name: 'twitter:description', content: resolved.seo_description }
            ]
            : []),
          { property: 'og:title', content: title },
          { name: 'twitter:title', content: title },
          ...(resolved.seo_image
            ? [
              { property: 'og:image', content: resolved.seo_image },
              { name: 'twitter:image', content: resolved.seo_image }
            ]
            : []),
          ...(resolved.seo_robots
            ? [{ name: 'robots', content: resolved.seo_robots }]
            : resolved.seo_noindex
              ? [{ name: 'robots', content: 'noindex' }]
              : [])
        ],
        link: [{ rel: 'canonical' as const, href: canonical }],
        script: jsonLdScriptTags(toValue(options?.jsonLd))
      }
    })
  )
}
