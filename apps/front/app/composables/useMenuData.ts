// composables/useMenuData.ts
// Données des méga-menus et du menu mobile — chargées en SSR une seule fois
// (clés useAsyncData stables → dédupliquées et embarquées dans le payload).
// Sources : API catalogue (/families) + Directus (centres).
// Dégradation gracieuse : [] en cas d'erreur, log serveur.

import { readItems } from '@directus/sdk'
import { buildMeta } from '~/composables/useCatalog'
import { formatArticleDate } from '~/utils/article'
import { formatRegionLabel } from '~/utils/region'
import { slugify } from '~/utils/slugify'
import type {
  Article,
  Centre,
  CourseListItem,
  CoursePage,
  FamilleFormation,
  FamilyWithCount,
  PageLegale,
  Paginated,
  SousFamilleFormation
} from '@learnup/types'

export interface MenuFamille {
  slug: string
  label: string
  count: number
}

export interface MenuFormation {
  slug: string
  label: string
  to: string
  meta?: string
}

export interface MenuSousFamille {
  slug: string
  label: string
  count: number
}

export interface MenuCentre {
  slug: string
  name: string
  city: string | null
  department: string | null
  region: string | null
}

export interface MenuRegion {
  slug: string
  label: string
  count: number
}

export interface MenuRubrique {
  slug: string
  label: string
}

export interface MenuActualite {
  slug: string
  categorySlug: string
  tag: string
  date: string
  title: string
}

export interface MenuActualitesData {
  rubriques: MenuRubrique[]
  regions: MenuRegion[]
  actualitesParRegion: Record<string, MenuActualite[]>
}

/** Limites d’affichage pour chaque section de mega-menu. */
const MAX_FAMILLES = 4
const MAX_REGIONS = 4
const MAX_CENTRES_PER_REGION = 4
const MAX_FORMATIONS_A_LA_UNE = 4
const MAX_FORMATIONS_PAR_FAMILLE = 4
// Rubriques et régions du méga-menu ne reflètent que les MAX_ACTUALITES
// articles les plus récents — trade-off assumé pour limiter le payload SSR.
const MAX_ACTUALITES = 60
const MAX_REGIONS_ACTUALITES = 6

