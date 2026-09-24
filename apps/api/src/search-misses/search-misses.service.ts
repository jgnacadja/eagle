import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { SchedulerRegistry } from '@nestjs/schedule'
import { CronJob, validateCronExpression } from 'cron'
import type {
  RechercheSansResultat,
  SearchMissAggregate,
  SearchMissContext,
  SearchMissOutcome,
  SearchMissPage,
  SearchMissSource
} from '@learnup/types'
import { DirectusItemsClient, type DirectusFilter } from '../directus/directus.items.client'
import { scrubPersonalData } from '../common/utils/pii.util'
import type { ListSearchMissesDto, SearchMissRangeDto } from './search-misses.dto'

export const SEARCH_MISSES_COLLECTION = 'recherches_sans_resultat'

const MAX_QUERY_LENGTH = 500
const MIN_QUERY_LENGTH = 2
// Deux soumissions identiques dans la minute (double appel SSR/client,
// rechargement, retry) ne comptent qu'une fois.
const DEDUPE_WINDOW_MS = 60_000
const DEDUPE_MAX_ENTRIES = 1_000
const FETCH_PAGE_SIZE = 500
const FETCH_MAX_PAGES = 40
const DEFAULT_RETENTION_DAYS = 180
const DEFAULT_PURGE_CRON = '15 3 * * *'
const PURGE_JOB_NAME = 'search-misses-purge'
const DAY_MS = 86_400_000

// UTF-8 avec BOM + « ; » : ouverture directe dans Excel (locale FR) sans
// assistant d'import ni caractères accentués cassés.
const CSV_BOM = '﻿'
const CSV_SEPARATOR = ';'
const CSV_EOL = '\r\n'
const CSV_HEADER = [
  'requete_normalisee',
  'exemple',
  'occurrences',
  'premiere_occurrence',
  'derniere_occurrence',
  'aucun_resultat',
  'hors_catalogue',
  'catalogue',
  'moteur_ia',
  'intentions'
]

const ROW_FIELDS = [
  'id',
  'date_created',
  'query_text',
  'query_normalized',
  'outcome',
  'source',
  'intent',
  'context',
  'reviewed'
]

const GEO_POINT_PATTERN = /^(-?\d{1,2}(?:\.\d+)?),\s*(-?\d{1,3}(?:\.\d+)?)$/

export interface RecordSearchMissInput {
  query: string
  outcome: SearchMissOutcome
  source: SearchMissSource
  intent?: string | null
  /** Contexte non personnel : les valeurs non primitives ou vides sont ignorées. */
  context?: Record<string, unknown> | null
}

export interface PurgeResult {
  deleted: number
  cutoff: string | null
}

/** Clé de regroupement : minuscules, sans accents, ponctuation réduite à des espaces. */
export function normalizeQuery(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
}

/**
 * Coordonnées « autour de moi » (lat,lng du visiteur) arrondies au dixième
 * de degré (~10 km) : la position précise est une donnée personnelle, la
 * zone suffit pour repérer un manque géographique.
 */
export function coarseLocation(value: string): string {
  const match = GEO_POINT_PATTERN.exec(value.trim())
  if (!match) return value
  return `${Number(match[1]).toFixed(1)},${Number(match[2]).toFixed(1)}`
}

function isContextValue(value: unknown): value is string | number | boolean | null {
  return (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  )
}

function sanitizeContext(
  context: Record<string, unknown> | null | undefined
): SearchMissContext | null {
  if (!context) return null
  const clean: SearchMissContext = {}
  for (const [key, value] of Object.entries(context)) {
    if (!isContextValue(value) || value === '') continue
    clean[key] = key === 'location' && typeof value === 'string' ? coarseLocation(value) : value
  }
  return Object.keys(clean).length > 0 ? clean : null
}

function parseRetentionDays(raw: string | undefined): number {
  const parsed = Number.parseInt(raw ?? '', 10)
  return Number.isNaN(parsed) ? DEFAULT_RETENTION_DAYS : parsed
}

function nextDay(date: string): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) + DAY_MS).toISOString().slice(0, 10)
}

function rangeFilter(range: SearchMissRangeDto): DirectusFilter {
  const bounds: Record<string, string> = {}
  if (range.from) bounds._gte = range.from
  if (range.to) bounds._lt = nextDay(range.to)
  return Object.keys(bounds).length > 0 ? { date_created: bounds } : {}
}

function withFilter(filter: DirectusFilter): DirectusFilter | undefined {
  return Object.keys(filter).length > 0 ? filter : undefined
}

