// Source runtime du sitemap.xml — déclarée via `sitemap.sources` dans
// nuxt.config.ts. Les pages statiques sont auto-découvertes par le module
// depuis `pages/` ; ce endpoint ne fournit que le contenu dynamique
// publié :
//   /formations/{famille}/{slug}  ← API /courses (publiées, famille posée)
//   /formations/{famille}         ← proxy Directus familles_formation
//   /centres/{slug}               ← API /centres (publiés)
//   /actualites/{slug}            ← proxy Directus articles
//   /{slug}                       ← proxy Directus pages_legales
// Une source en panne dégrade à [] plutôt que de 500 : un sitemap partiel
// reste utile aux crawlers, un sitemap absent prive Google du catalogue.
// `useRuntimeConfig`, `$fetch`, `defineCachedEventHandler` : auto-imports
// Nitro ; `defineSitemapEventHandler` vient de @nuxtjs/sitemap.
import type { SitemapUrlInput } from '#sitemap/types'

// L'API borne `limit` à 100 — on pagine jusqu'à épuisement, avec un
// plafond de sécurité très au-dessus du catalogue (10 000 fiches).
const COURSES_PAGE_SIZE = 100
const COURSES_MAX_PAGES = 100
// Fraîcheur alignée sur le TTL du cache catalogue (1 h) : le sitemap est
// consommé par les crawlers au mieux quotidiennement.
const CACHE_MAX_AGE_S = 3600

interface CourseRow {
  slug?: string | null
  familySlug?: string | null
}

interface CoursesPage {
  items?: CourseRow[]
  total?: number
}

interface CentreRow {
  slug?: string | null
}

interface DirectusRow {
  slug?: string | null
  publish_at?: string | null
  updated_at?: string | null
}

interface DirectusList {
  data?: DirectusRow[]
}

type ApiFetch = (path: string, query?: Record<string, unknown>) => Promise<unknown>

async function fetchAllCourses(api: ApiFetch): Promise<CourseRow[]> {
  const courses: CourseRow[] = []
  for (let page = 1; page <= COURSES_MAX_PAGES; page++) {
    const res = (await api('/courses', { limit: COURSES_PAGE_SIZE, page }).catch(
      () => null
    )) as CoursesPage | null
    const items = res?.items ?? []
    courses.push(...items)
    if (items.length === 0 || courses.length >= (res?.total ?? 0)) break
  }
  return courses
}

// Les collections passent par le proxy /directus (rôle Public, lecture
// seule) avec un filtre `published` explicite — le proxy restreint déjà
// au rôle Public, la ceinture en plus des bretelles.
async function fetchSlugs(api: ApiFetch, collection: string): Promise<DirectusRow[]> {
  const res = (await api(`/directus/items/${collection}`, {
    'filter[status][_eq]': 'published',
    'fields[]': ['slug', 'publish_at', 'updated_at'],
    limit: -1
  }).catch(() => null)) as DirectusList | null
  return res?.data ?? []
}

export default defineCachedEventHandler(
  defineSitemapEventHandler(async (event) => {
    const config = useRuntimeConfig(event)
    const token = config.internalApiToken
    const headers = typeof token === 'string' && token ? { 'x-internal-ssr': token } : undefined
    const api: ApiFetch = (path, query) => $fetch(`${config.apiBase}${path}`, { query, headers })

    const [formations, familles, centres, articles, legales] = await Promise.all([
      fetchAllCourses(api),
      fetchSlugs(api, 'familles_formation'),
      api('/centres').catch(() => [] as CentreRow[]),
      fetchSlugs(api, 'articles'),
      fetchSlugs(api, 'pages_legales')
    ])

    // Dédup par loc : une page légale peut porter le slug d'une route
    // statique (le router tranche en faveur de la statique, l'URL reste
    // la même dans les deux cas).
    const urls = new Map<string, SitemapUrlInput>()
    const push = (loc: string, lastmod?: string | null) => {
      if (urls.has(loc)) return
      urls.set(loc, lastmod ? { loc, lastmod } : { loc })
    }

    for (const famille of familles) {
      if (famille.slug) push(`/formations/${famille.slug}`)
    }
    // Sans famille pas de route fiche (mapCourse renvoie `to: null`) :
    // une formation orpheline ne doit jamais apparaître dans le sitemap.
    for (const course of formations) {
      if (course.slug && course.familySlug) {
        push(`/formations/${course.familySlug}/${course.slug}`)
      }
    }
    for (const centre of centres as CentreRow[]) {
      if (centre.slug) push(`/centres/${centre.slug}`)
    }
    for (const article of articles) {
      if (article.slug) push(`/actualites/${article.slug}`, article.publish_at)
    }
    for (const pageLegale of legales) {
      if (pageLegale.slug) push(`/${pageLegale.slug}`, pageLegale.updated_at)
    }

    return [...urls.values()]
  }),
  { maxAge: CACHE_MAX_AGE_S }
)
