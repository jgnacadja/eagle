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
  imageUrl: string | null
  status: string
  seoTitle: string | null
  seoDescription: string | null
  seoCanonical: string | null
}

export type CourseListItem = CourseBase

export interface Course extends CourseBase {
  blocks: unknown[] | null
  createdAt: string
  updatedAt: string
}
