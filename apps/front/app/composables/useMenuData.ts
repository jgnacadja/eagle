// composables/useMenuData.ts
// Données des méga-menus et du menu mobile — chargées en SSR une seule fois
// (clés useAsyncData stables → dédupliquées et embarquées dans le payload).
// Sources : Directus (familles_formation, centres) + API catalogue (/families,
// /courses). Dégradation gracieuse : [] en cas d'erreur, log serveur.

import { readItems } from '@directus/sdk'
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

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(DIACRITIC_PATTERN, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/** Familles Directus fusionnées avec les compteurs du catalogue (`/families`). */
export async function useMenuFamilles() {
  const directus = useDirectusClient()
  const config = useRuntimeConfig()

  const { data } = await useAsyncData<MenuFamille[]>('menu-familles', async () => {
    const [familles, counts] = await Promise.all([
      directus
        .request<FamilleFormation[]>(
          readItems('familles_formation', {
            fields: ['slug', 'name'],
            filter: { status: { _eq: 'published' } },
            limit: -1,
            sort: ['sort', 'name']
          })
        )
        .catch((error: unknown) => {
          if (import.meta.server) {
            logServerError('[useMenuFamilles] familles_formation fetch failed:', error)
          }
          return [] as FamilleFormation[]
        }),
      $fetch<FamilyWithCount[]>(`${config.public.apiBase}/families`).catch((error: unknown) => {
        if (import.meta.server) {
          logServerError('[useMenuFamilles] /families fetch failed:', error)
        }
        return [] as FamilyWithCount[]
      })
    ])

    const countMap = new Map(counts.map((c) => [c.slug, c.count]))
    const names = new Map(familles.map((f) => [f.slug, f.name]))
    const slugs = new Set<string>([...names.keys(), ...countMap.keys()])

    return [...slugs]
      .map((slug) => ({
        slug,
        label: names.get(slug) ?? slug,
        count: countMap.get(slug) ?? 0
      }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
  })

  return data
}

/** Centres publiés, groupés par région pour les menus. */
export async function useMenuCentres() {
  const centres = await useDirectusList<Centre>('centres', 'menu-centres', {
    fields: ['slug', 'name', 'city', 'department', 'region'],
    filter: { status: { _eq: 'published' } },
    limit: -1,
    sort: ['sort', 'name']
  })

  const centresParRegion = computed(() => {
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

  const regions = computed<MenuRegion[]>(() =>
    [...centresParRegion.value.entries()]
      .map(([label, list]) => ({ slug: slugify(label), label, count: list.length }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
  )

  return { regions, centresParRegion }
}

/** Trois dernières formations publiées — colonne « À la une » du méga-menu. */
export async function useMenuFormationsALaUne() {
  const config = useRuntimeConfig()

  const { data } = await useAsyncData<MenuFormation[]>('menu-formations-une', async () => {
    try {
      const result = await $fetch<Paginated<CourseListItem>>(`${config.public.apiBase}/courses`, {
        query: { limit: 3, page: 1, sort: 'updatedAt', order: 'desc' }
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
  })

  return data
}
