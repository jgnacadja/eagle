import type { DigiformaSession, Program } from './digiforma.client'

export interface FormationDirectusPayload {
  digiforma_id: string
  slug: string
  title: string
  description: string | null
  duration_days: number | null
  duration_hours: number | null
  price: number | null
  cpf: boolean | null
  cpf_code: string | null
  certification: string | null
  certifier_name: string | null
  category_name: string | null
  center_slug: string | null
  center_slugs: string[]
  modalities: string[]
  sessions: unknown
  locations_text: string | null
  blocks: unknown
  image_url: string | null
  generated_program_url: string | null
  status: 'published' | 'draft' | 'archived'
  seo_title: string | null
  seo_description: string | null
  seo_canonical: string | null
  raw: unknown
}

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

export function mapProgramToCourse(program: Program): FormationDirectusPayload {
  const title = program.name.trim()
  const slug = slugify(title)
  const centerSlugs = mapCenterSlugs(program.sessions)

  return {
    digiforma_id: program.id,
    slug,
    title,
    description: mapDescription(program.description),
    duration_days: mapDuration(program.durationInDays),
    duration_hours: mapDuration(program.durationInHours),
    price: mapPrice(program),
    cpf: program.cpf ?? null,
    cpf_code: program.cpfCode ?? null,
    certification: program.certificationType ?? null,
    certifier_name: program.certifierName ?? null,
    category_name: program.category?.name ?? null,
    center_slug: centerSlugs[0] ?? null,
    center_slugs: centerSlugs,
    modalities: mapModalities(program),
    sessions: program.sessions ?? null,
    locations_text: mapLocationsText(program.sessions),
    blocks: program.blocks ?? null,
    image_url: program.image?.url ?? null,
    generated_program_url: program.generatedProgramUrl ?? null,
    status: 'published',
    seo_title: title,
    seo_description: mapDescription(program.description),
    seo_canonical: null,
    raw: program
  }
}
