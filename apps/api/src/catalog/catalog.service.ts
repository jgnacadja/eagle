import { Injectable, Logger } from '@nestjs/common'
import type {
  Course,
  CourseListItem,
  CourseSession,
  FamilyWithCount,
  Paginated
} from '@learnup/types'
import { CacheService } from '../common/cache/cache.service'
import {
  DirectusCatalogService,
  type DirectusFormation,
  type FamilyApplyResult
} from '../directus/directus.catalog.service'
import { CourseSortField, CourseSortOrder, type ListCoursesDto } from './catalog.dto'

function toNumber(value: unknown): number | null {
  if (value == null) return null
  const parsed = Number(value)
  return Number.isNaN(parsed) ? null : parsed
}

function toIsoString(value: unknown): string {
  return value instanceof Date ? value.toISOString() : String(value)
}

function slugifyCategory(value: string): string {
  const slug = value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')

  let start = 0
  let end = slug.length
  while (start < end && slug[start] === '-') start++
  while (end > start && slug[end - 1] === '-') end--
  return slug.slice(start, end)
}

type UnknownRecord = Record<string, unknown>

function toNullableString(value: unknown): string | null {
  return typeof value === 'string' ? value : null
}

function toNullableNumber(value: unknown): number | null {
  return typeof value === 'number' ? value : null
}

function mapSessionLocation(raw: UnknownRecord): CourseSession['location'] {
  const location = raw['location']
  if (!location || typeof location !== 'object') return null

  const loc = location as UnknownRecord
  return {
    name: toNullableString(loc['name']),
    city: toNullableString(loc['city']),
    postalCode: toNullableString(loc['postalCode']),
    department: toNullableString(loc['department']),
    region: toNullableString(loc['region']),
    centreSlug: toNullableString(loc['centreSlug'])
  }
}

function mapSessionEntry(entry: unknown): CourseSession | null {
  if (!entry || typeof entry !== 'object') return null

  const raw = entry as UnknownRecord
  return {
    id: toNullableString(raw['id']),
    startDate: toNullableString(raw['startDate']),
    endDate: toNullableString(raw['endDate']),
    modality: toNullableString(raw['modality']),
    seatsRemaining: toNullableNumber(raw['seatsRemaining']),
    location: mapSessionLocation(raw)
  }
}

function mapSessions(value: unknown): CourseSession[] | null {
  if (!Array.isArray(value)) return null

  const sessions = value.map(mapSessionEntry).filter((s): s is CourseSession => s !== null)

  return sessions.length > 0 ? sessions : null
}

function extractTexts(rawPayload: unknown, key: string): string[] | null {
  if (!rawPayload || typeof rawPayload !== 'object') return null
  const entries = (rawPayload as Record<string, unknown>)[key]
  if (!Array.isArray(entries)) return null

  const texts = entries
    .map((entry) =>
      entry && typeof entry === 'object' && 'text' in entry
        ? (entry as { text?: unknown }).text
        : null
    )
    .filter((text): text is string => typeof text === 'string' && text.trim().length > 0)

  return texts.length > 0 ? texts : null
}

function toListItem(raw: DirectusFormation): CourseListItem {
  return {
    id: raw.id,
    slug: raw.slug,
    title: raw.title,
    description: raw.description,
    durationDays: toNumber(raw.duration_days),
    durationHours: toNumber(raw.duration_hours),
    price: toNumber(raw.price),
    cpf: raw.cpf,
    cpfCode: raw.cpf_code,
    certification: raw.certification,
    certifierName: raw.certifier_name,
    category: raw.category_name,
    familySlug: raw.famille?.slug ?? null,
    centerSlug: raw.center_slug,
    centerSlugs: (raw.center_slugs as string[]) ?? [],
    modalities: (raw.modalities as string[]) ?? [],
    sessions: mapSessions(raw.sessions),
    imageUrl: raw.image_url,
    generatedProgramUrl: raw.generated_program_url,
    status: raw.status,
    seoTitle: raw.seo_title,
    seoDescription: raw.seo_description,
    seoCanonical: raw.seo_canonical
  }
}

