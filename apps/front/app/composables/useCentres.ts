import type { CentreListItem, CourseListItem } from '@learnup/types'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { upcomingSessions, useCatalog } from '~/composables/useCatalog'

export interface CentresQuery {
  department?: string
  search?: string
}

export interface AvailabilityStatus {
  type: 'success' | 'warning' | 'neutral'
  label: string
}

const availabilityDateFmt = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: '2-digit',
  timeZone: 'UTC'
})

/**
 * Sémantique unique des badges de disponibilité : session dans la semaine
 * courante → « Sessions cette semaine », sinon dans le mois courant →
 * « Sessions ce mois-ci », sinon la date de la prochaine en warning, et
 * « Sur demande » neutre quand aucune session n'est à venir.
 * `dates` = startDate ISO des sessions à venir concernées.
 */
export function availabilityStatus(dates: string[]): AvailabilityStatus {
  const sorted = [...dates].sort((a, b) => a.localeCompare(b))
  if (!sorted.length) {
    return { type: 'neutral', label: 'Sur demande' }
  }

  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  // Fin de la semaine courante (dimanche) en UTC — getUTCDay() : 0 = dimanche.
  const endOfWeek = new Date(today)
  endOfWeek.setUTCDate(today.getUTCDate() + ((7 - today.getUTCDay()) % 7))

  const upcoming = sorted.map((d) => new Date(`${d}T00:00:00Z`))
  if (upcoming.some((d) => d <= endOfWeek)) {
    return { type: 'success', label: 'Sessions cette semaine' }
  }
  if (
    upcoming.some(
      (d) =>
        d.getUTCFullYear() === today.getUTCFullYear() && d.getUTCMonth() === today.getUTCMonth()
    )
  ) {
    return { type: 'success', label: 'Sessions ce mois-ci' }
  }
  return {
    type: 'warning',
    label: `Prochaine session le ${availabilityDateFmt.format(upcoming[0]!)}`
  }
}

/**
 * Sessions à venir du catalogue agrégées par slug de centre — Map vide en
 * cas d'échec de l'API catalogue (badges « Sur demande » en dégradé).
 */
export async function useCentreSessionDates() {
  // L'API borne `limit` à 100 : on pagine jusqu'à épuisement plutôt que de
  // demander une page trop grande — rejetée en 400, tous les badges
  // tomberaient en « Sur demande ».
  const courses: CourseListItem[] = []
  for (let page = 1; ; page++) {
    const catalog = await useCatalog({ limit: 100, page }).catch(() => null)
    const result = catalog?.data.value
    if (!result || result.items.length === 0) break
    courses.push(...result.items)
    if (courses.length >= result.total) break
  }
  return computed(() => {
    const grouped = new Map<string, string[]>()
    for (const course of courses) {
      for (const session of upcomingSessions(course)) {
        const slug = session.location?.centreSlug
        if (!slug || !session.startDate) continue
        grouped.set(slug, [...(grouped.get(slug) ?? []), session.startDate])
      }
    }
    return grouped
  })
}

/**
 * Query params transmis à l'API NestJS `/centres`. Le filtrage est fait
 * côté API (chargement + cache Redis, filtrage en mémoire — comme le
 * catalogue) : les champs JSON Directus (`departments_covered`,
 * `specialties`) n'ont pas d'opérateur de filtre utilisable.
 */
export function buildCentresParams(query: CentresQuery): Record<string, string> {
  const params: Record<string, string> = {}
  const department = query.department?.trim()
  const search = query.search?.trim()
  if (department) params.department = department
  if (search) params.search = search
  return params
}

/**
 * Liste des centres via l'API NestJS — refetch à chaque changement de
 * `query`. Dégrade à [] en cas d'échec, loggé côté serveur.
 *
 * Retourné sans `await` : à l'appelant de décider d'attendre ou non, pour
 * qu'en navigation client la page monte tout de suite et `pending` pilote
 * l'état de chargement du champ de recherche.
 */
export function useCentres(query: MaybeRefOrGetter<CentresQuery>) {
  const config = useRuntimeConfig()
  const apiBase = import.meta.server ? config.apiBase : config.public.apiBase

  return useAsyncData<CentreListItem[]>(
    `centres:${JSON.stringify(buildCentresParams(toValue(query)))}`,
    async () => {
      try {
        return await $fetch<CentreListItem[]>(`${apiBase}/centres`, {
          query: buildCentresParams(toValue(query)),
          headers: internalSsrHeaders(config)
        })
      } catch (err) {
        if (import.meta.server) {
          logServerError('[useCentres] centres fetch failed:', err)
        }
        return []
      }
    },
    {
      watch: [() => toValue(query)],
      // Le payload SSR n'est servi que pendant l'hydratation : au-delà,
      // chaque mount/refetch repart sur des données fraîches — un résultat
      // vide transitoire ne doit pas rester figé toute la session.
      getCachedData: (key, nuxtApp, ctx) =>
        ctx.cause === 'initial' && nuxtApp.isHydrating
          ? ((nuxtApp.payload.data[key] ?? nuxtApp.static.data[key]) as
              CentreListItem[] | undefined)
          : undefined
    }
  )
}

/**
 * Nombre total de centres du réseau, indépendant des filtres de la page.
 * Clé dédiée `centres-total` : `useCentres` écrit sous `centres:{…}` et y
 * réécrit le résultat filtré à chaque refetch — partager la clé ferait
 * bouger le total à chaque filtre. On ne stocke que le compteur.
 */
export function useCentresTotal() {
  const config = useRuntimeConfig()
  const apiBase = import.meta.server ? config.apiBase : config.public.apiBase

  return useAsyncData<number>(
    'centres-total',
    async () => {
      try {
        const { count } = await $fetch<{ count: number }>(`${apiBase}/centres/count`, {
          headers: internalSsrHeaders(config)
        })
        return count
      } catch (err) {
        if (import.meta.server) {
          logServerError('[useCentresTotal] centres fetch failed:', err)
        }
        return 0
      }
    },
    {
      getCachedData: (key, nuxtApp, ctx) =>
        ctx.cause === 'initial' && nuxtApp.isHydrating
          ? ((nuxtApp.payload.data[key] ?? nuxtApp.static.data[key]) as number | undefined)
          : undefined
    }
  )
}

/**
 * Liste des valeurs de département pour le filtre — endpoint dédié de
 * l'API, puisque la liste filtrée ne couvre que le département courant.
 */
export function useCentreDepartments() {
  const config = useRuntimeConfig()
  const apiBase = import.meta.server ? config.apiBase : config.public.apiBase

  return useAsyncData<string[]>(
    'centres-departments',
    async () => {
      try {
        const headers = internalSsrHeaders(config)
        // L'API est la source unique de normalisation : les codes
        // `departments_covered` y sont déjà traduits en noms dédupliqués.
        return await (headers
          ? $fetch<string[]>(`${apiBase}/centres/departments`, { headers })
          : $fetch<string[]>(`${apiBase}/centres/departments`))
      } catch (err) {
        if (import.meta.server) {
          logServerError('[useCentreDepartments] departments fetch failed:', err)
        }
        return []
      }
    },
    {
      getCachedData: (key, nuxtApp, ctx) =>
        ctx.cause === 'initial' && nuxtApp.isHydrating
          ? ((nuxtApp.payload.data[key] ?? nuxtApp.static.data[key]) as string[] | undefined)
          : undefined
    }
  )
}
