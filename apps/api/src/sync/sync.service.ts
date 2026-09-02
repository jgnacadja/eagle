import { promises as fs } from 'node:fs'
import { resolve } from 'node:path'
import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { CronJob, validateCronExpression } from 'cron'
import { SchedulerRegistry } from '@nestjs/schedule'
import type { Prisma } from '../generated/prisma/client'
import { CacheService } from '../common/cache/cache.service'
import { DigiformaClient, type Program } from '../digiforma/digiforma.client'
import { mapProgramToFormation } from '../digiforma/digiforma.mapper'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name)
  private running = false

  constructor(
    private readonly config: ConfigService,
    private readonly client: DigiformaClient,
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly scheduler: SchedulerRegistry
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
    this.logger.log(`Cron Digiforma planifié : ${expression}`)
  }

  async run(): Promise<void> {
    if (this.running) {
      this.logger.warn('Sync already in progress, skipping')
      return
    }
    this.running = true

    const run = await this.prisma.syncRun.create({
      data: { status: 'running' }
    })

    const counts = {
      inserted: 0,
      updated: 0,
      failed: 0
    }

    try {
      const programs = await this.loadPrograms()

      for (const program of programs) {
        try {
          const input = mapProgramToFormation(program)
          const result = await this.upsertFormation(input)

          if (result === 'inserted') counts.inserted += 1
          else if (result === 'updated') counts.updated += 1
        } catch (error) {
          counts.failed += 1
          this.logger.warn({ error, programId: program.id }, 'Failed to sync program')
        }
      }

      await this.cache.invalidateCatalog()

      await this.prisma.syncRun.update({
        where: { id: run.id },
        data: {
          status: 'success',
          finishedAt: new Date(),
          ...counts
        }
      })

      this.logger.log(`Sync terminée : ${JSON.stringify(counts)}`)
    } catch (error) {
      try {
        await this.prisma.syncRun.update({
          where: { id: run.id },
          data: {
            status: 'failed',
            finishedAt: new Date(),
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        })
      } catch (updateError) {
        this.logger.error(updateError, 'Failed to record sync failure')
      }

      throw error
    } finally {
      this.running = false
    }
  }

  async getLatestRun(): Promise<Prisma.SyncRunGetPayload<null> | null> {
    const run = await this.prisma.syncRun.findFirst({
      orderBy: { startedAt: 'desc' }
    })
    return run
  }

  private async loadPrograms(): Promise<Program[]> {
    try {
      return await this.client.fetchAllPrograms()
    } catch (error) {
      if (this.config.get<string>('NODE_ENV') === 'production') {
        throw error
      }
      this.logger.warn(error, 'Digiforma call failed, falling back to fixture')
      const fixturePath = resolve(__dirname, '..', '..', 'test', 'fixtures', 'programs.json')
      const raw = await fs.readFile(fixturePath, 'utf-8')
      return JSON.parse(raw) as Program[]
    }
  }

  private async upsertFormation(
    input: Prisma.FormationCreateInput
  ): Promise<'inserted' | 'updated'> {
    const existing = await this.prisma.formation.findUnique({
      where: { digiformaId: input.digiformaId }
    })

    if (!existing) {
      await this.prisma.formation.create({ data: input })
      return 'inserted'
    }

    await this.prisma.formation.update({
      where: { digiformaId: input.digiformaId },
      data: input
    })
    return 'updated'
  }
}
