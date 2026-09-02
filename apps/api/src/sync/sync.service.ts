import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { CronJob } from 'cron'
import { SchedulerRegistry } from '@nestjs/schedule'
import type { Prisma } from '@prisma/client'
import { CacheService } from '../common/cache/cache.service'
import { DigiformaClient, type Program } from '../digiforma/digiforma.client'
import { mapProgramToFormation } from '../digiforma/digiforma.mapper'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name)

  constructor(
    private readonly config: ConfigService,
    private readonly client: DigiformaClient,
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly scheduler: SchedulerRegistry
  ) {}

  onModuleInit(): void {
    const expression = this.config.get<string>('SYNC_CRON') ?? '0 * * * *'
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
    const run = await this.prisma.syncRun.create({
      data: { status: 'running' }
    })

    const counts = {
      inserted: 0,
      updated: 0,
      unchanged: 0,
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
          else counts.unchanged += 1
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
      await this.prisma.syncRun.update({
        where: { id: run.id },
        data: {
          status: 'failed',
          finishedAt: new Date(),
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      })

      throw error
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
      this.logger.warn(error, 'Digiforma call failed, falling back to fixture')
      const fixturePath = join(process.cwd(), 'test', 'fixtures', 'programs.json')
      const raw = await fs.readFile(fixturePath, 'utf-8')
      return JSON.parse(raw) as Program[]
    }
  }

  private async upsertFormation(
    input: Prisma.FormationCreateInput
  ): Promise<'inserted' | 'updated'> {
    const existing = await this.prisma.formation.findUnique({
      where: { digiformaId: input.digiformaId as string }
    })

    if (!existing) {
      await this.prisma.formation.create({ data: input })
      return 'inserted'
    }

    await this.prisma.formation.update({
      where: { digiformaId: input.digiformaId as string },
      data: input
    })
    return 'updated'
  }
}
