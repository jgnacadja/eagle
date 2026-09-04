import { Injectable } from '@nestjs/common'
import type { Course, CourseListItem, FamilyWithCount, Paginated } from '@learnup/types'
import { Prisma } from '../../prisma/generated/client'
import { CacheService } from '../common/cache/cache.service'
import { PrismaService } from '../prisma/prisma.service'
import { CourseSortField, CourseSortOrder, type ListCoursesDto } from './catalog.dto'

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
  imageUrl: true,
  status: true,
  seoTitle: true,
  seoDescription: true,
  seoCanonical: true
} satisfies Prisma.CourseSelect

const detailSelect = {
  ...listSelect,
  blocks: true,
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
    imageUrl: raw.imageUrl,
    status: raw.status,
    seoTitle: raw.seoTitle,
    seoDescription: raw.seoDescription,
    seoCanonical: raw.seoCanonical
  }
}

function mapCourse(raw: DetailResult): Course {
  return {
    ...mapListItem(raw),
    blocks: Array.isArray(raw.blocks) ? (raw.blocks as unknown[]) : null,
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

  return tokens.join(' & ')
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

  if (query.priceMin !== undefined || query.priceMax !== undefined) {
    where.price = { gte: query.priceMin, lte: query.priceMax }
  }

  if (query.center) {
    where.centerSlug = query.center
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

const listColumnsSql = `id, slug, title, description, duration_days AS "durationDays", duration_hours AS "durationHours", price, cpf, cpf_code AS "cpfCode", certification, certifier_name AS "certifierName", category, family_slug AS "familySlug", center_slug AS "centerSlug", image_url AS "imageUrl", status, seo_title AS "seoTitle", seo_description AS "seoDescription", seo_canonical AS "seoCanonical"`

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
    conditions.push(`center_slug = $${values.length}`)
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
    private readonly prisma: PrismaService
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
}
