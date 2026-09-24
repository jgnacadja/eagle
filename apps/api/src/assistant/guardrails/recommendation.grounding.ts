import type {
  AssistantAvailability,
  AssistantRecommendation,
  AssistantRecommendationSet,
  CourseListItem,
  CourseSession
} from '@learnup/types'

const LIMITED_SEATS_THRESHOLD = 3

const MODALITY_LABELS: Record<string, string> = {
  presentiel: 'Présentiel',
  distanciel: 'Distanciel',
  hybride: 'Hybride',
  inter: 'Inter',
  intra: 'Intra',
  e_learning: 'E-learning'
}

function startOfTodayUtc(now: Date): Date {
  const today = new Date(now)
  today.setUTCHours(0, 0, 0, 0)
  return today
}

/** Prochaine session réellement programmée — jamais de calendrier fictif (RG-IA-02). */
export function nextSession(course: CourseListItem, now = new Date()): CourseSession | null {
  const today = startOfTodayUtc(now)
  const upcoming = (course.sessions ?? [])
    .filter((session) => session.startDate && new Date(`${session.startDate}T00:00:00Z`) >= today)
    .sort((a, b) => (a.startDate ?? '').localeCompare(b.startDate ?? ''))
  return upcoming[0] ?? null
}

/** Bloc disponibilité issu du référentiel (RG-IA-09), `null` sans session. */
export function availabilityOf(
  course: CourseListItem,
  now = new Date()
): AssistantAvailability | null {
  const session = nextSession(course, now)
  if (!session?.startDate) return null
  const seats = session.seatsRemaining
  return {
    centre: session.location?.name ?? session.location?.city ?? null,
    nextSession: session.startDate,
    seats: seats === null ? null : seats <= LIMITED_SEATS_THRESHOLD ? 'limited' : 'available',
    modality: session.modality
  }
}

/** Attributs factuels : durée, modalités, certification — chip masquée si absent. */
export function attributesOf(course: CourseListItem): string[] {
  const attributes: string[] = []
  if (course.durationDays) {
    attributes.push(`${course.durationDays} jour${course.durationDays > 1 ? 's' : ''}`)
  }
  const modalities = course.modalities.map((m) => MODALITY_LABELS[m] ?? m)
  if (modalities.length) attributes.push(modalities.join(' / '))
  if (course.certification) attributes.push(course.certification)
  return attributes
}

/**
 * Ré-ancre une recommandation sur le catalogue publié : intitulé exact,
 * attributs et disponibilité recalculés depuis le référentiel — l'IA ne
 * décide jamais de ces données.
 */
export function groundRecommendation(
  recommendation: AssistantRecommendation,
  course: CourseListItem,
  now = new Date()
): AssistantRecommendation {
  return {
    course: { title: course.title, slug: course.slug, familySlug: course.familySlug },
    justification: recommendation.justification,
    attributes: attributesOf(course),
    availability: availabilityOf(course, now)
  }
}

export interface GroundingResult {
  set: AssistantRecommendationSet | null
  /** Slugs proposés qui n'existent pas dans le catalogue publié. */
  rejected: string[]
}

/**
 * Grounding 100 % catalogue (RG-IA-01) : toute formation absente du
 * catalogue publié est écartée ; si la principale l'est, la première
 * alternative valide prend sa place ; sans aucune formation valide, le
 * résultat est vide (état « hors catalogue »).
 */
export function groundRecommendationSet(
  set: AssistantRecommendationSet,
  published: ReadonlyMap<string, CourseListItem>,
  now = new Date()
): GroundingResult {
  const rejected: string[] = []
  const grounded: AssistantRecommendation[] = []

  for (const recommendation of [set.principal, ...set.alternatives]) {
    const course = published.get(recommendation.course.slug)
    if (!course) {
      rejected.push(recommendation.course.slug)
      continue
    }
    grounded.push(groundRecommendation(recommendation, course, now))
  }

  const [principal, ...alternatives] = grounded
  if (!principal) return { set: null, rejected }
  return { set: { principal, alternatives, source: set.source }, rejected }
}
