// composables/useMenuData.ts
// Données des méga-menus et du menu mobile — chargées en SSR une seule fois
// (clés useAsyncData stables → dédupliquées et embarquées dans le payload).
// Sources : API catalogue (/families) + Directus (centres).
// Dégradation gracieuse : [] en cas d'erreur, log serveur.

import { readItems } from '@directus/sdk'
import { buildMeta } from '~/composables/useCatalog'
import type {
  Centre,
  CourseListItem,
  FamilleFormation,
  FamilyWithCount,
  Paginated
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

const DIACRITIC_PATTERN = /[̀-ͯ]/g

/** Limites d’affichage pour chaque section de mega-menu. */
const MAX_FAMILLES = 4
const MAX_REGIONS = 4
const MAX_CENTRES_PER_REGION = 4
const MAX_FORMATIONS_A_LA_UNE = 6
const MAX_FORMATIONS_PAR_FAMILLE = 4

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(DIACRITIC_PATTERN, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function humanizeSlug(slug: string): string {
  if (!slug) return ''
  return slug.replaceAll('-', ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function getCachedData<T>(key: string, nuxtApp: ReturnType<typeof useNuxtApp>): T | undefined {
  return nuxtApp.payload.data[key] ?? nuxtApp.static.data[key]
}

interface MenuFamillesData {
  familles: MenuFamille[]
  formationsParFamille: Record<string, MenuFormation[]>
}

/** Formations d'une famille pour la colonne centrale du méga-menu. */
async function fetchFormationsParFamille(
  apiBase: string,
  familles: MenuFamille[]
): Promise<Record<string, MenuFormation[]>> {
  const entries = await Promise.all(
    familles.map(async (famille) => {
      try {
        const result = await $fetch<Paginated<CourseListItem>>(`${apiBase}/courses`, {
          query: { family: famille.slug, limit: MAX_FORMATIONS_PAR_FAMILLE, page: 1 }
        })
        return [
          famille.slug,
          result.items.map((course) => ({
            slug: course.slug,
            label: course.title,
            to: `/formations/${famille.slug}/${course.slug}`,
            meta: buildMeta(course)
          }))
        ] as const
      } catch (error) {
        if (import.meta.server) {
          logServerError('[useMenuFamilles] /courses fetch failed:', error)
        }
        return [famille.slug, []] as const
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
      const [names, counts] = await Promise.all([
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
        $fetch<FamilyWithCount[]>(`${apiBase}/families`).catch((error: unknown) => {
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

      const formationsParFamille = await fetchFormationsParFamille(apiBase, familles)
      return { familles, formationsParFamille }
    },
    {
      getCachedData: (key, nuxtApp) => getCachedData<MenuFamillesData>(key, nuxtApp)
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

/** Six dernières formations publiées — colonne « À la une » du méga-menu. */
export function useMenuFormationsALaUne() {
  const config = useRuntimeConfig()
  const apiBase = import.meta.server ? config.apiBase : config.public.apiBase

  const { data } = useAsyncData<MenuFormation[]>(
    'menu-formations-une',
    async () => {
      try {
        const result = await $fetch<Paginated<CourseListItem>>(`${apiBase}/courses`, {
          query: { limit: MAX_FORMATIONS_A_LA_UNE, page: 1, sort: 'updatedAt', order: 'desc' }
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
      getCachedData: (key, nuxtApp) => getCachedData<MenuFormation[]>(key, nuxtApp)
    }
  )

  return data
}
