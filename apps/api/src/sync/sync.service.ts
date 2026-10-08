import { promises as fs } from 'node:fs'
import { randomUUID } from 'node:crypto'
import { resolve } from 'node:path'
import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { waitUntil } from '@vercel/functions'
import { CacheService, type SyncRun } from '../common/cache/cache.service'
import { DirectusCatalogService } from '../directus/directus.catalog.service'
import { DirectusItemsClient } from '../directus/directus.items.client'
import { DigiformaClientFactory } from '../digiforma/digiforma-client.factory'
import type { Program } from '../digiforma/digiforma.client'
import { mapProgramToCourse } from '../digiforma/digiforma.mapper'
import { GeocodingService } from '../centres/geocoding.service'
import type { SourceConfig } from '../sources/source.types'
import { SourcesService } from '../sources/sources.service'

// TTL du verrou d'UNE source : borne la durée max de son run (fetch
// Digiforma paginé + upserts). Les sources passent à la suite : le verrou
// de chacune couvre aussi l'attente des sources qui la précèdent, d'où le
// multiple du nombre de sources. Si le process meurt, les verrous expirent
// et le déclencheur suivant peut reprendre une sync.
const SYNC_LOCK_TTL_MS = 10 * 60 * 1000

export interface SourceRunAck {
  source: string
  /** `accepted` : le run démarre ; `locked` : un run de cette source est déjà en cours. */
  status: 'accepted' | 'locked'
}

export interface TriggerResult {
  started: boolean
  runs: SourceRunAck[]
}

