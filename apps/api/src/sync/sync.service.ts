import { promises as fs } from 'node:fs'
import { resolve } from 'node:path'
import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { CronJob, validateCronExpression } from 'cron'
import { SchedulerRegistry } from '@nestjs/schedule'
import { CacheService, type SyncRun } from '../common/cache/cache.service'
import { DirectusCatalogService } from '../directus/directus.catalog.service'
import { DigiformaClient, type Program } from '../digiforma/digiforma.client'
import { mapProgramToCourse } from '../digiforma/digiforma.mapper'

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name)
  private running = false

  constructor(
    private readonly config: ConfigService,
    private readonly client: DigiformaClient,
    private readonly cache: CacheService,
    private readonly scheduler: SchedulerRegistry,
    private readonly catalog: DirectusCatalogService
  ) {}

  onModuleInit(): void {
    const expression = this.config.get<string>('SYNC_CRON') ?? '0 * * * *'
    const validation = validateCronExpression(expression)

    if (!validation.valid) {
      this.logger.error(`Invalid SYNC_CRON expression: ${expression}`)
      return
    }

    const job = new CronJob(expression, () => {
      void this.run().catch((error) => {
        this.logger.error(error, 'Scheduled sync failed')
      })
    })

    this.scheduler.addCronJob('digiforma-sync', job)
    job.start()
    this.logger.log(`Digiforma cron scheduled: ${expression}`)
  }

  async run(): Promise<void> {
    if (this.running) {
      this.logger.warn('Sync already in progress, skipping')
      return
    }
    this.running = true

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
      this.running = false
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
