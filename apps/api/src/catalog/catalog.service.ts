import { Injectable } from '@nestjs/common'
import type {
  Course,
  CourseListItem,
  CourseSession,
  FamilyWithCount,
  Paginated
} from '@learnup/types'
import { Prisma } from '../../prisma/generated/client'
import { CacheService } from '../common/cache/cache.service'
import { DirectusMirrorService } from '../directus/directus.mirror.service'
import { PrismaService } from '../prisma/prisma.service'
import { CourseSortField, CourseSortOrder, type ListCoursesDto } from './catalog.dto'

export interface FamilyApplyResult {
  assigned: number
  cleared: number
}

const listSelect = {
  id: true,
  slug: true,
  title: true,
  description: true,
  durationDays: true,
  durationHours: true,
  price: true,
  cpf: true,
  cpfCode: true,
  certification: true,
  certifierName: true,
  category: true,
  familySlug: true,
  centerSlug: true,
  centerSlugs: true,
  modalities: true,
  sessions: true,
  imageUrl: true,
  generatedProgramUrl: true,
  status: true,
  seoTitle: true,
  seoDescription: true,
  seoCanonical: true
} satisfies Prisma.CourseSelect

const detailSelect = {
  ...listSelect,
  blocks: true,
  raw: true,
  createdAt: true,
  updatedAt: true
} satisfies Prisma.CourseSelect

type ListResult = Prisma.CourseGetPayload<{ select: typeof listSelect }>
type DetailResult = Prisma.CourseGetPayload<{ select: typeof detailSelect }>

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

function toNumber(value: unknown): number | null {
  if (value == null) return null
  const parsed = Number(value)
  return Number.isNaN(parsed) ? null : parsed
}

function toIsoString(value: unknown): string {
  return value instanceof Date ? value.toISOString() : String(value)
}

function mapListItem(raw: ListResult): CourseListItem {
  return {
    id: raw.id,
    slug: raw.slug,
    title: raw.title,
    description: raw.description,
    durationDays: raw.durationDays,
    durationHours: raw.durationHours,
    price: toNumber(raw.price),
    cpf: raw.cpf,
    cpfCode: raw.cpfCode,
    certification: raw.certification,
    certifierName: raw.certifierName,
    category: raw.category,
    familySlug: raw.familySlug,
    centerSlug: raw.centerSlug,
    centerSlugs: raw.centerSlugs ?? [],
    modalities: raw.modalities ?? [],
    sessions: mapSessions(raw.sessions),
    imageUrl: raw.imageUrl,
    generatedProgramUrl: raw.generatedProgramUrl,
    status: raw.status,
    seoTitle: raw.seoTitle,
    seoDescription: raw.seoDescription,
    seoCanonical: raw.seoCanonical
  }
}

