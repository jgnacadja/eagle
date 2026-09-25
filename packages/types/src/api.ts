export interface ApiError {
  statusCode: number
  message: string
  timestamp: string
  path: string
}

export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

/**
 * Compteurs de facettes du catalogue : chaque dimension est calculée sur le
 * résultat filtré en ignorant son propre filtre (facettage standard), pour
 * que le front n'affiche que les options qui renvoient des résultats.
 */
export interface CatalogFacets {
  families: Record<string, number>
  subFamilies: Record<string, number>
  modalities: Record<string, number>
  durations: Record<string, number>
  locations: Record<string, number>
  cpf: number
  certifying: number
}

export interface CoursePage extends Paginated<CourseListItem> {
  facets: CatalogFacets
}

export interface CourseSessionLocation {
  name: string | null
  city: string | null
  postalCode: string | null
  department: string | null
  region: string | null
  centreSlug: string | null
}

export interface CourseSession {
  id: string | null
  startDate: string | null
  endDate: string | null
  modality: string | null
  seatsRemaining: number | null
  location: CourseSessionLocation | null
}

export interface CourseBase {
  id: number
  slug: string
  title: string
  description: string | null
  durationDays: number | null
  durationHours: number | null
  price: number | null
  cpf: boolean | null
  cpfCode: string | null
  certification: string | null
  certifierName: string | null
  category: string | null
  familySlug: string | null
  subFamilySlug: string | null
  subFamilyName: string | null
  centerSlug: string | null
  centerSlugs: string[]
  modalities: string[]
  sessions: CourseSession[] | null
  /** Id du fichier Directus (champ éditorial `image`) — sert via `/directus/assets/{id}`. */
  image: string | null
  imageUrl: string | null
  generatedProgramUrl: string | null
  status: string
  seoTitle: string | null
  seoDescription: string | null
  seoCanonical: string | null
}

export type CourseListItem = CourseBase

export interface CoursePedagogyItem {
  title: string
  description: string | null
}

export interface Course extends CourseBase {
  blocks: unknown[] | null
  targets: string[] | null
  prerequisites: string[] | null
  pedagogy: CoursePedagogyItem[] | null
  evaluation: string[] | null
  validity: string | null
  createdAt: string
  updatedAt: string
}
