import { Test, TestingModule } from '@nestjs/testing'
import { ConfigService } from '@nestjs/config'
import { SchedulerRegistry } from '@nestjs/schedule'
import { SyncService } from './sync.service'
import { DigiformaClient } from '../digiforma/digiforma.client'
import { PrismaService } from '../prisma/prisma.service'
import { CacheService } from '../common/cache/cache.service'

const sampleProgram = {
  id: 'prog-001',
  title: 'Pilotage de projet',
  durationInDays: 3,
  durationInHours: 21,
  price: 1800,
  cpf: true,
  cpfCode: 'CPF-12345',
  certificationType: 'Certificat',
  certifierName: 'LEARN UP',
  category: 'Management',
  programCategory: 'Management',
  status: 'published'
}

function mockPrisma() {
  return {
    syncRun: {
      create: vi.fn().mockResolvedValue({ id: 1, status: 'running' }),
      findFirst: vi.fn().mockResolvedValue({ id: 1, status: 'success' }),
      update: vi.fn().mockResolvedValue({ id: 1 })
    },
    course: {
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: 1 }),
      update: vi.fn().mockResolvedValue({ id: 1 })
    }
  } as unknown as PrismaService
}

describe('SyncService', () => {
  let service: SyncService
  let prisma: PrismaService
  let client: DigiformaClient
  let cache: CacheService
  let config: ConfigService
  let scheduler: { addCronJob: ReturnType<typeof vi.fn> }

  beforeEach(async () => {
    prisma = mockPrisma()
    client = { fetchAllPrograms: vi.fn() } as unknown as DigiformaClient
    cache = { invalidateCatalog: vi.fn() } as unknown as CacheService
    scheduler = { addCronJob: vi.fn() }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SyncService,
        {
          provide: ConfigService,
          useValue: { get: vi.fn((key: string) => (key === 'SYNC_CRON' ? '0 * * * *' : undefined)) }
        },
        { provide: DigiformaClient, useValue: client },
        { provide: PrismaService, useValue: prisma },
        { provide: CacheService, useValue: cache },
        { provide: SchedulerRegistry, useValue: scheduler }
      ]
    }).compile()

    service = module.get<SyncService>(SyncService)
    config = module.get<ConfigService>(ConfigService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  it('registers the cron job on module init', () => {
    service.onModuleInit()
    expect(scheduler.addCronJob).toHaveBeenCalledWith('digiforma-sync', expect.any(Object))
  })

  it('does not register a cron job with an invalid expression', () => {
    vi.mocked(config.get).mockReturnValue('invalid-cron')
    service.onModuleInit()
    expect(scheduler.addCronJob).not.toHaveBeenCalled()
  })

  it('upserts programs and tracks counts', async () => {
    vi.mocked(client.fetchAllPrograms).mockResolvedValue([sampleProgram])

    await service.run()

    expect(prisma.syncRun.create).toHaveBeenCalledWith({ data: { status: 'running' } })
    expect(prisma.course.create).toHaveBeenCalled()
    expect(prisma.syncRun.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'success' })
      })
    )
    expect(cache.invalidateCatalog).toHaveBeenCalled()
  })

  it('falls back to fixture when Digiforma fails', async () => {
    vi.mocked(client.fetchAllPrograms).mockRejectedValue(new Error('no key'))

    await service.run()

    expect(prisma.course.create).toHaveBeenCalled()
  })

  it('throws Digiforma errors in production instead of falling back', async () => {
    vi.mocked(config.get).mockImplementation((key: string) =>
      key === 'NODE_ENV' ? 'production' : '0 * * * *'
    )
    vi.mocked(client.fetchAllPrograms).mockRejectedValue(new Error('network'))

    await expect(service.run()).rejects.toThrow('network')
  })

  it('updates existing courses', async () => {
    vi.mocked(client.fetchAllPrograms).mockResolvedValue([sampleProgram])
    vi.mocked(prisma.course.findUnique).mockResolvedValue({ id: 1 } as unknown as Awaited<
      ReturnType<PrismaService['course']['findUnique']>
    >)

    await service.run()

    expect(prisma.course.update).toHaveBeenCalled()
  })

  it('logs individual program errors without failing the run', async () => {
    vi.mocked(client.fetchAllPrograms).mockResolvedValue([
      { id: 'prog-001' } as typeof sampleProgram,
      sampleProgram
    ])

    await service.run()

    expect(prisma.syncRun.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'success', failed: 1 })
      })
    )
  })

  it('returns the latest sync run', async () => {
    const latest = await service.getLatestRun()
    expect(prisma.syncRun.findFirst).toHaveBeenCalledWith({ orderBy: { startedAt: 'desc' } })
    expect(latest).toEqual({ id: 1, status: 'success' })
  })
})
