import { Prisma } from '../../prisma/generated/client'
import type { DigiformaSession, Program } from './digiforma.client'

export type CourseInput = Prisma.CourseCreateInput

const DIACRITIC_PATTERN = /[\u0300-\u036f]/g

function slugify(input: string): string {
  const normalized = input.toLowerCase().normalize('NFD').replace(DIACRITIC_PATTERN, '')

  let slug = ''
  let endsWithHyphen = false

  for (const char of normalized) {
    if ((char >= 'a' && char <= 'z') || (char >= '0' && char <= '9')) {
      slug += char
      endsWithHyphen = false
    } else if (!endsWithHyphen) {
      slug += '-'
      endsWithHyphen = true
    }
  }

  if (slug.endsWith('-')) {
    slug = slug.slice(0, -1)
  }

  return slug
}

function mapFamilySlug(category?: { name?: string | null } | null): string | null {
  const raw = (category?.name ?? '').trim()
  if (!raw) return null
  return slugify(raw)
}

function mapDescription(description?: string | null): string | null {
  if (!description) return null
  const trimmed = description.trim()
  if (!trimmed) return null
  return trimmed
}

function mapPrice(program: Program): number | null {
  const costs = (program.costsInter ?? [])
    .map((entry) => entry.cost)
    .filter((cost): cost is number => typeof cost === 'number' && Number.isFinite(cost))

  return costs.length > 0 ? Math.min(...costs) : null
}

function mapDuration(value?: number | null): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : null
}

function toJsonValue(value: unknown): Prisma.InputJsonValue {
  return structuredClone(value ?? Prisma.JsonNull) as Prisma.InputJsonValue
}

const KNOWN_MODALITIES = new Set(['presentiel', 'distanciel', 'hybride', 'intra', 'inter'])

function mapModalities(program: Program): string[] {
  const modalities = (program.modalities ?? []).filter(
    (m): m is string => typeof m === 'string' && KNOWN_MODALITIES.has(m)
  )

  // Fallback quand la source ne fournit pas de modalités explicites :
  // un coût "inter" implique des sessions inter-entreprises.
  if (!modalities.includes('inter') && (program.costsInter ?? []).length > 0) {
    modalities.push('inter')
  }

  return [...new Set(modalities)]
}

function mapCenterSlugs(sessions?: DigiformaSession[] | null): string[] {
  const slugs = (sessions ?? [])
    .map((s) => s.location?.centreSlug)
    .filter((s): s is string => typeof s === 'string' && s.length > 0)
  return [...new Set(slugs)]
}

function mapLocationsText(sessions?: DigiformaSession[] | null): string | null {
  const parts = new Set<string>()
  for (const session of sessions ?? []) {
    const loc = session.location
    if (!loc) continue
    for (const value of [loc.city, loc.postalCode, loc.department, loc.region, loc.name]) {
      if (typeof value === 'string' && value.trim()) parts.add(value.trim())
    }
  }
  return parts.size > 0 ? [...parts].join(' ') : null
}

export function mapProgramToCourse(program: Program): CourseInput {
  const title = program.name.trim()
  const slug = slugify(title)
  const familySlug = mapFamilySlug(program.category)
  const centerSlugs = mapCenterSlugs(program.sessions)

  return {
    digiformaId: program.id,
    slug,
    title,
    description: mapDescription(program.description),
    durationDays: mapDuration(program.durationInDays),
    durationHours: mapDuration(program.durationInHours),
    price: mapPrice(program),
    cpf: program.cpf ?? null,
    cpfCode: program.cpfCode ?? null,
    certification: program.certificationType ?? null,
    certifierName: program.certifierName ?? null,
    category: program.category?.name ?? null,
    familySlug,
    centerSlug: centerSlugs[0] ?? null,
    centerSlugs,
    modalities: mapModalities(program),
    sessions: toJsonValue(program.sessions ?? null),
    locationsText: mapLocationsText(program.sessions),
    blocks: toJsonValue(program.blocks ?? null),
    imageUrl: program.image?.url ?? null,
    generatedProgramUrl: program.generatedProgramUrl ?? null,
    status: 'published',
    seoTitle: title,
    seoDescription: mapDescription(program.description),
    raw: toJsonValue(program)
  }
}
