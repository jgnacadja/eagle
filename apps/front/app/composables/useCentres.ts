import type { CentreListItem } from '@learnup/types'
import { toValue, type MaybeRefOrGetter } from 'vue'

export interface CentresQuery {
  department?: string
  search?: string
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
          query: buildCentresParams(toValue(query))
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
      // getCachedData est consulté à chaque execute() — ne servir le
      // payload qu'à l'initialisation, sinon les refetches watch
      // retournent les données périmées (cf. useCatalog).
      getCachedData: (key, nuxtApp, ctx) =>
        ctx.cause === 'initial'
          ? ((nuxtApp.payload.data[key] ?? nuxtApp.static.data[key]) as
              CentreListItem[] | undefined)
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
        return await $fetch<string[]>(`${apiBase}/centres/departments`)
      } catch (err) {
        if (import.meta.server) {
          logServerError('[useCentreDepartments] departments fetch failed:', err)
        }
        return []
      }
    },
    {
      getCachedData: (key, nuxtApp, ctx) =>
        ctx.cause === 'initial'
          ? ((nuxtApp.payload.data[key] ?? nuxtApp.static.data[key]) as string[] | undefined)
          : undefined
    }
  )
}
