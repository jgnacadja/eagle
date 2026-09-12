import { Injectable, Logger } from '@nestjs/common'
import type {
  CatalogFacets,
  Course,
  CourseListItem,
  CoursePage,
  CoursePedagogyItem,
  CourseSession,
  CourseSessionLocation,
  FamilyWithCount
} from '@learnup/types'
import { CacheService } from '../common/cache/cache.service'
import {
  DirectusCatalogService,
  type AssignmentProposal,
  type DirectusCentre,
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

function toStringList(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null
  const texts = value.filter(
    (entry): entry is string => typeof entry === 'string' && entry.trim().length > 0
  )
  return texts.length > 0 ? texts : null
}

function toPedagogyItems(value: unknown): CoursePedagogyItem[] | null {
  if (!Array.isArray(value)) return null

  const items = value
    .map((entry): CoursePedagogyItem | null => {
      if (typeof entry === 'string') {
        return entry.trim() ? { title: entry, description: null } : null
      }
      if (!entry || typeof entry !== 'object') return null
      const rec = entry as Record<string, unknown>
      if (typeof rec.title !== 'string' || !rec.title.trim()) return null
      return {
        title: rec.title,
        description: typeof rec.description === 'string' ? rec.description : null
      }
    })
    .filter((item): item is CoursePedagogyItem => item !== null)

  return items.length > 0 ? items : null
}

// Repli quand le champ éditable `pedagogy` est vide : les blocs Digiforma
// de type « pedagogie » portent la même information.
function pedagogyFromBlocks(blocks: unknown): CoursePedagogyItem[] | null {
  if (!Array.isArray(blocks)) return null

  const items = blocks
    .map((block): CoursePedagogyItem | null => {
      if (!block || typeof block !== 'object') return null
      const rec = block as Record<string, unknown>
      if (typeof rec.type !== 'string' || !rec.type.toLowerCase().includes('pedag')) return null
      if (typeof rec.name !== 'string' || !rec.name.trim()) return null
      return {
        title: rec.name,
        description: typeof rec.description === 'string' ? rec.description : null
      }
    })
    .filter((item): item is CoursePedagogyItem => item !== null)

  return items.length > 0 ? items : null
}

// Fallback visuel : l'URL Digiforma d'origine est conservée dans `raw`
// (payload programme) quand aucun fichier n'a pu être importé.
function imageUrlFromRaw(raw: unknown): string | null {
  const image = (raw as { image?: { url?: unknown } } | null)?.image
  return image && typeof image.url === 'string' ? image.url : null
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
    subFamilySlug: raw.sous_famille?.slug ?? null,
    subFamilyName: raw.sous_famille?.name ?? null,
    centerSlug: raw.center_slug,
    centerSlugs: (raw.center_slugs as string[]) ?? [],
    modalities: (raw.modalities as string[]) ?? [],
    sessions: mapSessions(raw.sessions),
    image: raw.image ?? null,
    imageUrl: imageUrlFromRaw(raw.raw),
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
    pedagogy: toPedagogyItems(raw.pedagogy) ?? pedagogyFromBlocks(raw.blocks),
    evaluation: toStringList(raw.evaluation) ?? extractTexts(raw.raw, 'evaluation'),
    validity: toNullableString(raw.validity),
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
  locationsText: string | null | undefined,
  locations: ResolvedSessionLocation[]
): string {
  const parts = locations.flatMap((loc) => [
    loc.name,
    loc.address,
    loc.city,
    loc.postalCode,
    loc.department,
    loc.region
  ])
  if (typeof locationsText === 'string' && locationsText.length > 0) {
    parts.push(locationsText)
  }
  return normalizeSearch(parts.filter((v): v is string => typeof v === 'string').join(' '))
}

function buildSearchText(course: CourseListItem, locationsText: string | null | undefined): string {
  return [course.title, course.description, locationsText, course.certifierName, course.category]
    .map(normalizeSearch)
    .join(' ')
}

/**
 * Localisation résolue d'une session : celle du centre quand la session y est
 * rattachée (`centreSlug`), sinon la localisation Digiforma de la session.
 * `latitude`/`longitude` viennent du géocodage BAN du centre.
 */
interface ResolvedSessionLocation extends CourseSessionLocation {
  address: string | null
  latitude: number | null
  longitude: number | null
}

function resolveSessionLocation(
  session: CourseSession,
  centresBySlug: Map<string, DirectusCentre>
): ResolvedSessionLocation | null {
  const centre = session.location?.centreSlug
    ? centresBySlug.get(session.location.centreSlug)
    : undefined
  if (centre) {
    return {
      name: centre.name,
      city: centre.city,
      postalCode: centre.postal_code,
      department: centre.department,
      region: centre.region,
      centreSlug: centre.slug,
      address: centre.address,
      latitude: centre.latitude ?? null,
      longitude: centre.longitude ?? null
    }
  }
  const loc = session.location
  if (!loc) return null
  return { ...loc, address: null, latitude: null, longitude: null }
}

interface CatalogRow {
  course: CourseListItem
  updatedAt: string
  searchText: string
  locationText: string
  locations: ResolvedSessionLocation[]
}

function toCatalogRow(
  raw: DirectusFormation,
  centresBySlug: Map<string, DirectusCentre>
): CatalogRow {
  const course = toListItem(raw)
  const locations = (course.sessions ?? [])
    .map((s) => resolveSessionLocation(s, centresBySlug))
    .filter((l): l is ResolvedSessionLocation => l !== null)

  return {
    course,
    updatedAt: toIsoString(raw.updated_at),
    searchText: buildSearchText(course, raw.locations_text),
    locationText: buildLocationText(raw.locations_text, locations),
    locations
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

/**
 * Tokens de localisation : pas de stop words (les noms de départements en
 * contiennent : « Val-de-Marne »), longueur min 2 pour capter les départements
 * à 1-2 chiffres saisis par l'utilisateur (« 69 », « 75 »).
 */
function toLocationTokens(raw: string | undefined): string[] | undefined {
  if (!raw) return undefined
  const tokens = normalizeSearch(raw)
    .match(/[a-z0-9]+/g)
    ?.filter((token) => token.length >= 2)
  return tokens && tokens.length > 0 ? tokens : undefined
}

function wordPrefixMatch(field: string | null | undefined, token: string): boolean {
  if (!field) return false
  return normalizeSearch(field)
    .split(/[^a-z0-9]+/)
    .some((word) => word.startsWith(token))
}

type SessionLocation = ResolvedSessionLocation

/**
 * Numérique : code postal exact (5 chiffres), préfixe CP (3-4) ou code
 * département via préfixe CP (1-2 : « 69 » matche « 69003 »).
 * Alpha : préfixe de mot sur ville / département / région / adresse / nom du centre.
 */
function locationTokenMatches(token: string, loc: SessionLocation): boolean {
  if (/^\d+$/.test(token)) {
    const cp = loc.postalCode ?? ''
    if (token.length === 5) return cp === token
    if (token.length <= 4) return cp.startsWith(token)
    return false
  }
  return [loc.name, loc.address, loc.city, loc.department, loc.region].some((field) =>
    wordPrefixMatch(field, token)
  )
}

// Rayon de recherche « autour de » quand la localisation est un point
// géographique (lat,lng — émis par le geosuggest communes).
const GEO_SEARCH_RADIUS_KM = 50

function parseGeoLocation(location: string | undefined): { lat: number; lng: number } | null {
  const match = location?.trim().match(/^(-?\d{1,2}(?:\.\d+)?),\s*(-?\d{1,3}(?:\.\d+)?)$/)
  if (!match) return null
  return { lat: Number(match[1]), lng: Number(match[2]) }
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const rad = (deg: number) => (deg * Math.PI) / 180
  const dLat = rad(lat2 - lat1)
  const dLng = rad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/**
 * Mode géographique (`lat,lng` issu du geosuggest) : une session matche si
 * son centre est à moins de GEO_SEARCH_RADIUS_KM du point.
 * Mode texte : tous les tokens doivent matcher dans la MÊME session —
 * « lyon 13002 » ne matche pas une formation à Lyon 69003 + Marseille 13002.
 * Repli sur `locationText` quand aucune session n'est géolocalisée.
 */
function matchesLocation(row: CatalogRow, location: string | undefined): boolean {
  const geo = parseGeoLocation(location)
  if (geo) {
    return row.locations.some(
      (loc) =>
        loc.latitude != null &&
        loc.longitude != null &&
        haversineKm(geo.lat, geo.lng, loc.latitude, loc.longitude) <= GEO_SEARCH_RADIUS_KM
    )
  }

  const tokens = toLocationTokens(location)
  if (!tokens) return true

  if (row.locations.length === 0) {
    return tokens.every((token) => wordPrefixMatch(row.locationText, token))
  }
  return row.locations.some((loc) => tokens.every((token) => locationTokenMatches(token, loc)))
}

function matchesSearchQuery(row: CatalogRow, search: string | undefined): boolean {
  const tokens = toSearchTokens(search)
  if (!tokens) return true
  return tokens.every((token) => row.searchText.includes(token))
}

type FacetDimension =
  'family' | 'subFamily' | 'modalities' | 'durations' | 'location' | 'cpf' | 'certifying'

function matchesCourse(row: CatalogRow, query: ListCoursesDto, except?: FacetDimension): boolean {
  const checks: { dim: FacetDimension | null; ok: boolean }[] = [
    { dim: 'family', ok: !query.family || row.course.familySlug === query.family },
    { dim: 'subFamily', ok: !query.subFamily || row.course.subFamilySlug === query.subFamily },
    { dim: 'cpf', ok: query.cpf === undefined || row.course.cpf === query.cpf },
    { dim: 'certifying', ok: matchesCertifying(row.course, query.certifying) },
    { dim: null, ok: matchesDurationRange(row.course, query.durationMin, query.durationMax) },
    { dim: 'durations', ok: matchesDurationBuckets(row.course, query.durations) },
    { dim: null, ok: matchesPriceRange(row.course, query.priceMin, query.priceMax) },
    { dim: null, ok: matchesCenter(row.course, query.center) },
    { dim: 'modalities', ok: matchesModalities(row.course, query.modalities) },
    { dim: 'location', ok: matchesLocation(row, query.location) },
    { dim: null, ok: matchesSearchQuery(row, query.search) }
  ]
  return checks.every((check) => check.dim === except || check.ok)
}

/**
 * Compteurs par dimension, chacune calculée en ignorant son propre filtre :
 * le front n'affiche que les options qui renvoient des résultats.
 */
function computeCatalogFacets(rows: CatalogRow[], query: ListCoursesDto): CatalogFacets {
  const countByKeys = (
    except: FacetDimension,
    getKeys: (row: CatalogRow) => (string | null)[]
  ): Record<string, number> => {
    const counts: Record<string, number> = {}
    for (const row of rows) {
      if (!matchesCourse(row, query, except)) continue
      for (const key of new Set(getKeys(row))) {
        if (key) counts[key] = (counts[key] ?? 0) + 1
      }
    }
    return counts
  }

  const countWhere = (except: FacetDimension, predicate: (row: CatalogRow) => boolean): number =>
    rows.filter((row) => matchesCourse(row, query, except) && predicate(row)).length

  return {
    families: countByKeys('family', (row) => [row.course.familySlug]),
    subFamilies: countByKeys('subFamily', (row) => [row.course.subFamilySlug]),
    modalities: countByKeys('modalities', (row) => row.course.modalities),
    durations: countByKeys('durations', (row) =>
      DURATION_BUCKET_KEYS_LIST.filter((bucket) => matchesDurationBucket(row.course, bucket))
    ),
    locations: countByKeys('location', (row) =>
      row.locations.map((loc) => loc.department ?? loc.region ?? null)
    ),
    cpf: countWhere('cpf', (row) => row.course.cpf === true),
    certifying: countWhere(
      'certifying',
      (row) =>
        typeof row.course.certification === 'string' && row.course.certification.trim() !== ''
    )
  }
}

const DURATION_BUCKET_KEYS_LIST = ['courte', 'moyenne', 'longue']

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

  async list(query: ListCoursesDto): Promise<CoursePage> {
    const cacheKey = `courses:list:${JSON.stringify(query)}`
    const cached = await this.cache.get<CoursePage>(cacheKey)
    if (cached) {
      return cached
    }

    const rows = await this.getCatalogRows()
    const filtered = rows.filter((row) => matchesCourse(row, query))
    const sorted = sortCatalogRows(filtered, query.sort, query.order)

    const total = sorted.length
    const skip = (query.page - 1) * query.limit
    const items = sorted.slice(skip, skip + query.limit).map((row) => row.course)

    const result: CoursePage = {
      items,
      total,
      page: query.page,
      pageSize: query.limit,
      facets: computeCatalogFacets(rows, query)
    }

    // Un dataset vide signifie une source dégradée (Directus indisponible ou
    // sync incomplète) : ne pas figer « 0 résultat » en cache pendant 1 h.
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

    if (rows.length > 0) {
      await this.cache.set(cacheKey, result)
    }
    return result
  }

  async applyFamilies(): Promise<FamilyApplyResult> {
    const [formations, familyBySlug, subFamilyByFamilySlug] = await Promise.all([
      this.catalog.fetchAllFormations(),
      this.catalog.getFamilyIdsBySlug(),
      this.catalog.getSubFamilyIdsByFamilySlug()
    ])

    const assignments = new Map<string, AssignmentProposal>()
    for (const row of formations) {
      const category = row.category_name
      if (!category) continue

      const slug = slugifyCategory(category)
      const proposal: AssignmentProposal = {}

      // Une famille éditoriale déjà positionnée n'est jamais écrasée.
      if (familyBySlug.has(slug) && !(row.famille?.slug && row.famille.slug !== slug)) {
        proposal.famille = slug
      }

      // Même mécanisme une strate plus bas : la catégorie Digiforma propose
      // une sous-famille de la famille effective — jamais écrasée si posée.
      const effectiveFamily = proposal.famille ?? row.famille?.slug ?? null
      if (
        !row.sous_famille?.slug &&
        effectiveFamily &&
        subFamilyByFamilySlug.get(effectiveFamily)?.has(slug)
      ) {
        proposal.sousFamille = slug
      }

      if (proposal.famille || proposal.sousFamille) {
        assignments.set(row.digiforma_id, proposal)
      }
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

    const [all, centresBySlug] = await Promise.all([
      this.getAllFormations(),
      this.getCentresBySlug()
    ])
    const rows = all.map((raw) => toCatalogRow(raw, centresBySlug))
    if (rows.length > 0) {
      await this.cache.set(ROWS_CACHE_KEY, rows)
    }
    return rows
  }

  /**
   * Centres indexés par slug : les localisations de session sont résolues
   * via `centreSlug` — adresse, ville, CP, département et coordonnées BAN
   * vivent sur le centre, pas sur la session. Centres indisponibles →
   * repli sur la localisation portée par la session.
   */
  private async getCentresBySlug(): Promise<Map<string, DirectusCentre>> {
    const cached = await this.cache.get<DirectusCentre[]>('centres:all')
    if (cached) {
      return new Map(cached.map((c) => [c.slug, c]))
    }
    try {
      const centres = await this.catalog.fetchAllCentres()
      await this.cache.set('centres:all', centres)
      return new Map(centres.map((c) => [c.slug, c]))
    } catch (error) {
      this.logger.warn({ error }, 'Centres fetch failed — session locations will be used as-is')
      return new Map()
    }
  }

  private async getAllFormations(): Promise<DirectusFormation[]> {
    const cacheKey = 'formations:all'
    const cached = await this.cache.get<DirectusFormation[]>(cacheKey)
    if (cached?.length) {
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