function humanizeSlug(slug: string): string {
  if (!slug) return ''
  return slug.replaceAll('-', ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

// Même règle que useDirectusList : le payload SSR n'est servi que pendant
// l'hydratation — un mount ultérieur repart sur des données fraîches.
function getCachedData<T>(
  key: string,
  nuxtApp: ReturnType<typeof useNuxtApp>,
  ctx: { cause?: string }
): T | undefined {
  if (ctx.cause !== 'initial' || !nuxtApp.isHydrating) return undefined
  return nuxtApp.payload.data[key] ?? nuxtApp.static.data[key]
}

interface MenuFamillesData {
  familles: MenuFamille[]
  formationsParFamille: Record<string, MenuFormation[]>
  sousFamillesParFamille: Record<string, MenuSousFamille[]>
}

interface FamilleMenuContent {
  formations: MenuFormation[]
  subFamilyCounts: Record<string, number>
}

/** Formations d'une famille (méga-menu) + compteurs par sous-famille (menu mobile). */
async function fetchFamilleMenuContent(
  apiBase: string,
  familles: MenuFamille[],
  headers: Record<string, string> | undefined
): Promise<Record<string, FamilleMenuContent>> {
  const entries = await Promise.all(
    familles.map(async (famille) => {
      try {
        const result = await $fetch<CoursePage>(`${apiBase}/courses`, {
          query: { family: famille.slug, limit: MAX_FORMATIONS_PAR_FAMILLE, page: 1 },
          headers
        })
        return [
          famille.slug,
          {
            formations: result.items.map((course) => ({
              slug: course.slug,
              label: course.title,
              to: `/formations/${famille.slug}/${course.slug}`,
              meta: buildMeta(course)
            })),
            subFamilyCounts: result.facets?.subFamilies ?? {}
          }
        ] as const
      } catch (error) {
        if (import.meta.server) {
          logServerError('[useMenuFamilles] /courses fetch failed:', error)
        }
        return [famille.slug, { formations: [], subFamilyCounts: {} }] as const
      }
    })
  )
  return Object.fromEntries(entries)
}

/** Familles + formations par famille — un seul useAsyncData partagé (payload SSR). */
function useMenuFamillesData() {
  const config = useRuntimeConfig()
  const apiBase = import.meta.server ? config.apiBase : config.public.apiBase
  const directus = useDirectusClient()

  const { data } = useAsyncData<MenuFamillesData>(
    'menu-familles',
    async () => {
      const [names, sousFamillesList, counts] = await Promise.all([
        directus
          .request<FamilleFormation[]>(
            readItems('familles_formation', {
              fields: ['slug', 'name'],
              filter: { status: { _eq: 'published' } },
              limit: -1
            })
          )
          .catch((error: unknown) => {
            if (import.meta.server) {
              logServerError('[useMenuFamilles] familles_formation fetch failed:', error)
            }
            return [] as FamilleFormation[]
          }),
        directus
          .request<SousFamilleFormation[]>(
            readItems('sous_familles_formation', {
              fields: ['slug', 'name', 'famille.slug'],
              filter: { status: { _eq: 'published' } },
              sort: ['sort', 'name'],
              limit: -1
            })
          )
          .catch((error: unknown) => {
            if (import.meta.server) {
              logServerError('[useMenuFamilles] sous_familles_formation fetch failed:', error)
            }
            return [] as SousFamilleFormation[]
          }),
        (internalSsrHeaders(config)
          ? $fetch<FamilyWithCount[]>(`${apiBase}/families`, {
              headers: internalSsrHeaders(config)
            })
          : $fetch<FamilyWithCount[]>(`${apiBase}/families`)
        ).catch((error: unknown) => {
          if (import.meta.server) {
            logServerError('[useMenuFamilles] /families fetch failed:', error)
          }
          return null as FamilyWithCount[] | null
        })
      ])

      const nameBySlug = new Map<string, string>()
      for (const family of names) {
        if (family.slug && family.name) nameBySlug.set(family.slug, family.name)
      }

      // Si /families échoue mais Directus a des noms, on affiche quand même les familles (count = 0).
      const familles =
        counts === null && nameBySlug.size > 0
          ? [...nameBySlug.entries()]
              .map(([slug, label]) => ({ slug, label, count: 0 }))
              .sort((a, b) => a.label.localeCompare(b.label))
              .slice(0, MAX_FAMILLES)
          : (counts ?? [])
              .map((family) => ({
                slug: family.slug,
                label: nameBySlug.get(family.slug) ?? humanizeSlug(family.slug),
                count: family.count
              }))
              .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
              .slice(0, MAX_FAMILLES)

      // Noms des sous-familles groupés par slug de famille (relation M2O
      // résolue via `famille.slug` dans les fields).
      const sousFamilleNamesByFamille = new Map<string, Map<string, string>>()
      for (const sousFamille of sousFamillesList) {
        const familleSlug =
          typeof sousFamille.famille === 'object' && sousFamille.famille
            ? sousFamille.famille.slug
            : null
        if (!familleSlug || !sousFamille.slug || !sousFamille.name) continue
        const bySlug = sousFamilleNamesByFamille.get(familleSlug) ?? new Map<string, string>()
        bySlug.set(sousFamille.slug, sousFamille.name)
        sousFamilleNamesByFamille.set(familleSlug, bySlug)
      }

      const contenuParFamille = await fetchFamilleMenuContent(
        apiBase,
        familles,
        internalSsrHeaders(config)
      )

      const formationsParFamille = Object.fromEntries(
        Object.entries(contenuParFamille).map(([slug, content]) => [slug, content.formations])
      )

      // Sous-familles peuplées (facettes /courses par famille) : les slugs
      // sans nom Directus sont humanisés en repli, les « 0 formation » masqués.
      const sousFamillesParFamille = Object.fromEntries(
        familles.map((famille) => {
          const subFamilyCounts = contenuParFamille[famille.slug]?.subFamilyCounts ?? {}
          const names = sousFamilleNamesByFamille.get(famille.slug)
          const items: MenuSousFamille[] = []
          for (const [slug, name] of names ?? []) {
            const count = subFamilyCounts[slug] ?? 0
            if (count > 0) items.push({ slug, label: name, count })
          }
          for (const [slug, count] of Object.entries(subFamilyCounts)) {
            if (count > 0 && !names?.has(slug)) {
              items.push({ slug, label: humanizeSlug(slug), count })
            }
          }
          items.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
          return [famille.slug, items]
        })
      )

      return { familles, formationsParFamille, sousFamillesParFamille }
    },
    {
      getCachedData: (key, nuxtApp, ctx) => getCachedData<MenuFamillesData>(key, nuxtApp, ctx)
    }
  )

  return data
}

/** Familles depuis le catalogue API (`/families`) + noms Directus — max MAX_FAMILLES. */
export function useMenuFamilles() {
  const data = useMenuFamillesData()
  return computed(() => data.value?.familles ?? [])
}

/** Formations de chaque famille affichée — colonne centrale du méga-menu. */
export function useMenuFormationsParFamille() {
  const data = useMenuFamillesData()
  return computed(() => data.value?.formationsParFamille ?? {})
}

/** Sous-familles peuplées de chaque famille — accordéons du menu mobile. */
export function useMenuSousFamillesParFamille() {
  const data = useMenuFamillesData()
  return computed(() => data.value?.sousFamillesParFamille ?? {})
}

/** Centres publiés, groupés par région pour les menus. */
export function useMenuCentres() {
  const centres = useDirectusList<Centre>('centres', 'menu-centres', {
    fields: ['slug', 'name', 'city', 'department', 'region'],
    filter: { status: { _eq: 'published' } },
    limit: -1,
    sort: ['sort', 'name']
  })

  const fullCentresParRegion = computed(() => {
    const map = new Map<string, MenuCentre[]>()
    for (const centre of centres.value ?? []) {
      const region = centre.region?.trim() || 'Autres régions'
      const list = map.get(region) ?? []
      list.push({
        slug: centre.slug,
        name: centre.name,
        city: centre.city,
        department: centre.department,
        region: centre.region
      })
      map.set(region, list)
    }
    return map
  })

  const centresParRegion = computed(() => {
    const map = new Map<string, MenuCentre[]>()
    for (const [region, list] of fullCentresParRegion.value) {
      map.set(
        region,
        list.length > MAX_CENTRES_PER_REGION ? list.slice(0, MAX_CENTRES_PER_REGION) : list
      )
    }
    return map
  })

  const regions = computed<MenuRegion[]>(() =>
    [...fullCentresParRegion.value.entries()]
      .map(([label, list]) => ({ slug: slugify(label), label, count: list.length }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
      .slice(0, MAX_REGIONS)
  )

  return { regions, centresParRegion }
}

/** Quatre dernières formations publiées — colonne « À la une » du méga-menu. */
export function useMenuFormationsALaUne() {
  const config = useRuntimeConfig()
  const apiBase = import.meta.server ? config.apiBase : config.public.apiBase

  const { data } = useAsyncData<MenuFormation[]>(
    'menu-formations-une',
    async () => {
      try {
        const result = await $fetch<Paginated<CourseListItem>>(`${apiBase}/courses`, {
          query: { limit: MAX_FORMATIONS_A_LA_UNE, page: 1, sort: 'updatedAt', order: 'desc' },
          headers: internalSsrHeaders(config)
        })
        return result.items.map((course) => ({
          slug: course.slug,
          label: course.title,
          to: course.familySlug ? `/formations/${course.familySlug}/${course.slug}` : '/formations'
        }))
      } catch (error) {
        if (import.meta.server) {
          logServerError('[useMenuFormationsALaUne] /courses fetch failed:', error)
        }
        return [] as MenuFormation[]
      }
    },
    {
      getCachedData: (key, nuxtApp, ctx) => getCachedData<MenuFormation[]>(key, nuxtApp, ctx)
    }
  )

  return data
}

/**
 * Précharge les données des méga-menus pendant le SSR — appelé par AppHeader.
 * Sans cela, les useAsyncData ne se déclenchent qu'au montage des panneaux
 * (premier clic) et le menu grandit quand les données arrivent.
 */
export function useMenuPreload() {
  useMenuFamillesData()
  useMenuCentres()
  useMenuActualites()
  useMenuFormationsALaUne()
  useMenuLegalPages()
}

/** Actualités publiées regroupées pour le méga-menu et le menu mobile. */
export function useMenuActualites() {
  const directus = useDirectusClient()

  const { data } = useAsyncData<MenuActualitesData>(
    'menu-actualites',
    async () => {
      try {
        const articles = await directus.request<Article[]>(
          readItems('articles', {
            fields: ['slug', 'title', 'category', 'region', 'publish_at'],
            filter: { status: { _eq: 'published' } },
            sort: ['-publish_at'],
            limit: MAX_ACTUALITES
          })
        )

        const categoryLabels = new Map<string, string>()
        const regionArticles = new Map<string, { label: string; articles: MenuActualite[] }>()

        for (const article of articles) {
          if (article.category?.trim()) {
            const slug = slugify(article.category)
            categoryLabels.set(slug, article.category.trim())
          }

          if (!article.region?.trim()) continue
          const regionLabel = formatRegionLabel(article.region)
          const regionSlug = slugify(regionLabel)
          const entry = regionArticles.get(regionSlug) ?? { label: regionLabel, articles: [] }

          entry.articles.push({
            slug: article.slug,
            categorySlug: article.category?.trim() ? slugify(article.category) : '',
            tag: article.category?.trim() || 'Actualité',
            date: formatArticleDate(article.publish_at),
            title: article.title
          })
          regionArticles.set(regionSlug, entry)
        }

        const regions = [...regionArticles.entries()]
          .map(([slug, { label, articles: regionArticlesList }]) => ({
            slug,
            label,
            count: regionArticlesList.length
          }))
          .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
          .slice(0, MAX_REGIONS_ACTUALITES)

        const visibleRegionSlugs = new Set(regions.map((region) => region.slug))
        const actualitesParRegion = Object.fromEntries(
          [...regionArticles.entries()]
            .filter(([slug]) => visibleRegionSlugs.has(slug))
            .map(([slug, entry]) => [slug, entry.articles])
        )

        return {
          rubriques: [
            { slug: 'toute-actualite', label: 'Toute l’actualité du réseau' },
            ...[...categoryLabels.entries()]
              .sort(([, first], [, second]) => first.localeCompare(second, 'fr'))
              .map(([slug, label]) => ({ slug, label }))
          ],
          regions,
          actualitesParRegion
        }
      } catch (error) {
        if (import.meta.server) {
          logServerError('[useMenuActualites] articles fetch failed:', error)
        }
        return { rubriques: [], regions: [], actualitesParRegion: {} }
      }
    },
    {
      getCachedData: (key, nuxtApp, ctx) => getCachedData<MenuActualitesData>(key, nuxtApp, ctx)
    }
  )

  return {
    rubriques: computed(() => data.value?.rubriques ?? []),
    regions: computed(() => data.value?.regions ?? []),
    actualitesParRegion: computed(() => data.value?.actualitesParRegion ?? {})
  }
}

export interface MenuLegalPage {
  slug: string
  label: string
  /** false = page hors onglets (ex. cookies), mais liée dans les menus/footer. */
  showInTabs: boolean
}

/**
 * Pages légales publiées — source unique pour les méga-menus, le menu mobile,
 * le footer et les onglets de la page [slug]. Dégradée à [] en cas d'erreur.
 */
export function useMenuLegalPages() {
  const pages = useDirectusList<Pick<PageLegale, 'slug' | 'label' | 'show_in_tabs'>>(
    'pages_legales',
    'menu-pages-legales',
    {
      fields: ['slug', 'label', 'show_in_tabs'],
      filter: { status: { _eq: 'published' } },
      sort: ['sort'],
      limit: -1
    }
  )

  return computed<MenuLegalPage[]>(() =>
    (pages.value ?? []).map((page) => ({
      slug: page.slug,
      label: page.label,
      showInTabs: page.show_in_tabs !== false
    }))
  )
}