function toCourse(raw: DirectusFormation): Course {
  return {
    ...toListItem(raw),
    blocks: Array.isArray(raw.blocks) ? (raw.blocks as unknown[]) : null,
    targets: extractTexts(raw.raw, 'targets'),
    prerequisites: extractTexts(raw.raw, 'prerequisites'),
    evaluation: extractTexts(raw.raw, 'evaluation'),
    createdAt: toIsoString(raw.created_at),
    updatedAt: toIsoString(raw.updated_at)
  }
}

const STOP_WORDS = new Set([
  'a',
  'à',
  'au',
  'aux',
  'avec',
  'ce',
  'cet',
  'cette',
  'ces',
  'dans',
  'de',
  'des',
  'du',
  'elle',
  'en',
  'est',
  'et',
  'eux',
  'il',
  'ils',
  'je',
  'la',
  'le',
  'les',
  'leur',
  'leurs',
  'lui',
  'ma',
  'mais',
  'me',
  'mes',
  'mon',
  'ne',
  'nos',
  'notre',
  'nous',
  'on',
  'ou',
  'par',
  'pas',
  'pour',
  'qu',
  'que',
  'qui',
  'quoi',
  'sa',
  'se',
  'ses',
  'son',
  'sur',
  'ta',
  'te',
  'tes',
  'ton',
  'tu',
  'un',
  'une',
  'vos',
  'votre',
  'vous',
  'y'
])

function toSearchTokens(raw: string | undefined): string[] | undefined {
  if (!raw) return undefined

  const tokens = raw
    .toLowerCase()
    .match(/[\p{L}\p{N}]+/gu)
    ?.filter((token) => token.length > 2 && !STOP_WORDS.has(token))

  return tokens && tokens.length > 0 ? tokens : undefined
}

