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
// `fields[]` doit rester dans l'allowlist Public (roles.mjs) : un seul
// champ non exposé fait échouer la requête entière en 403, et le catch
// dégraderait la collection à []. familles_formation n'expose aucune
// date, articles expose publish_at, pages_legales expose updated_at.
const COLLECTION_FIELDS: Record<string, string[]> = {
  familles_formation: ['slug'],
  articles: ['slug', 'publish_at'],
  pages_legales: ['slug', 'updated_at']
}
// Le proxy /directus borne `limit` à 100 (limit=-1 refusé) — on pagine
// jusqu'à épuisement, avec un plafond très au-dessus des volumes réels.
const DIRECTUS_PAGE_SIZE = 100
const DIRECTUS_MAX_PAGES = 20
async function fetchSlugs(api: ApiFetch, collection: string): Promise<DirectusRow[]> {
  const rows: DirectusRow[] = []
  for (let page = 1; page <= DIRECTUS_MAX_PAGES; page++) {
    const res = (await api(`/directus/items/${collection}`, {
      'filter[status][_eq]': 'published',
      'fields[]': COLLECTION_FIELDS[collection] ?? ['slug'],
      limit: DIRECTUS_PAGE_SIZE,
      page
    }).catch(() => null)) as DirectusList | null
    const batch = res?.data ?? []
    rows.push(...batch)
    if (batch.length < DIRECTUS_PAGE_SIZE) break
  }
  return rows
}

interface SitemapSources {
  formations: CourseRow[]
  familles: DirectusRow[]
  centres: CentreRow[]
  articles: DirectusRow[]
  legales: DirectusRow[]
}

// Les slugs en base ne sont pas tous normalisés (saisie éditoriale :
// espaces, &, ®, accents) — encodage segment par segment : la loc
// reste une URL valide et le routeur la décode vers le slug exact
// attendu par le filtre `slug _eq` (slugifier ici produirait des 404).
const seg = (slug: string) => encodeURIComponent(slug)

function buildSitemapUrls(src: SitemapSources): SitemapUrlInput[] {
  // Dédup par loc : une page légale peut porter le slug d'une route
  // statique (le router tranche en faveur de la statique, l'URL reste
  // la même dans les deux cas).
  const urls = new Map<string, SitemapUrlInput>()
  const push = (loc: string, lastmod?: string | null) => {
    if (urls.has(loc)) return
    urls.set(loc, lastmod ? { loc, lastmod } : { loc })
  }
  const addRows = <T extends { slug?: string | null }>(
    rows: T[],
    toLoc: (slug: string) => string,
    lastmod?: (row: T) => string | null | undefined
  ) => {
    for (const row of rows) {
      if (row.slug) push(toLoc(row.slug), lastmod?.(row))
    }
  }

  addRows(src.familles, (slug) => `/formations/${seg(slug)}`)
  addRows(src.centres, (slug) => `/centres/${seg(slug)}`)
  addRows(
    src.articles,
    (slug) => `/actualites/${seg(slug)}`,
    (row) => row.publish_at
  )
  addRows(
    src.legales,
    (slug) => `/${seg(slug)}`,
    (row) => row.updated_at
  )

  // Sans famille pas de route fiche (mapCourse renvoie `to: null`) :
  // une formation orpheline ne doit jamais apparaître dans le sitemap.
  for (const course of src.formations) {
    if (course.slug && course.familySlug) {
      push(`/formations/${seg(course.familySlug)}/${seg(course.slug)}`)
    }
  }

  return [...urls.values()]
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

    return buildSitemapUrls({
      formations,
      familles,
      centres: centres as CentreRow[],
      articles,
      legales
    })
  }),
  { maxAge: CACHE_MAX_AGE_S }
)