function csvCell(value: string | number | null): string {
  const text = value === null ? '' : String(value)
  return /[";\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

function earliest(a: string | null, b: string | null): string | null {
  if (a === null) return b
  if (b === null) return a
  return a < b ? a : b
}

function latest(a: string | null, b: string | null): string | null {
  if (a === null) return b
  if (b === null) return a
  return a > b ? a : b
}

function emptyAggregate(row: RechercheSansResultat): SearchMissAggregate {
  return {
    queryNormalized: row.query_normalized,
    // Les lignes arrivent de la plus récente à la plus ancienne : le
    // premier texte rencontré est le plus récent.
    sampleQuery: row.query_text,
    occurrences: 0,
    firstSeen: null,
    lastSeen: null,
    outcomes: { no_result: 0, out_of_catalog: 0 },
    sources: { catalog: 0, assistant: 0 },
    intents: []
  }
}

function accumulate(group: SearchMissAggregate, row: RechercheSansResultat): void {
  group.occurrences += 1
  group.outcomes[row.outcome] = (group.outcomes[row.outcome] ?? 0) + 1
  group.sources[row.source] = (group.sources[row.source] ?? 0) + 1
  if (row.intent && !group.intents.includes(row.intent)) group.intents.push(row.intent)
  group.firstSeen = earliest(group.firstSeen, row.date_created)
  group.lastSeen = latest(group.lastSeen, row.date_created)
}

function toCsvLine(aggregate: SearchMissAggregate): string {
  return [
    aggregate.queryNormalized,
    aggregate.sampleQuery,
    aggregate.occurrences,
    aggregate.firstSeen,
    aggregate.lastSeen,
    aggregate.outcomes.no_result,
    aggregate.outcomes.out_of_catalog,
    aggregate.sources.catalog,
    aggregate.sources.assistant,
    aggregate.intents.join(', ')
  ]
    .map(csvCell)
    .join(CSV_SEPARATOR)
}

/**
 * Journal des recherches sans correspondance (collection Directus
 * `recherches_sans_resultat`) : capture non bloquante côté API, consultation
 * et export agrégé pour la revue produit, purge automatique après
 * `SEARCH_MISS_RETENTION_DAYS` jours (RGPD — durée de conservation bornée).
 */
@Injectable()
export class SearchMissesService implements OnModuleInit {
  private readonly logger = new Logger(SearchMissesService.name)
  private readonly retentionDays: number
  private readonly purgeCron: string
  private readonly recent = new Map<string, number>()

  constructor(
    config: ConfigService,
    private readonly directus: DirectusItemsClient,
    private readonly scheduler: SchedulerRegistry
  ) {
    this.retentionDays = parseRetentionDays(config.get<string>('SEARCH_MISS_RETENTION_DAYS'))
    this.purgeCron = config.get<string>('SEARCH_MISS_PURGE_CRON') ?? DEFAULT_PURGE_CRON
  }

  onModuleInit(): void {
    if (this.retentionDays <= 0) {
      this.logger.warn('SEARCH_MISS_RETENTION_DAYS <= 0: automatic search-miss purge disabled')
      return
    }

    if (!validateCronExpression(this.purgeCron).valid) {
      this.logger.error(`Invalid SEARCH_MISS_PURGE_CRON expression: ${this.purgeCron}`)
      return
    }

    const job = new CronJob(this.purgeCron, () => {
      void this.purgeExpired().catch((error) => {
        this.logger.error(error, 'Scheduled search-miss purge failed')
      })
    })
    this.scheduler.addCronJob(PURGE_JOB_NAME, job)
    job.start()
    this.logger.log(
      `Search-miss purge scheduled: ${this.purgeCron} (retention ${this.retentionDays} days)`
    )
  }

  /**
   * Journalise une requête sans correspondance. Ne lève jamais : la
   * journalisation ne doit ni faire échouer ni retarder la réponse au
   * visiteur. Retourne `true` quand une ligne a été écrite.
   */
  async record(input: RecordSearchMissInput): Promise<boolean> {
    if (!this.directus.enabled) return false

    const queryText = scrubPersonalData(input.query).trim().slice(0, MAX_QUERY_LENGTH)
    const queryNormalized = normalizeQuery(queryText)
    if (queryNormalized.length < MIN_QUERY_LENGTH) return false
    if (this.isDuplicate(`${input.source}:${input.outcome}:${queryNormalized}`)) return false

    try {
      const created = await this.directus.createOne<{ id: number }>(SEARCH_MISSES_COLLECTION, {
        query_text: queryText,
        query_normalized: queryNormalized,
        outcome: input.outcome,
        source: input.source,
        intent: input.intent?.trim() || null,
        context: sanitizeContext(input.context)
      })
      return created !== null
    } catch (error) {
      this.logger.warn(
        { error, source: input.source, outcome: input.outcome },
        'Failed to record search miss'
      )
      return false
    }
  }

  async list(query: ListSearchMissesDto): Promise<SearchMissPage> {
    const filter: DirectusFilter = rangeFilter(query)
    if (query.outcome) filter.outcome = { _eq: query.outcome }
    if (query.source) filter.source = { _eq: query.source }

    const result = await this.directus.readMany<RechercheSansResultat>(SEARCH_MISSES_COLLECTION, {
      filter: withFilter(filter),
      fields: ROW_FIELDS,
      sort: ['-date_created'],
      limit: query.limit,
      page: query.page,
      meta: 'filter_count'
    })

    return {
      items: result.data,
      total: result.meta?.filter_count ?? result.data.length,
      page: query.page,
      pageSize: query.limit
    }
  }

  /** Regroupe les requêtes par texte normalisé — les plus fréquentes d'abord. */
  async aggregate(range: SearchMissRangeDto): Promise<SearchMissAggregate[]> {
    const rows = await this.fetchAll(range)
    const groups = new Map<string, SearchMissAggregate>()

    for (const row of rows) {
      const group = groups.get(row.query_normalized) ?? emptyAggregate(row)
      accumulate(group, row)
      groups.set(row.query_normalized, group)
    }

    return [...groups.values()].sort(
      (a, b) => b.occurrences - a.occurrences || (b.lastSeen ?? '').localeCompare(a.lastSeen ?? '')
    )
  }

  async exportCsv(range: SearchMissRangeDto): Promise<string> {
    const aggregates = await this.aggregate(range)
    const lines = [CSV_HEADER.join(CSV_SEPARATOR), ...aggregates.map(toCsvLine)]
    return `${CSV_BOM}${lines.join(CSV_EOL)}${CSV_EOL}`
  }

  /** Supprime les entrées plus anciennes que la durée de conservation. */
  async purgeExpired(now = new Date()): Promise<PurgeResult> {
    if (this.retentionDays <= 0) return { deleted: 0, cutoff: null }

    const cutoff = new Date(now.getTime() - this.retentionDays * DAY_MS).toISOString()
    const filter: DirectusFilter = { date_created: { _lt: cutoff } }

    const expired = await this.directus.readMany<{ id: number }>(SEARCH_MISSES_COLLECTION, {
      filter,
      fields: ['id'],
      limit: 1,
      meta: 'filter_count'
    })
    const deleted = expired.meta?.filter_count ?? expired.data.length
    if (deleted > 0) {
      await this.directus.deleteMany(SEARCH_MISSES_COLLECTION, filter)
    }

    this.logger.log(`Search-miss purge: ${deleted} entries older than ${cutoff} removed`)
    return { deleted, cutoff }
  }

  private isDuplicate(key: string): boolean {
    const now = Date.now()
    const seenAt = this.recent.get(key)
    if (seenAt !== undefined && now - seenAt < DEDUPE_WINDOW_MS) return true

    if (this.recent.size >= DEDUPE_MAX_ENTRIES) this.evictExpired(now)
    this.recent.set(key, now)
    return false
  }

  private evictExpired(now: number): void {
    for (const [key, seenAt] of this.recent) {
      if (now - seenAt >= DEDUPE_WINDOW_MS) this.recent.delete(key)
    }
    // Rafale de requêtes distinctes dans la fenêtre : on repart de zéro
    // plutôt que de laisser la mémoire croître.
    if (this.recent.size >= DEDUPE_MAX_ENTRIES) this.recent.clear()
  }

  private async fetchAll(range: SearchMissRangeDto): Promise<RechercheSansResultat[]> {
    const filter = withFilter(rangeFilter(range))
    const rows: RechercheSansResultat[] = []

    for (let page = 1; page <= FETCH_MAX_PAGES; page += 1) {
      const result = await this.directus.readMany<RechercheSansResultat>(SEARCH_MISSES_COLLECTION, {
        filter,
        fields: ROW_FIELDS,
        sort: ['-date_created'],
        limit: FETCH_PAGE_SIZE,
        page
      })
      rows.push(...result.data)
      if (result.data.length < FETCH_PAGE_SIZE) break
    }

    return rows
  }
}
