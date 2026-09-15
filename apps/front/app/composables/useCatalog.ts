import type { CourseListItem, CoursePage, CourseSession } from '@learnup/types'
import { toValue, type MaybeRefOrGetter } from 'vue'
import { directusAssetUrl } from '~/utils/directusAsset'
import { placesLabel } from '~/utils/placesLabel'
import { MODALITY_LABELS } from '~/utils/catalog-filters'

export interface CatalogQuery {
  search?: string
  family?: string
  subFamily?: string
  page?: number
  limit?: number
  sort?: 'updatedAt' | 'duration' | 'price' | 'name' | 'relevance'
  order?: 'asc' | 'desc'
  cpf?: boolean
  certifying?: boolean
  durations?: string[]
  modalities?: string[]
  location?: string
  center?: string
}

export interface FormationItem {
  slug: string
  family: string
  familyKey: string
  subFamily: string | null
  title: string
  description: string
  meta: string
  days: number
  duration: 'courte' | 'moyenne' | 'longue'
  certifications: string[]
  status?: { type: 'success' | 'warning' | 'neutral'; label: string }
  image: string | null
  to: string | null
}

export function buildDuration(course: CourseListItem): 'courte' | 'moyenne' | 'longue' {
  const hours = course.durationHours ?? 0
  if (hours > 0) {
    if (hours <= 8) return 'courte'
    if (hours <= 40) return 'moyenne'
    return 'longue'
  }

  const days = course.durationDays ?? 1
  if (days <= 1) return 'courte'
  if (days <= 5) return 'moyenne'
  return 'longue'
}

export function buildMeta(course: CourseListItem): string {
  const parts: string[] = []
  if (course.durationDays) parts.push(`${course.durationDays} jours`)
  const modalities = (course.modalities ?? []).map((m) => MODALITY_LABELS[m] ?? m).join(' / ')
  if (modalities) parts.push(modalities)
  if (course.certification) parts.push(course.certification)
  if (course.certifierName && course.certifierName !== course.certification) {
    parts.push(course.certifierName)
  }
  return parts.join(' · ')
}

export function buildCertifications(course: CourseListItem): string[] {
  const certs: string[] = []
  const text = [course.certification, course.certifierName]
    .filter((v): v is string => typeof v === 'string' && v.length > 0)
    .join(' ')
    .toLowerCase()

  if (course.certification) certs.push('certification')
  if (text.includes('habilitation')) certs.push('habilitation')
  if (text.includes('recyclage')) certs.push('recyclage')
  if (text.includes('reglementaire') || text.includes('réglementaire')) certs.push('reglementaire')

  return certs
}

// Une session est « à venir » si sa date de début est aujourd'hui ou plus
// tard : on compare au début du jour courant (UTC) pour ne pas exclure les
// sessions du jour même.
function startOfTodayUtc(): Date {
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  return today
}

export function upcomingSessions(course: CourseListItem): CourseSession[] {
  const today = startOfTodayUtc()
  return (course.sessions ?? []).filter((s) => {
    if (!s.startDate) return false
    return new Date(`${s.startDate}T00:00:00Z`) >= today
  })
}

// Tag de disponibilité affiché sur les cartes : priorité aux places
// restantes faibles (warning), sinon la prochaine session datée.
// Badge sessions du hero : « Sessions ce mois-ci » si une session démarre
// dans le mois courant, sinon « Sessions programmées » dès qu'une session
// future existe. null si aucune session à venir.
export function buildSessionBadge(course: CourseListItem): string | null {
  const now = new Date()
  const upcoming = upcomingSessions(course)
  if (!upcoming.length) return null

  const thisMonth = upcoming.some((s) => {
    const d = new Date(`${s.startDate}T00:00:00Z`)
    return d.getUTCFullYear() === now.getUTCFullYear() && d.getUTCMonth() === now.getUTCMonth()
  })
  return thisMonth ? 'Sessions ce mois-ci' : 'Sessions programmées'
}

