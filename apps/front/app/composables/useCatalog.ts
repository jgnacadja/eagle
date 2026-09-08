import type { CourseListItem, CourseSession, Paginated } from '@learnup/types'
import { toValue, type MaybeRefOrGetter } from 'vue'

export interface CatalogQuery {
  search?: string
  family?: string
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

export function buildStatus(
  course: CourseListItem
): { type: 'success' | 'warning' | 'neutral'; label: string } | undefined {
  const upcoming = upcomingSessions(course).sort((a, b) =>
    (a.startDate ?? '').localeCompare(b.startDate ?? '')
  )[0]
  if (!upcoming?.startDate) return undefined

  const date = new Date(`${upcoming.startDate}T00:00:00Z`)
  const short = new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    timeZone: 'UTC'
  }).format(date)

  const seats = upcoming.seatsRemaining
  if (seats != null && seats <= 3) {
    return { type: 'warning', label: `${seats} place${seats > 1 ? 's' : ''} le ${short}` }
  }

  const now = new Date()
  const thisMonth =
    date.getUTCFullYear() === now.getUTCFullYear() && date.getUTCMonth() === now.getUTCMonth()
  return thisMonth
    ? { type: 'success', label: 'Sessions ce mois-ci' }
    : { type: 'success', label: `Prochaine session le ${short}` }
}

export function mapCourse(course: CourseListItem, familyName?: string): FormationItem {
  const familySlug = course.familySlug
  const familyKey = familySlug ?? 'autre'

  return {
    slug: course.slug,
    family: familyName ?? familySlug ?? 'Autre',
    familyKey,
    title: course.title,
    description: course.description ?? '',
    meta: buildMeta(course),
    days: course.durationDays ?? 0,
    duration: buildDuration(course),
    certifications: buildCertifications(course),
    image: course.imageUrl ?? null,
    status: buildStatus(course),
    to: familySlug ? `/formations/${familySlug}/${course.slug}` : null
  }
}

export type CatalogApiResult = Paginated<CourseListItem>

export async function useCatalog(query: MaybeRefOrGetter<CatalogQuery>) {
  const config = useRuntimeConfig()

  // Clé dérivée de la requête : deux pages (catalogue, famille, fiche) ne
  // doivent pas partager le cache useAsyncData, sinon navigation client =
  // données périmées de la page précédente.
  const { data, pending, error, refresh } = await useAsyncData<CatalogApiResult>(
    `catalog:${JSON.stringify(buildApiQuery(toValue(query)))}`,
    async () => {
      try {
        return await $fetch<CatalogApiResult>(`${config.public.apiBase}/courses`, {
          query: buildApiQuery(toValue(query))
        })
      } catch (err) {
        if (import.meta.server) {
          logServerError('[useCatalog] catalog fetch failed:', err)
        }
        throw err
      }
    },
    {
      watch: [() => toValue(query)]
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
