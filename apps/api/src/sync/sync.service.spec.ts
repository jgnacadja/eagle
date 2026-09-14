import { Test, TestingModule } from '@nestjs/testing'
import { ConfigService } from '@nestjs/config'
import { SchedulerRegistry } from '@nestjs/schedule'
import { SyncService } from './sync.service'
import { DigiformaClient } from '../digiforma/digiforma.client'
import { CacheService } from '../common/cache/cache.service'
import { DirectusCatalogService } from '../directus/directus.catalog.service'

const sampleProgram = {
  id: 'prog-001',
  name: 'Pilotage de projet',
  durationInDays: 3,
  durationInHours: 21,
  cpf: true,
  cpfCode: 'CPF-12345',
  certificationType: 'Certificat',
  certifierName: 'LEARN UP',
  category: { id: 'cat-1', name: 'Management' },
  costsInter: [{ cost: 1800, vat: 20, type: 'inter' }]
}

describe('SyncService', () => {
  let service: SyncService
  let client: DigiformaClient
  let cache: CacheService
  let catalog: DirectusCatalogService
  let config: ConfigService
  let scheduler: { addCronJob: ReturnType<typeof vi.fn> }

  beforeEach(async () => {
    client = { fetchAllPrograms: vi.fn() } as unknown as DigiformaClient
    cache = {
      invalidateCatalog: vi.fn(),
      setSyncRun: vi.fn(),
      getSyncRun: vi.fn()
    } as unknown as CacheService
    catalog = {
      upsertMany: vi.fn().mockResolvedValue({ inserted: 1, updated: 0 })
    } as unknown as DirectusCatalogService
    scheduler = { addCronJob: vi.fn() }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SyncService,
        {
          provide: ConfigService,
          useValue: { get: vi.fn((key: string) => (key === 'SYNC_CRON' ? '0 * * * *' : undefined)) }
        },
        { provide: DigiformaClient, useValue: client },
        { provide: CacheService, useValue: cache },
        { provide: DirectusCatalogService, useValue: catalog },
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

    expect(catalog.upsertMany).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ digiforma_id: 'prog-001' })])
    )
    expect(cache.invalidateCatalog).toHaveBeenCalled()
    expect(cache.setSyncRun).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: 'success', inserted: 1, updated: 0 })
    )
  })

  it('falls back to fixture when Digiforma fails', async () => {
    vi.mocked(client.fetchAllPrograms).mockRejectedValue(new Error('no key'))

    await service.run()

    expect(catalog.upsertMany).toHaveBeenCalled()
  })

  it('throws Digiforma errors in production instead of falling back', async () => {
    vi.mocked(config.get).mockImplementation((key: string) =>
      key === 'NODE_ENV' ? 'production' : '0 * * * *'
    )
    vi.mocked(client.fetchAllPrograms).mockRejectedValue(new Error('network'))

    await expect(service.run()).rejects.toThrow('network')
  })

  it('logs individual program errors without failing the run', async () => {
    vi.mocked(client.fetchAllPrograms).mockResolvedValue([
      { id: 'prog-001' } as typeof sampleProgram,
      sampleProgram
    ])

    await service.run()

    expect(cache.setSyncRun).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: 'success', failed: 1 })
    )
  })

  it('returns the latest sync run', async () => {
    const run = { status: 'success' } as Awaited<ReturnType<SyncService['getLatestRun']>>
    vi.mocked(cache.getSyncRun).mockResolvedValue(run)

    const latest = await service.getLatestRun()

    expect(cache.getSyncRun).toHaveBeenCalled()
    expect(latest).toEqual(run)
  })

  it('records a failed sync run when Directus upsert fails', async () => {
    vi.mocked(client.fetchAllPrograms).mockResolvedValue([sampleProgram])
    vi.mocked(catalog.upsertMany).mockRejectedValue(new Error('directus down'))

    await expect(service.run()).rejects.toThrow('directus down')

    expect(cache.setSyncRun).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'failed' }))
  })
})