interface PendingRun {
  source: SourceConfig
  run: SyncRun
}

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name)
  private running = false

  constructor(
    private readonly config: ConfigService,
    private readonly clients: DigiformaClientFactory,
    private readonly cache: CacheService,
    private readonly catalog: DirectusCatalogService,
    private readonly geocoding: GeocodingService,
    private readonly sources: SourcesService,
    private readonly directus: DirectusItemsClient
  ) {}

  // La planification est externe (workflow GitHub planifié → POST
  // /admin/sync) : un cron in-process ne tournerait que tant qu'une
  // instance serverless est chaude — déclenchement aléatoire.
  // Sans `sourceCode`, toutes les sources actives sont synchronisées, l'une
  // après l'autre. Avec un code : 404 si inconnu, 409 si la source est
  // inactive ou déjà en cours de sync.
  async trigger(options: { sourceCode?: string } = {}): Promise<TriggerResult> {
    const single = options.sourceCode !== undefined
    if (this.running) {
      if (single) throw new ConflictException('A sync is already in progress')
      this.logger.warn('Sync already in progress, skipping')
      return { started: false, runs: [] }
    }
    // Posé avant tout `await` : deux déclenchements concurrents ne passent pas.
    this.running = true

    try {
      const targets = await this.resolveTargets(options.sourceCode)
      const ttl = SYNC_LOCK_TTL_MS * targets.length
      const acquired = new Map<string, string>()
      const runs: SourceRunAck[] = []

      for (const source of targets) {
        const token = randomUUID()
        if (await this.cache.acquireSyncLock(token, ttl, source.code)) {
          acquired.set(source.code, token)
          runs.push({ source: source.code, status: 'accepted' })
        } else {
          this.logger.warn({ source: source.code }, 'Sync already running on another instance')
          runs.push({ source: source.code, status: 'locked' })
        }
      }

      if (acquired.size === 0) {
        this.running = false
        if (single) {
          throw new ConflictException(`Sync already running for source "${options.sourceCode}"`)
        }
        return { started: false, runs }
      }

      const toRun = targets.filter((source) => acquired.has(source.code))
      const tracked = this.executeAll(toRun, acquired)
        .catch((error) => {
          this.logger.error(error, 'Sync failed')
        })
        .finally(() => {
          this.running = false
        })

      // Sur Vercel, waitUntil maintient la fonction en vie après la réponse
      // 202 jusqu'à la fin du run ; hors Vercel c'est un no-op — la promise
      // tourne détachée dans le process.
      waitUntil(tracked)

      return { started: true, runs }
    } catch (error) {
      this.running = false
      throw error
    }
  }

  async getLatestRun(): Promise<SyncRun | null> {
    return this.cache.getSyncRun()
  }

  /** Dernier run de chaque source active, par code. */
  async getRunsBySource(): Promise<Record<string, SyncRun | null>> {
    const active = await this.sources.listActive()
    const entries = await Promise.all(
      active.map(async (source) => [source.code, await this.cache.getSyncRun(source.code)] as const)
    )
    return Object.fromEntries(entries)
  }

  private async resolveTargets(sourceCode: string | undefined): Promise<SourceConfig[]> {
    if (sourceCode === undefined) return this.sources.listActive()

    const source = await this.sources.getByCode(sourceCode)
    if (!source) throw new NotFoundException(`Unknown source "${sourceCode}"`)
    if (source.status !== 'active') {
      throw new ConflictException(`Source "${sourceCode}" is inactive`)
    }
    return [source]
  }

  // Séquentiel : l'échec d'une source n'interrompt pas les suivantes. Le
  // géocodage et l'invalidation du cache, communs à toutes les sources,
  // s'exécutent une fois à la fin ; un run n'est « success » qu'après eux.
  private async executeAll(sources: SourceConfig[], locks: Map<string, string>): Promise<void> {
    const released = new Set<string>()
    const release = async (code: string): Promise<void> => {
      const token = locks.get(code)
      if (!token || released.has(code)) return
      released.add(code)
      await this.cache.releaseSyncLock(token, code)
    }

    const pending: PendingRun[] = []
    try {
      for (const source of sources) {
        const outcome = await this.syncSource(source)
        if (outcome) pending.push(outcome)
        else await release(source.code)
      }

      if (pending.length === 0) return

      try {
        // Les localisations de session viennent des centres : on (re)géocode
        // celles dont l'adresse a changé avant d'invalider le cache.
        await this.geocoding.syncMissing({ force: true })
        await this.cache.invalidateCatalog()
        for (const entry of pending) await this.finish(entry, 'success')
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        for (const entry of pending) await this.finish(entry, 'failed', message)
        throw error
      }
    } finally {
      await Promise.allSettled(sources.map((source) => release(source.code)))
    }
  }

  // Fetch + mapping + upsert d'une source. Renvoie le run en attente de
  // finalisation, ou null si la source a échoué (run déjà enregistré en erreur).
  private async syncSource(source: SourceConfig): Promise<PendingRun | null> {
    const run: SyncRun = {
      status: 'running',
      startedAt: new Date().toISOString(),
      finishedAt: null,
      inserted: 0,
      updated: 0,
      failed: 0,
      archived: 0,
      error: null,
      source: source.code
    }
    await this.cache.setSyncRun(run, source.code)

    try {
      const programs = await this.loadPrograms(source)
      const payloads = [] as ReturnType<typeof mapProgramToCourse>[]

      for (const program of programs) {
        try {
          payloads.push(mapProgramToCourse(program))
        } catch (error) {
          run.failed += 1
          this.logger.warn(
            { error, programId: program.id, source: source.code },
            'Failed to map program'
          )
        }
      }

      const result = await this.catalog.upsertMany(payloads, await this.sourceIdFor(source))
      run.inserted = result.inserted
      run.updated = result.updated
      this.logger.log({ source: source.code, ...result }, 'Source synced')
      return { source, run }
    } catch (error) {
      this.logger.error({ error, source: source.code }, 'Source sync failed')
      await this.finish(
        { source, run },
        'failed',
        error instanceof Error ? error.message : 'Unknown error'
      )
      return null
    }
  }

  // Id Directus à écrire sur les formations : jamais celui de la source
  // « env » (pas de ligne en base) — la colonne retombe alors sur la HQ.
  private async sourceIdFor(source: SourceConfig): Promise<string | undefined> {
    if (!source.fromEnv) return source.id
    const hq = await this.sources.getHq()
    return hq.fromEnv ? undefined : hq.id
  }

  private async finish(
    { source, run }: PendingRun,
    status: 'success' | 'failed',
    error: string | null = null
  ): Promise<void> {
    run.status = status
    run.finishedAt = new Date().toISOString()
    run.error = error
    await this.cache.setSyncRun(run, source.code)
    await this.recordOnSource(source, run)
  }

  private async recordOnSource(source: SourceConfig, run: SyncRun): Promise<void> {
    if (source.fromEnv) return
    try {
      await this.directus.updateOne('sources', source.id, {
        last_sync_at: run.finishedAt,
        last_sync_status: run.status
      })
    } catch (error) {
      this.logger.warn({ error, source: source.code }, 'Failed to record last sync on source')
    }
  }

  private async loadPrograms(source: SourceConfig): Promise<Program[]> {
    try {
      return await this.clients.for(source).fetchAllPrograms()
    } catch (error) {
      if (this.config.get<string>('NODE_ENV') === 'production') {
        throw error
      }
      this.logger.warn(
        { error, source: source.code },
        'Digiforma call failed, falling back to fixture'
      )
      // Relatif au fichier (src/sync ou dist/sync → apps/api/test/fixtures) :
      // process.cwd() dépend du répertoire de lancement (racine du monorepo
      // vs apps/api) et casserait le repli fixture.
      const fixturePath = resolve(__dirname, '..', '..', 'test', 'fixtures', 'programs.json')
      const raw = await fs.readFile(fixturePath, 'utf-8')
      return JSON.parse(raw) as Program[]
    }
  }
}
