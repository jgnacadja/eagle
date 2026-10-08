import { expect, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { inspect } from 'node:util'
import { resolve } from 'node:path'
import { Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Test } from '@nestjs/testing'
import { CacheService, type SyncRun } from '../../common/cache/cache.service'
import { GeocodingService } from '../../centres/geocoding.service'
import { DigiformaClientFactory } from '../../digiforma/digiforma-client.factory'
import type { Program } from '../../digiforma/digiforma.client'
import { DirectusCatalogService } from '../../directus/directus.catalog.service'
import { DirectusItemsClient } from '../../directus/directus.items.client'
import { HubspotTargetResolver } from '../../leads/hubspot-target.resolver'
import { LeadsService } from '../../leads/leads.service'
import { encryptSecret } from '../../sources/sources.crypto'
import { SourcesService } from '../../sources/sources.service'
import { SyncService } from '../../sync/sync.service'
import { DIRECTUS_URL, FakeDirectus, FakeNetwork, HUBSPOT_FORMS_URL } from './fake-network'

const FIXTURES = resolve(__dirname, '..', '..', '..', 'test', 'fixtures', 'multi-source')

function fixture<T>(name: string): T {
  return JSON.parse(readFileSync(resolve(FIXTURES, name), 'utf-8')) as T
}

export const ENC_KEY = Buffer.alloc(32, 7).toString('base64')

export type SourceRow = Record<string, unknown> & { id: string; code: string }

/** Les deux sources de la recette : HQ et franchise Lyon (portail HubSpot privé). */
export const sourceRows = (): SourceRow[] => fixture<SourceRow[]>('sources.json')
export const programsHq = (): Program[] => fixture<Program[]>('programs-hq.json')
export const programsLyon = (): Program[] => fixture<Program[]>('programs-lyon.json')
export const centreRows = (): Array<Record<string, unknown>> => fixture('centres.json')

/** Secrets chiffrés comme le fait le hook Directus avant l'écriture en base. */
export function encryptedRow(row: SourceRow): SourceRow {
  const key = Buffer.from(ENC_KEY, 'base64')
  const seal = (value: unknown) => (typeof value === 'string' ? encryptSecret(value, key) : value)
  return {
    ...row,
    digiforma_api_key: seal(row.digiforma_api_key),
    hubspot_token: seal(row.hubspot_token)
  }
}

/** Mémoire de `CacheService` : verrous, derniers runs et versions par source. */
export class FakeCache {
  readonly runs = new Map<string, SyncRun>()
  readonly versions = new Map<string, number>()
  readonly locks = new Map<string, string>()
  invalidations = 0

  setSyncRun = async (run: SyncRun, code = 'default'): Promise<void> => {
    this.runs.set(code, structuredClone(run))
  }
  getSyncRun = async (code = 'default'): Promise<SyncRun | null> => this.runs.get(code) ?? null
  acquireSyncLock = async (token: string, _ttl: number, code = 'default'): Promise<boolean> => {
    if (this.locks.has(code)) return false
    this.locks.set(code, token)
    return true
  }
  releaseSyncLock = async (token: string, code = 'default'): Promise<void> => {
    if (this.locks.get(code) === token) this.locks.delete(code)
  }
  bumpSourceVersion = async (code: string): Promise<void> => {
    this.versions.set(code, (this.versions.get(code) ?? 0) + 1)
  }
  invalidateCatalog = async (): Promise<void> => {
    this.invalidations += 1
  }
}

export interface HarnessOptions {
  /** Lignes de la collection `sources` (déjà chiffrées). Vide = config env seule (CA4). */
  sources?: SourceRow[]
  env?: Record<string, string>
}

export const ENV_MONO_SOURCE = {
  DIGIFORMA_API_URL: 'https://digiforma-env.test/graphql',
  DIGIFORMA_API_KEY: 'digiforma-key-env-0004',
  HUBSPOT_PORTAL_ID: '9999999',
  HUBSPOT_FORM_NEWSLETTER: 'env-form-newsletter',
  HUBSPOT_FORM_DEMANDE: 'env-form-demande',
  HUBSPOT_FORM_CANDIDATURE: 'env-form-candidature',
  HUBSPOT_FORM_CONSEILLER: 'env-form-conseiller',
  HUBSPOT_FORM_RAPPEL: 'env-form-rappel'
}

/**
 * Câble les vrais services (sync, sources, catalogue Directus, routage et
 * soumission des leads) sur un Directus / Digiforma / HubSpot simulés au
 * niveau `fetch`. Seuls Redis (`FakeCache`) et le géocodage sont remplacés.
 */
export async function createHarness(options: HarnessOptions = {}) {
  const rows = options.sources ?? []
  const hqRow = rows.find((row) => row.is_hq === true)
  const directus = new FakeDirectus(hqRow?.id ?? null)
  directus.rows('sources').push(...rows.map((row) => ({ ...row })))
  const network = new FakeNetwork(directus)
  vi.stubGlobal('fetch', network.fetch)

  const env: Record<string, string> = {
    NODE_ENV: 'production',
    DIRECTUS_TOKEN: 'directus-service-token-0005',
    DIRECTUS_INTERNAL_URL: DIRECTUS_URL,
    HUBSPOT_FORMS_BASE_URL: HUBSPOT_FORMS_URL,
    SOURCES_ENC_KEY: ENC_KEY,
    ...options.env
  }
  const cache = new FakeCache()

  const module = await Test.createTestingModule({
    providers: [
      SyncService,
      SourcesService,
      DirectusCatalogService,
      DirectusItemsClient,
      DigiformaClientFactory,
      HubspotTargetResolver,
      LeadsService,
      { provide: ConfigService, useValue: { get: (key: string) => env[key] } },
      { provide: CacheService, useValue: cache },
      {
        provide: GeocodingService,
        useValue: { syncMissing: async () => ({ geocoded: 0, renamed: 0, failed: 0 }) }
      }
    ]
  }).compile()

  const sync = module.get(SyncService)
  const sources = module.get(SourcesService)

  /**
   * `trigger()` rend la main avant la fin du run : on attend la libération de
   * tous les verrous, puis un tour de boucle pour que le drapeau `running`
   * retombe avant le déclenchement suivant.
   */
  async function runSync(sourceCode?: string) {
    const result = await sync.trigger(sourceCode ? { sourceCode } : {})
    await vi.waitFor(() => expect(cache.locks.size).toBe(0))
    await new Promise((resolveTick) => setImmediate(resolveTick))
    return result
  }

  /** Édition d'une source dans l'admin Directus (le cache de lecture est purgé). */
  function updateSource(id: string, patch: Record<string, unknown>): void {
    const row = directus.rows('sources').find((candidate) => candidate.id === id)
    if (!row) throw new Error(`Unknown source row ${id}`)
    Object.assign(row, patch)
    sources.invalidate()
  }

  return {
    module,
    sync,
    sources,
    leads: module.get(LeadsService),
    directus,
    network,
    cache,
    runSync,
    updateSource
  }
}

export type Harness = Awaited<ReturnType<typeof createHarness>>

/** Capte tout ce que les services écrivent dans le logger Nest. */
export function captureLogs(): { text: () => string; count: () => number } {
  const lines: string[] = []
  for (const method of ['log', 'warn', 'error', 'debug', 'verbose', 'fatal'] as const) {
    vi.spyOn(Logger.prototype, method).mockImplementation((...args: unknown[]) => {
      lines.push(inspect(args, { depth: 8, breakLength: Infinity }))
    })
  }
  return { text: () => lines.join('\n'), count: () => lines.length }
}
