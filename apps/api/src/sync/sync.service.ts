import { promises as fs } from 'node:fs'
import { randomUUID } from 'node:crypto'
import { resolve } from 'node:path'
import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { waitUntil } from '@vercel/functions'
import { CacheService, type SyncRun } from '../common/cache/cache.service'
import { DirectusCatalogService } from '../directus/directus.catalog.service'
import { DigiformaClient, type Program } from '../digiforma/digiforma.client'
import { mapProgramToCourse } from '../digiforma/digiforma.mapper'
import { GeocodingService } from '../centres/geocoding.service'

// TTL du verrou : borne la durée max d'un run (fetch Digiforma paginé +
// upserts + géocodage). Si le process meurt en cours de route, le verrou
// expire et le déclencheur suivant peut reprendre une sync.
const SYNC_LOCK_TTL_MS = 10 * 60 * 1000

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name)
  private running = false

  constructor(
    private readonly config: ConfigService,
    private readonly client: DigiformaClient,
    private readonly cache: CacheService,
    private readonly catalog: DirectusCatalogService,
    private readonly geocoding: GeocodingService
  ) {}

  // La planification est externe (workflow GitHub planifié → POST
  // /admin/sync) : un cron in-process ne tournerait que tant qu'une
  // instance serverless est chaude — déclenchement aléatoire.
  // Renvoie true si le run démarre, false si un run est déjà en cours
  // (local ou sur une autre instance via le verrou Redis).
  async trigger(): Promise<boolean> {
    if (this.running) {
      this.logger.warn('Sync already in progress, skipping')
      return false
    }
    this.running = true

    const token = randomUUID()
    if (!(await this.cache.acquireSyncLock(token, SYNC_LOCK_TTL_MS))) {
      this.running = false
      this.logger.warn('Sync already running on another instance, skipping')
      return false
    }

    const tracked = this.execute()
      .catch((error) => {
        this.logger.error(error, 'Sync failed')
      })
      .finally(async () => {
        await this.cache.releaseSyncLock(token)
        this.running = false
      })

    // Sur Vercel, waitUntil maintient la fonction en vie après la réponse
    // 202 jusqu'à la fin du run ; hors Vercel c'est un no-op — la promise
    // tourne détachée dans le process.
    waitUntil(tracked)

    return true
  }

  private async execute(): Promise<void> {
    const startedAt = new Date().toISOString()
    const run: SyncRun = {
      status: 'running',
      startedAt,
      finishedAt: null,
      inserted: 0,
      updated: 0,
      failed: 0,
      error: null
    }

    await this.cache.setSyncRun(run)

    try {
      const programs = await this.loadPrograms()
      const payloads = [] as ReturnType<typeof mapProgramToCourse>[]

      for (const program of programs) {
        try {
          payloads.push(mapProgramToCourse(program))
        } catch (error) {
          run.failed += 1
          this.logger.warn({ error, programId: program.id }, 'Failed to map program')
        }
      }

      const result = await this.catalog.upsertMany(payloads)
      run.inserted = result.inserted
      run.updated = result.updated

      // Les localisations de session viennent des centres : on (re)géocode
      // celles dont l'adresse a changé avant d'invalider le cache.
      await this.geocoding.syncMissing({ force: true })
      await this.cache.invalidateCatalog()

      run.status = 'success'
      run.finishedAt = new Date().toISOString()
      this.logger.log(`Sync finished: ${JSON.stringify(result)}`)
    } catch (error) {
      run.status = 'failed'
      run.finishedAt = new Date().toISOString()
      run.error = error instanceof Error ? error.message : 'Unknown error'
      throw error
    } finally {
      await this.cache.setSyncRun(run)
    }
  }

  async getLatestRun(): Promise<SyncRun | null> {
    return this.cache.getSyncRun()
  }

  private async loadPrograms(): Promise<Program[]> {
    try {
      return await this.client.fetchAllPrograms()
    } catch (error) {
      if (this.config.get<string>('NODE_ENV') === 'production') {
        throw error
      }
      this.logger.warn(error, 'Digiforma call failed, falling back to fixture')
      // Relatif au fichier (src/sync ou dist/sync → apps/api/test/fixtures) :
      // process.cwd() dépend du répertoire de lancement (racine du monorepo
      // vs apps/api) et casserait le repli fixture.
      const fixturePath = resolve(__dirname, '..', '..', 'test', 'fixtures', 'programs.json')
      const raw = await fs.readFile(fixturePath, 'utf-8')
      return JSON.parse(raw) as Program[]
    }
  }
}