function mapSessions(value: unknown): CourseSession[] | null {
  if (!Array.isArray(value)) return null

  const sessions = value
    .map((entry): CourseSession | null => {
      if (!entry || typeof entry !== 'object') return null
      const raw = entry as Record<string, unknown>
      const location =
        raw['location'] && typeof raw['location'] === 'object'
          ? (raw['location'] as Record<string, unknown>)
          : null

      return {
        id: typeof raw['id'] === 'string' ? raw['id'] : null,
        startDate: typeof raw['startDate'] === 'string' ? raw['startDate'] : null,
        endDate: typeof raw['endDate'] === 'string' ? raw['endDate'] : null,
        modality: typeof raw['modality'] === 'string' ? raw['modality'] : null,
        seatsRemaining: typeof raw['seatsRemaining'] === 'number' ? raw['seatsRemaining'] : null,
        location: location
          ? {
              name: typeof location['name'] === 'string' ? location['name'] : null,
              city: typeof location['city'] === 'string' ? location['city'] : null,
              postalCode:
                typeof location['postalCode'] === 'string' ? location['postalCode'] : null,
              department:
                typeof location['department'] === 'string' ? location['department'] : null,
              region: typeof location['region'] === 'string' ? location['region'] : null,
              centreSlug: typeof location['centreSlug'] === 'string' ? location['centreSlug'] : null
            }
          : null
      }
    })
    .filter((s): s is CourseSession => s !== null)

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

function mapCourse(raw: DetailResult): Course {
  return {
    ...mapListItem(raw),
    blocks: Array.isArray(raw.blocks) ? (raw.blocks as unknown[]) : null,
    targets: extractTexts(raw.raw, 'targets'),
    prerequisites: extractTexts(raw.raw, 'prerequisites'),
    evaluation: extractTexts(raw.raw, 'evaluation'),
    createdAt: toIsoString(raw.createdAt),
    updatedAt: toIsoString(raw.updatedAt)
  }
}

function toTsQuery(raw: string): string | undefined {
  const tokens = raw
    .toLowerCase()
    .match(/[\p{L}\p{N}]+/gu)
    ?.filter((token) => token.length > 2 && !STOP_WORDS.has(token))

  if (!tokens || tokens.length === 0) {
    return undefined
  }

  // `:*` = match préfixe : « pre » doit retrouver « prévention »,
  // « prévenir », etc. Sans ça to_tsquery exige le lexème exact.
  return tokens.map((token) => `${token}:*`).join(' & ')
}

function buildWhere(query: ListCoursesDto): Prisma.CourseWhereInput {
  const where: Prisma.CourseWhereInput = { status: 'published' }

  if (query.family) {
    where.familySlug = query.family
  }

  if (query.cpf !== undefined) {
    where.cpf = query.cpf
  }

  if (query.certifying !== undefined) {
    where.certification = query.certifying ? { not: null } : null
  }

  if (query.durationMin !== undefined || query.durationMax !== undefined) {
    where.durationHours = { gte: query.durationMin, lte: query.durationMax }
  }

  const durationWhere = buildDurationWhere(parseDurations(query.durations))
  if (durationWhere) {
    where.AND = [...(Array.isArray(where.AND) ? where.AND : []), durationWhere]
  }

  if (query.priceMin !== undefined || query.priceMax !== undefined) {
    where.price = { gte: query.priceMin, lte: query.priceMax }
  }

  if (query.center) {
    where.OR = [{ centerSlug: query.center }, { centerSlugs: { has: query.center } }]
  }

  const modalities = parseModalities(query.modalities)
  if (modalities.length > 0) {
    where.modalities = { hasSome: modalities }
  }

  if (query.location) {
    where.locationsText = { contains: query.location, mode: 'insensitive' }
  }

  return where
}

function buildOrderBy(
  sort: CourseSortField | undefined,
  order: CourseSortOrder | undefined
): Prisma.CourseOrderByWithRelationInput {
  if (sort === CourseSortField.relevance) {
    return { updatedAt: order ?? CourseSortOrder.desc }
  }

  if (sort === CourseSortField.duration) {
    return { durationHours: order ?? CourseSortOrder.asc }
  }

  if (sort === CourseSortField.price) {
    return { price: order ?? CourseSortOrder.asc }
  }

  if (sort === CourseSortField.name) {
    return { title: order ?? CourseSortOrder.asc }
  }

  if (sort === CourseSortField.updatedAt) {
    return { updatedAt: order ?? CourseSortOrder.desc }
  }

  return { updatedAt: CourseSortOrder.desc }
}

const listColumnsSql = `id, slug, title, description, duration_days AS "durationDays", duration_hours AS "durationHours", price, cpf, cpf_code AS "cpfCode", certification, certifier_name AS "certifierName", category, family_slug AS "familySlug", center_slug AS "centerSlug", center_slugs AS "centerSlugs", modalities, sessions, image_url AS "imageUrl", generated_program_url AS "generatedProgramUrl", status, seo_title AS "seoTitle", seo_description AS "seoDescription", seo_canonical AS "seoCanonical"`

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

// Mêmes seuils que buildDuration côté front : duration_hours > 0 pilote
// (≤ 8 h courte, ≤ 40 h moyenne, > 40 h longue) ; sinon repli sur
// duration_days (null → 1 jour : ≤ 1 j courte, ≤ 5 j moyenne, > 5 j longue).
const NO_HOURS_SQL = `(duration_hours IS NULL OR duration_hours <= 0)`

const DURATION_BUCKET_SQL: Record<string, string> = {
  courte: `((duration_hours > 0 AND duration_hours <= 8) OR (${NO_HOURS_SQL} AND COALESCE(duration_days, 1) <= 1))`,
  moyenne: `((duration_hours >= 9 AND duration_hours <= 40) OR (${NO_HOURS_SQL} AND COALESCE(duration_days, 1) BETWEEN 2 AND 5))`,
  longue: `(duration_hours > 40 OR (${NO_HOURS_SQL} AND COALESCE(duration_days, 1) > 5))`
}

function buildDurationWhere(buckets: string[]): Prisma.CourseWhereInput | undefined {
  if (buckets.length === 0) return undefined

  const noHours: Prisma.CourseWhereInput = {
    OR: [{ durationHours: null }, { durationHours: { lte: 0 } }]
  }
  const conditions: Prisma.CourseWhereInput[] = []

  if (buckets.includes('courte')) {
    conditions.push({
      OR: [
        { durationHours: { gt: 0, lte: 8 } },
        { AND: [noHours, { OR: [{ durationDays: null }, { durationDays: { lte: 1 } }] }] }
      ]
    })
  }
  if (buckets.includes('moyenne')) {
    conditions.push({
      OR: [
        { durationHours: { gte: 9, lte: 40 } },
        { AND: [noHours, { durationDays: { gte: 2, lte: 5 } }] }
      ]
    })
  }
  if (buckets.includes('longue')) {
    conditions.push({
      OR: [{ durationHours: { gt: 40 } }, { AND: [noHours, { durationDays: { gt: 5 } }] }]
    })
  }

  return conditions.length === 1 ? conditions[0] : { OR: conditions }
}

function escapeLikePattern(raw: string): string {
  const escaped = raw.replaceAll('!', '!!').replaceAll('%', '!%').replaceAll('_', '!_')
  return `%${escaped}%`
}

function buildSearchWhere(
  query: ListCoursesDto,
  tsQuery: string | undefined,
  pattern: string | undefined
): { sql: string; values: unknown[] } {
  const conditions: string[] = [`status = 'published'`]
  const values: unknown[] = []

  if (query.family) {
    values.push(query.family)
    conditions.push(`family_slug = $${values.length}`)
  }

  if (query.cpf !== undefined) {
    values.push(query.cpf)
    conditions.push(`cpf = $${values.length}`)
  }

  if (query.certifying !== undefined) {
    conditions.push(query.certifying ? 'certification IS NOT NULL' : 'certification IS NULL')
  }

  if (query.durationMin !== undefined) {
    values.push(query.durationMin)
    conditions.push(`duration_hours >= $${values.length}`)
  }

  if (query.durationMax !== undefined) {
    values.push(query.durationMax)
    conditions.push(`duration_hours <= $${values.length}`)
  }

  const durationBuckets = parseDurations(query.durations)
  if (durationBuckets.length > 0) {
    conditions.push(`(${durationBuckets.map((d) => DURATION_BUCKET_SQL[d]).join(' OR ')})`)
  }

  if (query.priceMin !== undefined) {
    values.push(query.priceMin)
    conditions.push(`price >= $${values.length}`)
  }

  if (query.priceMax !== undefined) {
    values.push(query.priceMax)
    conditions.push(`price <= $${values.length}`)
  }

  if (query.center) {
    values.push(query.center)
    const param = `$${values.length}`
    conditions.push(`(center_slug = ${param} OR ${param} = ANY(center_slugs))`)
  }

  const modalities = parseModalities(query.modalities)
  if (modalities.length > 0) {
    values.push(modalities)
    conditions.push(`modalities && $${values.length}::text[]`)
  }

  if (query.location) {
    values.push(escapeLikePattern(query.location))
    const param = `$${values.length}`
    conditions.push(`unaccent(locations_text) ILIKE unaccent(${param}) ESCAPE '!'`)
  }

  if (tsQuery) {
    values.push(tsQuery)
    const param = `$${values.length}`
    conditions.push(
      `(title_tsv @@ to_tsquery('french', unaccent(${param})) OR description_tsv @@ to_tsquery('french', unaccent(${param})))`
    )
  } else if (pattern) {
    values.push(pattern)
    const param = `$${values.length}`
    conditions.push(
      `(unaccent(title) ILIKE unaccent(${param}) ESCAPE '!' OR unaccent(description) ILIKE unaccent(${param}) ESCAPE '!')`
    )
  }

  return { sql: conditions.join(' AND '), values }
}

function buildSearchOrderBy(
  query: ListCoursesDto,
  tsQuery: string | undefined,
  values: unknown[]
): string {
  const direction = query.order ?? CourseSortOrder.desc

  if (query.sort === CourseSortField.relevance && tsQuery) {
    values.push(tsQuery)
    const param = `$${values.length}`
    return `ORDER BY ts_rank_cd(title_tsv, to_tsquery('french', unaccent(${param}))) + ts_rank_cd(description_tsv, to_tsquery('french', unaccent(${param}))) DESC`
  }

  if (query.sort === CourseSortField.duration) {
    return `ORDER BY duration_hours ${query.order ?? CourseSortOrder.asc}`
  }

  if (query.sort === CourseSortField.price) {
    return `ORDER BY price ${query.order ?? CourseSortOrder.asc}`
  }

  if (query.sort === CourseSortField.name) {
    return `ORDER BY unaccent(title) ${query.order ?? CourseSortOrder.asc}`
  }

  if (query.sort === CourseSortField.updatedAt) {
    return `ORDER BY updated_at ${direction}`
  }

  if (tsQuery) {
    values.push(tsQuery)
    const param = `$${values.length}`
    return `ORDER BY ts_rank_cd(title_tsv, to_tsquery('french', unaccent(${param}))) + ts_rank_cd(description_tsv, to_tsquery('french', unaccent(${param}))) DESC`
  }

  return `ORDER BY updated_at DESC`
}

function buildSearchListSql(
  query: ListCoursesDto,
  tsQuery: string | undefined,
  pattern: string | undefined,
  skip: number,
  take: number
): { sql: string; values: unknown[] } {
  const { sql: whereSql, values } = buildSearchWhere(query, tsQuery, pattern)
  const orderBy = buildSearchOrderBy(query, tsQuery, values)
  values.push(take, skip)
  const limitParam = `$${values.length - 1}`
  const offsetParam = `$${values.length}`
  return {
    sql: `SELECT ${listColumnsSql} FROM courses WHERE ${whereSql} ${orderBy} LIMIT ${limitParam} OFFSET ${offsetParam}`,
    values
  }
}

function buildSearchCountSql(
  query: ListCoursesDto,
  tsQuery: string | undefined,
  pattern: string | undefined
): { sql: string; values: unknown[] } {
  const { sql: whereSql, values } = buildSearchWhere(query, tsQuery, pattern)
  return { sql: `SELECT COUNT(*)::int AS count FROM courses WHERE ${whereSql}`, values }
}

@Injectable()
export class CatalogService {
  constructor(
    private readonly cache: CacheService,
    private readonly prisma: PrismaService,
    private readonly mirror: DirectusMirrorService
  ) {}

  async list(query: ListCoursesDto): Promise<Paginated<CourseListItem>> {
    const cacheKey = `courses:list:${JSON.stringify(query)}`
    const cached = await this.cache.get<Paginated<CourseListItem>>(cacheKey)
    if (cached) {
      return cached
    }

    const skip = (query.page - 1) * query.limit
    const take = query.limit

    let rows: ListResult[]
    let total: number

    if (query.search) {
      const tsQuery = toTsQuery(query.search)
      const pattern = tsQuery ? undefined : escapeLikePattern(query.search)
      const count = buildSearchCountSql(query, tsQuery, pattern)
      const list = buildSearchListSql(query, tsQuery, pattern, skip, take)

      const [countRows, rawRows] = await Promise.all([
        this.prisma.$queryRawUnsafe<{ count: number }[]>(count.sql, ...count.values),
        this.prisma.$queryRawUnsafe<ListResult[]>(list.sql, ...list.values)
      ])

      total = Number(countRows[0]?.count ?? 0)
      rows = rawRows
    } else {
      const where = buildWhere(query)
      const orderBy = buildOrderBy(query.sort, query.order)

      ;[rows, total] = await Promise.all([
        this.prisma.course.findMany({
          where,
          select: listSelect,
          skip,
          take,
          orderBy
        }),
        this.prisma.course.count({ where })
      ])
    }

    const result: Paginated<CourseListItem> = {
      items: rows.map(mapListItem),
      total,
      page: query.page,
      pageSize: query.limit
    }

    await this.cache.set(cacheKey, result)
    return result
  }

  async findBySlug(slug: string, family?: string): Promise<Course | null> {
    const familySuffix = family ? `:${family}` : ''
    const cacheKey = `courses:detail${familySuffix}:${slug}`
    const cached = await this.cache.get<Course>(cacheKey)
    if (cached) {
      return cached
    }

    const where: Prisma.CourseWhereInput = {
      slug,
      status: 'published',
      ...(family ? { familySlug: family } : {})
    }

    const raw = await this.prisma.course.findFirst({
      where,
      select: detailSelect
    })

    if (!raw) {
      return null
    }

    const result = mapCourse(raw)
    await this.cache.set(cacheKey, result)
    return result
  }

  async families(): Promise<FamilyWithCount[]> {
    const cacheKey = 'courses:families'
    const cached = await this.cache.get<FamilyWithCount[]>(cacheKey)
    if (cached) {
      return cached
    }

    const rows = await this.prisma.course.groupBy({
      by: ['familySlug'],
      where: { status: 'published', familySlug: { not: null } },
      _count: { id: true },
      orderBy: { familySlug: 'asc' }
    })

    const result: FamilyWithCount[] = rows.map((row) => ({
      slug: row.familySlug ?? '',
      count: row._count.id
    }))

    await this.cache.set(cacheKey, result)
    return result
  }

  async applyFamilies(): Promise<FamilyApplyResult> {
    const assignments = await this.mirror.fetchAssignments()
    const digiformaIds = Array.from(assignments.keys())

    // Inclure aussi les courses actuellement rattachées : une affectation
    // retirée dans Directus (famille = null) doit être répercutée ici.
    const courses = await this.prisma.course.findMany({
      where: {
        OR: [{ digiformaId: { in: digiformaIds } }, { familySlug: { not: null } }]
      },
      select: { id: true, digiformaId: true, familySlug: true }
    })

    const byFamily = new Map<string, string[]>()
    for (const course of courses) {
      const familySlug = assignments.get(course.digiformaId)
      if (!familySlug) continue

      const list = byFamily.get(familySlug) ?? []
      list.push(course.digiformaId)
      byFamily.set(familySlug, list)
    }

    const toClear = courses
      .filter((c) => !assignments.has(c.digiformaId) && c.familySlug !== null)
      .map((c) => c.digiformaId)

    const result = { assigned: 0, cleared: 0 }

    await this.prisma.$transaction(async (tx) => {
      for (const [familySlug, ids] of byFamily.entries()) {
        // `not: familySlug` seul exclut les NULL en SQL : ajouter le cas null
        // pour rattraper les formations sans famille.
        const update = await tx.course.updateMany({
          where: {
            digiformaId: { in: ids },
            OR: [{ familySlug: { not: familySlug } }, { familySlug: null }]
          },
          data: { familySlug }
        })
        result.assigned += update.count
      }

      if (toClear.length > 0) {
        const clear = await tx.course.updateMany({
          where: { digiformaId: { in: toClear }, familySlug: { not: null } },
          data: { familySlug: null }
        })
        result.cleared += clear.count
      }
    })

    await this.cache.invalidateCatalog()
    return result
  }
}
