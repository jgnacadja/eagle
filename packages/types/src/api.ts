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
