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
  centerSlug: string | null
  centerSlugs: string[]
  modalities: string[]
  sessions: CourseSession[] | null
  imageUrl: string | null
  generatedProgramUrl: string | null
  status: string
  seoTitle: string | null
  seoDescription: string | null
  seoCanonical: string | null
}

export type CourseListItem = CourseBase

export interface Course extends CourseBase {
  blocks: unknown[] | null
  targets: string[] | null
  prerequisites: string[] | null
  evaluation: string[] | null
  createdAt: string
  updatedAt: string
}