// Badge de disponibilité d'une carte formation : « N places disponibles »
// en warning quand la prochaine session est tendue, « Sessions ce mois-ci »
// quand une session démarre bientôt, date sinon ; « Sur demande » neutre
// quand aucune session n'est publiée (formation organisable).
export function buildStatus(
  course: CourseListItem
): { type: 'success' | 'warning' | 'neutral'; label: string } | undefined {
  const upcoming = upcomingSessions(course).sort((a, b) =>
    (a.startDate ?? '').localeCompare(b.startDate ?? '')
  )[0]
  if (!upcoming?.startDate) return { type: 'neutral', label: 'Sur demande' }

  const seats = upcoming.seatsRemaining
  if (seats != null && seats <= 3) {
    return { type: 'warning', label: placesLabel(seats) }
  }

  const date = new Date(`${upcoming.startDate}T00:00:00Z`)
  const now = new Date()
  const thisMonth =
    date.getUTCFullYear() === now.getUTCFullYear() && date.getUTCMonth() === now.getUTCMonth()
  if (thisMonth) return { type: 'success', label: 'Sessions ce mois-ci' }

  const short = new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    timeZone: 'UTC'
  }).format(date)
  return { type: 'success', label: `Prochaine session le ${short}` }
}

export function mapCourse(course: CourseListItem, familyName?: string): FormationItem {
  const familySlug = course.familySlug
  const familyKey = familySlug ?? 'autre'

  return {
    slug: course.slug,
    family: familyName ?? familySlug ?? 'Autre',
    familyKey,
    subFamily: course.subFamilyName ?? null,
    title: course.title,
    description: course.description ?? '',
    meta: buildMeta(course),
    days: course.durationDays ?? 0,
    duration: buildDuration(course),
    certifications: buildCertifications(course),
    image: directusAssetUrl(course.image) ?? course.imageUrl ?? null,
    status: buildStatus(course),
    to: familySlug ? `/formations/${familySlug}/${course.slug}` : null
  }
}

export type CatalogApiResult = CoursePage

export async function useCatalog(query: MaybeRefOrGetter<CatalogQuery>) {
  const config = useRuntimeConfig()
  const apiBase = import.meta.server ? config.apiBase : config.public.apiBase

  // Clé dérivée de la requête : deux pages (catalogue, famille, fiche) ne
  // doivent pas partager le cache useAsyncData, sinon navigation client =
  // données périmées de la page précédente.
  const { data, pending, error, refresh } = await useAsyncData<CatalogApiResult>(
    `catalog:${JSON.stringify(buildApiQuery(toValue(query)))}`,
    async () => {
      try {
        const headers = internalSsrHeaders(config)
        return await $fetch<CatalogApiResult>(`${apiBase}/courses`, {
          query: buildApiQuery(toValue(query)),
          headers
        })
      } catch (err) {
        if (import.meta.server) {
          logServerError('[useCatalog] catalog fetch failed:', err)
        }
        throw err
      }
    },
    {
      watch: [() => toValue(query)],
      // Le payload SSR n'est servi que pendant l'hydratation. Ensuite tout
      // mount/refetch va chercher des données fraîches : sinon un résultat
      // vide ou transitoire (filtre, 429, sync incomplète) restait servi
      // toute la session — « aucun résultat » figé au retour sur la page.
      getCachedData: (key, nuxtApp, ctx) =>
        ctx.cause === 'initial' && nuxtApp.isHydrating
          ? ((nuxtApp.payload.data[key] ?? nuxtApp.static.data[key]) as
              CatalogApiResult | undefined)
          : undefined
    }
  )

  return { data, pending, error, refresh }
}

function buildApiQuery(query: CatalogQuery): Record<string, unknown> {
  const params: Record<string, unknown> = {
    limit: query.limit ?? 9,
    page: query.page ?? 1
  }

  if (query.search?.trim()) params.search = query.search.trim()
  if (query.family) params.family = query.family
  if (query.subFamily) params.subFamily = query.subFamily
  if (query.cpf === true) params.cpf = true
  if (query.certifying === true) params.certifying = true
  if (query.durations?.length) params.durations = query.durations.join(',')
  if (query.modalities?.length) params.modalities = query.modalities.join(',')
  if (query.location?.trim()) params.location = query.location.trim()
  if (query.center) params.center = query.center
  if (query.sort) params.sort = query.sort
  if (query.order) params.order = query.order

  return params
}
