import { Injectable } from '@nestjs/common'
import type { Course, CourseListItem, Paginated } from '@learnup/types'
import type { Prisma } from '../generated/prisma/client'
import { CacheService } from '../common/cache/cache.service'
import { PrismaService } from '../prisma/prisma.service'
import type { ListCoursesDto } from './catalog.dto'

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

function buildWhere(query: ListCoursesDto): Prisma.CourseWhereInput {
  const where: Prisma.CourseWhereInput = { status: 'published' }

  if (query.family) {
    where.familySlug = query.family
  }

  if (query.search) {
    where.OR = [
      { title: { contains: query.search, mode: 'insensitive' } },
      { description: { contains: query.search, mode: 'insensitive' } }
    ]
  }

  return where
}

@Injectable()
export class CatalogService {
  constructor(
    private readonly cache: CacheService,
    private readonly prisma: PrismaService
  ) { }

  async list(query: ListCoursesDto): Promise<Paginated<CourseListItem>> {
    const cacheKey = `courses:list:${JSON.stringify(query)}`
    const cached = await this.cache.get<Paginated<CourseListItem>>(cacheKey)
    if (cached) {
      return cached
    }

    const where = buildWhere(query)
    const skip = (query.page - 1) * query.limit
    const take = query.limit

    const [rows, total] = await Promise.all([
      this.prisma.course.findMany({
        where,
        select: listSelect,
        skip,
        take,
        orderBy: { title: 'asc' }
      }),
      this.prisma.course.count({ where })
    ])

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
}
