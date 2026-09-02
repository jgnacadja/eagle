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
      update: vi.fn().mockResolvedValue({ id: 1 })
    },
    formation: {
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

  beforeEach(async () => {
    prisma = mockPrisma()
    client = { fetchAllPrograms: vi.fn() } as unknown as DigiformaClient
    cache = { invalidateCatalog: vi.fn() } as unknown as CacheService

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SyncService,
        {
          provide: ConfigService,
          useValue: { get: () => '0 * * * *' }
        },
        { provide: DigiformaClient, useValue: client },
        { provide: PrismaService, useValue: prisma },
        { provide: CacheService, useValue: cache },
        { provide: SchedulerRegistry, useValue: { addCronJob: vi.fn() } }
      ]
    }).compile()

    service = module.get<SyncService>(SyncService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  it('upserts programs and tracks counts', async () => {
    vi.mocked(client.fetchAllPrograms).mockResolvedValue([sampleProgram])

    await service.run()

    expect(prisma.syncRun.create).toHaveBeenCalledWith({ data: { status: 'running' } })
    expect(prisma.formation.create).toHaveBeenCalled()
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

    expect(prisma.formation.create).toHaveBeenCalled()
  })

  it('updates existing formations', async () => {
    vi.mocked(client.fetchAllPrograms).mockResolvedValue([sampleProgram])
    vi.mocked(prisma.formation.findUnique).mockResolvedValue({ id: 1 } as unknown as Awaited<
      ReturnType<PrismaService['formation']['findUnique']>
    >)

    await service.run()

    expect(prisma.formation.update).toHaveBeenCalled()
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
})
