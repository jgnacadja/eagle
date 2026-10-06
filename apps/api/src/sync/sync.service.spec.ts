import { Test, TestingModule } from '@nestjs/testing'
import { ConfigService } from '@nestjs/config'
import { SyncService } from './sync.service'
import { DigiformaClient } from '../digiforma/digiforma.client'
import { CacheService } from '../common/cache/cache.service'
import { DirectusCatalogService } from '../directus/directus.catalog.service'
import { GeocodingService } from '../centres/geocoding.service'

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

// Déclenche la sync et attend sa fin : la libération du verrou est le
// dernier maillon de la chaîne trigger → execute → finally.
async function runAndWait(service: SyncService, cache: CacheService): Promise<void> {
  await service.trigger()
  await vi.waitFor(() => {
    expect(vi.mocked(cache.releaseSyncLock)).toHaveBeenCalledTimes(1)
  })
}

describe('SyncService', () => {
  let service: SyncService
  let client: DigiformaClient
  let cache: CacheService
  let catalog: DirectusCatalogService
  let config: ConfigService

  beforeEach(async () => {
    client = { fetchAllPrograms: vi.fn() } as unknown as DigiformaClient
    cache = {
      invalidateCatalog: vi.fn(),
      setSyncRun: vi.fn(),
      getSyncRun: vi.fn(),
      acquireSyncLock: vi.fn().mockResolvedValue(true),
      releaseSyncLock: vi.fn().mockResolvedValue(undefined)
    } as unknown as CacheService
    catalog = {
      upsertMany: vi.fn().mockResolvedValue({ inserted: 1, updated: 0 })
    } as unknown as DirectusCatalogService

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SyncService,
        {
          provide: ConfigService,
          useValue: { get: vi.fn(() => undefined) }
        },
        { provide: DigiformaClient, useValue: client },
        { provide: CacheService, useValue: cache },
        { provide: DirectusCatalogService, useValue: catalog },
        {
          provide: GeocodingService,
          useValue: {
            syncMissing: vi.fn().mockResolvedValue({ geocoded: 0, renamed: 0, failed: 0 })
          }
        }
      ]
    }).compile()

    service = module.get<SyncService>(SyncService)
    config = module.get<ConfigService>(ConfigService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  it('trigger() starts the run and returns true', async () => {
    vi.mocked(client.fetchAllPrograms).mockResolvedValue([sampleProgram])

    await expect(service.trigger()).resolves.toBe(true)
    // releaseSyncLock est le dernier maillon de la chaîne (finally du
    // trigger) — attendre sur lui garantit que le run est terminé.
    await vi.waitFor(() => expect(cache.releaseSyncLock).toHaveBeenCalledTimes(1))

    expect(client.fetchAllPrograms).toHaveBeenCalledTimes(1)
    expect(cache.setSyncRun).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: 'success' })
    )
  })

  it('trigger() refuses a second run while one is in progress', async () => {
    vi.mocked(client.fetchAllPrograms).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve([sampleProgram]), 20))
    )

    const [first, second] = await Promise.all([service.trigger(), service.trigger()])

    expect([first, second].sort()).toEqual([false, true])
    await vi.waitFor(() => expect(cache.releaseSyncLock).toHaveBeenCalledTimes(1))
    expect(client.fetchAllPrograms).toHaveBeenCalledTimes(1)
    expect(cache.setSyncRun).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: 'success' })
    )
  })

  it('trigger() skips when another instance holds the lock', async () => {
    vi.mocked(cache.acquireSyncLock).mockResolvedValue(false)

    await expect(service.trigger()).resolves.toBe(false)

    expect(client.fetchAllPrograms).not.toHaveBeenCalled()
    expect(cache.releaseSyncLock).not.toHaveBeenCalled()
  })

  it('upserts programs and tracks counts', async () => {
    vi.mocked(client.fetchAllPrograms).mockResolvedValue([sampleProgram])

    await runAndWait(service, cache)

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

    await runAndWait(service, cache)

    expect(catalog.upsertMany).toHaveBeenCalled()
  })

  it('records Digiforma errors as failed in production instead of falling back', async () => {
    vi.mocked(config.get).mockImplementation((key: string) =>
      key === 'NODE_ENV' ? 'production' : undefined
    )
    vi.mocked(client.fetchAllPrograms).mockRejectedValue(new Error('network'))

    await runAndWait(service, cache)

    expect(cache.setSyncRun).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: 'failed', error: 'network' })
    )
  })

  it('logs individual program errors without failing the run', async () => {
    vi.mocked(client.fetchAllPrograms).mockResolvedValue([
      { id: 'prog-001' } as typeof sampleProgram,
      sampleProgram
    ])

    await runAndWait(service, cache)

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

  it('records a failed sync run and releases the lock when upsert fails', async () => {
    vi.mocked(client.fetchAllPrograms).mockResolvedValue([sampleProgram])
    vi.mocked(catalog.upsertMany).mockRejectedValue(new Error('directus down'))

    await runAndWait(service, cache)

    expect(cache.setSyncRun).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'failed' }))
  })

  it('records unknown errors thrown as non-Error values', async () => {
    vi.mocked(client.fetchAllPrograms).mockResolvedValue([sampleProgram])
    vi.mocked(catalog.upsertMany).mockRejectedValue('plain string failure')

    await runAndWait(service, cache)

    expect(cache.setSyncRun).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: 'failed', error: 'Unknown error' })
    )
  })
})