function normalizeSearch(text: string | null | undefined): string {
  return (text ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function buildLocationText(
  course: CourseListItem,
  locationsText: string | null | undefined
): string {
  if (typeof locationsText === 'string' && locationsText.length > 0) {
    return normalizeSearch(locationsText)
  }

  if (!course.sessions || course.sessions.length === 0) return ''

  const locations = course.sessions
    .flatMap((s) => [s.location?.city, s.location?.department, s.location?.region])
    .filter((v): v is string => typeof v === 'string')
    .join(' ')
  return normalizeSearch(locations)
}

function buildSearchText(course: CourseListItem, locationsText: string | null | undefined): string {
  return [course.title, course.description, locationsText, course.certifierName, course.category]
    .map(normalizeSearch)
    .join(' ')
}

interface CatalogRow {
  course: CourseListItem
  updatedAt: string
  searchText: string
  locationText: string
}

function toCatalogRow(raw: DirectusFormation): CatalogRow {
  const course = toListItem(raw)
  return {
    course,
    updatedAt: toIsoString(raw.updated_at),
    searchText: buildSearchText(course, raw.locations_text),
    locationText: buildLocationText(course, raw.locations_text)
  }
}

function parseModalities(value: string | undefined): string[] {
  if (!value) return []
  return value
    .split(',')
    .map((m) => m.trim())
    .filter((m) => m.length > 0)
}

const DURATION_BUCKET_KEYS = new Set(['courte', 'moyenne', 'longue'])

function parseDurations(value: string | undefined): string[] {
  if (!value) return []
  return value
    .split(',')
    .map((d) => d.trim())
    .filter((d) => DURATION_BUCKET_KEYS.has(d))
}

function matchesDurationBucket(course: CourseListItem, bucket: string): boolean {
  const hours = course.durationHours ?? 0
  const days = course.durationDays ?? 1

  if (hours > 0) {
    if (bucket === 'courte') return hours <= 8
    if (bucket === 'moyenne') return hours >= 9 && hours <= 40
    return hours > 40
  }

  if (bucket === 'courte') return days <= 1
  if (bucket === 'moyenne') return days >= 2 && days <= 5
  return days > 5
}

function matchesCertifying(course: CourseListItem, certifying: boolean | undefined): boolean {
  if (certifying === undefined) return true
  const hasCertification =
    typeof course.certification === 'string' && course.certification.trim().length > 0
  return certifying === hasCertification
}

function matchesDurationRange(
  course: CourseListItem,
  min: number | undefined,
  max: number | undefined
): boolean {
  const hours = course.durationHours ?? 0
  if (min !== undefined && hours < min) return false
  if (max !== undefined && hours > max) return false
  return true
}

function matchesDurationBuckets(course: CourseListItem, durations: string | undefined): boolean {
  const buckets = parseDurations(durations)
  if (buckets.length === 0) return true
  return buckets.some((b) => matchesDurationBucket(course, b))
}

function matchesPriceRange(
  course: CourseListItem,
  min: number | undefined,
  max: number | undefined
): boolean {
  const price = course.price ?? 0
  if (min !== undefined && price < min) return false
  if (max !== undefined && (course.price ?? Infinity) > max) return false
  return true
}

function matchesCenter(course: CourseListItem, center: string | undefined): boolean {
  if (!center) return true
  return course.centerSlug === center || course.centerSlugs.includes(center)
}

function matchesModalities(course: CourseListItem, modalities: string | undefined): boolean {
  const wanted = parseModalities(modalities)
  if (wanted.length === 0) return true
  return wanted.some((m) => course.modalities.includes(m))
}

function matchesLocation(row: CatalogRow, location: string | undefined): boolean {
  if (!location) return true
  return row.locationText.includes(normalizeSearch(location))
}

function matchesSearchQuery(row: CatalogRow, search: string | undefined): boolean {
  const tokens = toSearchTokens(search)
  if (!tokens) return true
  return tokens.every((token) => row.searchText.includes(token))
}

function matchesCourse(row: CatalogRow, query: ListCoursesDto): boolean {
  if (query.family && row.course.familySlug !== query.family) return false
  if (query.cpf !== undefined && row.course.cpf !== query.cpf) return false
  if (!matchesCertifying(row.course, query.certifying)) return false
  if (!matchesDurationRange(row.course, query.durationMin, query.durationMax)) return false
  if (!matchesDurationBuckets(row.course, query.durations)) return false
  if (!matchesPriceRange(row.course, query.priceMin, query.priceMax)) return false
  if (!matchesCenter(row.course, query.center)) return false
  if (!matchesModalities(row.course, query.modalities)) return false
  if (!matchesLocation(row, query.location)) return false
  if (!matchesSearchQuery(row, query.search)) return false
  return true
}

function sortCatalogRows(
  rows: CatalogRow[],
  sort: CourseSortField | undefined,
  order: CourseSortOrder | undefined
): CatalogRow[] {
  const direction = order === CourseSortOrder.asc ? 1 : -1

  return [...rows].sort((a, b) => {
    if (sort === CourseSortField.name) {
      return direction * a.course.title.localeCompare(b.course.title)
    }

    if (sort === CourseSortField.duration) {
      const ah = a.course.durationHours ?? 0
      const bh = b.course.durationHours ?? 0
      if (ah !== bh) return direction * (ah - bh)
    }

    if (sort === CourseSortField.price) {
      const ap = a.course.price ?? 0
      const bp = b.course.price ?? 0
      if (ap !== bp) return direction * (ap - bp)
    }

    return direction * b.updatedAt.localeCompare(a.updatedAt)
  })
}

const ROWS_CACHE_KEY = 'courses:rows'

@Injectable()
export class CatalogService {
  private readonly logger = new Logger(CatalogService.name)

  constructor(
    private readonly cache: CacheService,
    private readonly catalog: DirectusCatalogService
  ) {}

  async list(query: ListCoursesDto): Promise<Paginated<CourseListItem>> {
    const cacheKey = `courses:list:${JSON.stringify(query)}`
    const cached = await this.cache.get<Paginated<CourseListItem>>(cacheKey)
    if (cached) {
      return cached
    }

    const rows = await this.getCatalogRows()
    const filtered = rows.filter((row) => matchesCourse(row, query))
    const sorted = sortCatalogRows(filtered, query.sort, query.order)

    const total = sorted.length
    const skip = (query.page - 1) * query.limit
    const items = sorted.slice(skip, skip + query.limit).map((row) => row.course)

    const result: Paginated<CourseListItem> = {
      items,
      total,
      page: query.page,
      pageSize: query.limit
    }

    // Un résultat vide n'est jamais caché : si Directus est vide/indisponible
    // au démarrage, il ne faut pas geler un catalogue vide pendant le TTL.
    if (rows.length > 0) {
      await this.cache.set(cacheKey, result)
    }
    return result
  }

  async findBySlug(slug: string, family?: string): Promise<Course | null> {
    const familySuffix = family ? `:${family}` : ''
    const cacheKey = `courses:detail${familySuffix}:${slug}`
    const cached = await this.cache.get<Course>(cacheKey)
    if (cached) {
      return cached
    }

    const all = await this.getAllFormations()
    const raw = all.find((course) => {
      if (course.slug !== slug) return false
      if (family && course.famille?.slug !== family) return false
      return true
    })

    if (!raw) {
      return null
    }

    const result = toCourse(raw)
    await this.cache.set(cacheKey, result)
    return result
  }

  async families(): Promise<FamilyWithCount[]> {
    const cacheKey = 'courses:families'
    const cached = await this.cache.get<FamilyWithCount[]>(cacheKey)
    if (cached) {
      return cached
    }

    const rows = await this.getCatalogRows()
    const counts = new Map<string, number>()

    for (const row of rows) {
      const slug = row.course.familySlug
      if (!slug) continue
      counts.set(slug, (counts.get(slug) ?? 0) + 1)
    }

    const result: FamilyWithCount[] = Array.from(counts.entries())
      .map(([slug, count]) => ({ slug, count }))
      .sort((a, b) => a.slug.localeCompare(b.slug))

    if (result.length > 0) {
      await this.cache.set(cacheKey, result)
    }
    return result
  }

  async applyFamilies(): Promise<FamilyApplyResult> {
    const [formations, familyBySlug] = await Promise.all([
      this.catalog.fetchAllFormations(),
      this.catalog.getFamilyIdsBySlug()
    ])

    const assignments = new Map<string, string>()
    for (const row of formations) {
      const category = row.category_name
      if (!category) continue

      const slug = slugifyCategory(category)
      if (!familyBySlug.has(slug)) continue

      // Une famille éditoriale déjà positionnée n'est jamais écrasée.
      if (row.famille?.slug && row.famille.slug !== slug) continue

      assignments.set(row.digiforma_id, slug)
    }

    const result = await this.catalog.applyFamilyAssignments(assignments)
    await this.cache.invalidateCatalog()
    return result
  }

  private async getCatalogRows(): Promise<CatalogRow[]> {
    const cached = await this.cache.get<CatalogRow[]>(ROWS_CACHE_KEY)
    if (isCatalogRowsCache(cached)) {
      return cached
    }

    const all = await this.getAllFormations()
    const rows = all.map(toCatalogRow)
    if (rows.length > 0) {
      await this.cache.set(ROWS_CACHE_KEY, rows)
    }
    return rows
  }

  private async getAllFormations(): Promise<DirectusFormation[]> {
    const cacheKey = 'formations:all'
    const cached = await this.cache.get<DirectusFormation[]>(cacheKey)
    if (cached) {
      return cached
    }

    const rows = await this.catalog.fetchAllFormations()
    if (rows.length > 0) {
      await this.cache.set(cacheKey, rows)
    }
    return rows
  }
}

function isCatalogRowsCache(value: unknown): value is CatalogRow[] {
  return Array.isArray(value) && (value.length === 0 || 'searchText' in value[0])
}
