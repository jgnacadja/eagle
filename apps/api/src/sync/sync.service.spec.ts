import { ConflictException, NotFoundException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Test, TestingModule } from '@nestjs/testing'
import { SyncService } from './sync.service'
import { DigiformaClientFactory } from '../digiforma/digiforma-client.factory'
import type { DigiformaClient } from '../digiforma/digiforma.client'
import { CacheService } from '../common/cache/cache.service'
import { DirectusCatalogService } from '../directus/directus.catalog.service'
import { DirectusItemsClient } from '../directus/directus.items.client'
import { GeocodingService } from '../centres/geocoding.service'
import { SourceSecrets, type SourceConfig } from '../sources/source.types'
import { SourcesService } from '../sources/sources.service'

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

function makeSource(overrides: Partial<SourceConfig> = {}): SourceConfig {
  return {
    id: 'uuid-hq',
    code: 'hq',
    name: 'HQ',
    isHq: true,
    status: 'active',
    fromEnv: false,
    digiforma: { apiUrl: 'https://digi.example/graphql' },
    hubspot: {
      portalId: 'p',
      forms: { newsletter: null, demande: null, candidature: null, conseiller: null, rappel: null }
    },
    secrets: new SourceSecrets('key', null),
    ...overrides
  }
}

describe('SyncService', () => {
  let service: SyncService
  let clients: Record<string, DigiformaClient>
  let factory: DigiformaClientFactory
  let cache: CacheService
  let catalog: DirectusCatalogService
  let config: ConfigService
  let sources: SourcesService
  let directus: DirectusItemsClient
  let geocoding: GeocodingService
  let hq: SourceConfig
  let lyon: SourceConfig

  const releasedCount = () => vi.mocked(cache.releaseSyncLock).mock.calls.length
  // Le release de verrou est le dernier maillon de la chaîne
  // trigger → executeAll : attendre dessus garantit que le run est terminé.
  const waitForRelease = (count: number) =>
    vi.waitFor(() => expect(releasedCount()).toBeGreaterThanOrEqual(count))

  beforeEach(async () => {
    hq = makeSource()
    lyon = makeSource({ id: 'uuid-lyon', code: 'lyon', name: 'Lyon', isHq: false })
    clients = {
      'uuid-hq': { fetchAllPrograms: vi.fn() } as unknown as DigiformaClient,
      'uuid-lyon': { fetchAllPrograms: vi.fn() } as unknown as DigiformaClient
    }
    factory = {
      for: vi.fn((source: SourceConfig) => clients[source.id])
    } as unknown as DigiformaClientFactory
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
    sources = {
      listActive: vi.fn().mockResolvedValue([hq]),
      getByCode: vi.fn(async (code: string) => [hq, lyon].find((s) => s.code === code) ?? null),
      getHq: vi.fn().mockResolvedValue(hq)
    } as unknown as SourcesService
    directus = { updateOne: vi.fn().mockResolvedValue(undefined) } as unknown as DirectusItemsClient
    geocoding = {
      syncMissing: vi.fn().mockResolvedValue({ geocoded: 0, renamed: 0, failed: 0 })
    } as unknown as GeocodingService
    vi.mocked(clients['uuid-hq'].fetchAllPrograms).mockResolvedValue([sampleProgram])
    vi.mocked(clients['uuid-lyon'].fetchAllPrograms).mockResolvedValue([sampleProgram])

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SyncService,
        { provide: ConfigService, useValue: { get: vi.fn(() => undefined) } },
        { provide: DigiformaClientFactory, useValue: factory },
        { provide: CacheService, useValue: cache },
        { provide: DirectusCatalogService, useValue: catalog },
        { provide: GeocodingService, useValue: geocoding },
        { provide: SourcesService, useValue: sources },
        { provide: DirectusItemsClient, useValue: directus }
      ]
    }).compile()

    service = module.get<SyncService>(SyncService)
    config = module.get<ConfigService>(ConfigService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  it('trigger() starts the run and acknowledges each source', async () => {
    await expect(service.trigger()).resolves.toEqual({
      started: true,
      runs: [{ source: 'hq', status: 'accepted' }]
    })
    await waitForRelease(1)

    expect(clients['uuid-hq'].fetchAllPrograms).toHaveBeenCalledTimes(1)
    expect(cache.setSyncRun).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: 'success', source: 'hq' }),
      'hq'
    )
  })

  it('trigger() refuses a second run while one is in progress', async () => {
    vi.mocked(clients['uuid-hq'].fetchAllPrograms).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve([sampleProgram]), 20))
    )

    const [first, second] = await Promise.all([service.trigger(), service.trigger()])

    expect([first.started, second.started].sort()).toEqual([false, true])
    await waitForRelease(1)
    expect(clients['uuid-hq'].fetchAllPrograms).toHaveBeenCalledTimes(1)
  })

  it('trigger({ sourceCode }) rejects with 409 while a run is in progress', async () => {
    vi.mocked(clients['uuid-hq'].fetchAllPrograms).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve([sampleProgram]), 20))
    )

    await service.trigger()
    await expect(service.trigger({ sourceCode: 'hq' })).rejects.toBeInstanceOf(ConflictException)
    await waitForRelease(1)
  })

  it('trigger() skips when another instance holds every lock', async () => {
    vi.mocked(cache.acquireSyncLock).mockResolvedValue(false)

    await expect(service.trigger()).resolves.toEqual({
      started: false,
      runs: [{ source: 'hq', status: 'locked' }]
    })

    expect(clients['uuid-hq'].fetchAllPrograms).not.toHaveBeenCalled()
    expect(cache.releaseSyncLock).not.toHaveBeenCalled()
    // Le run local est de nouveau déclenchable.
    vi.mocked(cache.acquireSyncLock).mockResolvedValue(true)
    await expect(service.trigger()).resolves.toMatchObject({ started: true })
    await waitForRelease(1)
  })

  it('acquires one lock per source, scaled to the number of sources', async () => {
    vi.mocked(sources.listActive).mockResolvedValue([hq, lyon])

    await service.trigger()
    await waitForRelease(2)

    expect(cache.acquireSyncLock).toHaveBeenCalledWith(expect.any(String), 1_200_000, 'hq')
    expect(cache.acquireSyncLock).toHaveBeenCalledWith(expect.any(String), 1_200_000, 'lyon')
    expect(cache.releaseSyncLock).toHaveBeenCalledWith(expect.any(String), 'hq')
    expect(cache.releaseSyncLock).toHaveBeenCalledWith(expect.any(String), 'lyon')
  })

  it('skips only the locked source and still syncs the others', async () => {
    vi.mocked(sources.listActive).mockResolvedValue([hq, lyon])
    vi.mocked(cache.acquireSyncLock).mockImplementation(async (_t, _ttl, code) => code !== 'hq')

    await expect(service.trigger()).resolves.toEqual({
      started: true,
      runs: [
        { source: 'hq', status: 'locked' },
        { source: 'lyon', status: 'accepted' }
      ]
    })
    await waitForRelease(1)

    expect(clients['uuid-hq'].fetchAllPrograms).not.toHaveBeenCalled()
    expect(clients['uuid-lyon'].fetchAllPrograms).toHaveBeenCalledTimes(1)
  })

  describe('single source (?source=)', () => {
    it('syncs only that source', async () => {
      vi.mocked(sources.listActive).mockResolvedValue([hq, lyon])

      await expect(service.trigger({ sourceCode: 'lyon' })).resolves.toEqual({
        started: true,
        runs: [{ source: 'lyon', status: 'accepted' }]
      })
      await waitForRelease(1)

      expect(clients['uuid-hq'].fetchAllPrograms).not.toHaveBeenCalled()
      expect(catalog.upsertMany).toHaveBeenCalledWith(expect.any(Array), 'uuid-lyon')
    })

    it('404s on an unknown code and leaves the service usable', async () => {
      await expect(service.trigger({ sourceCode: 'nope' })).rejects.toBeInstanceOf(
        NotFoundException
      )
      await expect(service.trigger()).resolves.toMatchObject({ started: true })
      await waitForRelease(1)
    })

    it('409s on an inactive source', async () => {
      lyon.status = 'inactive'
      await expect(service.trigger({ sourceCode: 'lyon' })).rejects.toBeInstanceOf(
        ConflictException
      )
      expect(cache.acquireSyncLock).not.toHaveBeenCalled()
    })

    it('409s when the source lock is taken, without running', async () => {
      vi.mocked(cache.acquireSyncLock).mockResolvedValue(false)

      await expect(service.trigger({ sourceCode: 'hq' })).rejects.toBeInstanceOf(ConflictException)
      expect(clients['uuid-hq'].fetchAllPrograms).not.toHaveBeenCalled()
    })
  })

  describe('multi-source run (CA1)', () => {
    beforeEach(() => {
      vi.mocked(sources.listActive).mockResolvedValue([hq, lyon])
    })

    it('upserts each source with its own id and one SyncRun per source', async () => {
      vi.mocked(catalog.upsertMany)
        .mockResolvedValueOnce({ inserted: 2, updated: 1 })
        .mockResolvedValueOnce({ inserted: 0, updated: 4 })

      await service.trigger()
      await waitForRelease(2)

      expect(catalog.upsertMany).toHaveBeenNthCalledWith(1, expect.any(Array), 'uuid-hq')
      expect(catalog.upsertMany).toHaveBeenNthCalledWith(2, expect.any(Array), 'uuid-lyon')
      expect(cache.setSyncRun).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'success', source: 'hq', inserted: 2, updated: 1 }),
        'hq'
      )
      expect(cache.setSyncRun).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'success', source: 'lyon', inserted: 0, updated: 4 }),
        'lyon'
      )
    })

    it('isolates a failing source: the other still syncs', async () => {
      vi.mocked(clients['uuid-hq'].fetchAllPrograms).mockRejectedValue(new Error('hq 500'))
      vi.mocked(config.get).mockImplementation((key: string) =>
        key === 'NODE_ENV' ? 'production' : undefined
      )

      await service.trigger()
      await waitForRelease(2)

      expect(cache.setSyncRun).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'failed', source: 'hq', error: 'hq 500' }),
        'hq'
      )
      expect(cache.setSyncRun).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'success', source: 'lyon' }),
        'lyon'
      )
      expect(catalog.upsertMany).toHaveBeenCalledTimes(1)
      expect(cache.invalidateCatalog).toHaveBeenCalledTimes(1)
    })

    it('geocodes and invalidates the catalog once for all sources', async () => {
      await service.trigger()
      await waitForRelease(2)

      expect(geocoding.syncMissing).toHaveBeenCalledTimes(1)
      expect(cache.invalidateCatalog).toHaveBeenCalledTimes(1)
    })

    it('records the outcome on each source row', async () => {
      await service.trigger()
      await waitForRelease(2)

      expect(directus.updateOne).toHaveBeenCalledWith(
        'sources',
        'uuid-hq',
        expect.objectContaining({ last_sync_status: 'success', last_sync_at: expect.any(String) })
      )
      expect(directus.updateOne).toHaveBeenCalledWith('sources', 'uuid-lyon', expect.anything())
    })

    it('marks successful sources failed when the shared steps fail', async () => {
      vi.mocked(geocoding.syncMissing).mockRejectedValue(new Error('geocoder down'))

      await service.trigger()
      await waitForRelease(2)

      expect(cache.invalidateCatalog).not.toHaveBeenCalled()
      expect(cache.setSyncRun).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'failed', source: 'hq', error: 'geocoder down' }),
        'hq'
      )
      expect(cache.setSyncRun).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'failed', source: 'lyon', error: 'geocoder down' }),
        'lyon'
      )
    })
  })

  describe('env fallback (CA4)', () => {
    it('syncs the env source without writing an id when no HQ row exists', async () => {
      const envHq = makeSource({ id: 'env', fromEnv: true })
      vi.mocked(sources.listActive).mockResolvedValue([envHq])
      vi.mocked(sources.getHq).mockResolvedValue(envHq)
      clients.env = { fetchAllPrograms: vi.fn().mockResolvedValue([sampleProgram]) } as never

      await service.trigger()
      await waitForRelease(1)

      expect(catalog.upsertMany).toHaveBeenCalledWith(expect.any(Array), undefined)
      expect(directus.updateOne).not.toHaveBeenCalled()
    })

    it('targets the HQ row when the env source stands in for it', async () => {
      const envHq = makeSource({ id: 'env', fromEnv: true })
      vi.mocked(sources.listActive).mockResolvedValue([envHq])
      vi.mocked(sources.getHq).mockResolvedValue(hq)
      clients.env = { fetchAllPrograms: vi.fn().mockResolvedValue([sampleProgram]) } as never

      await service.trigger()
      await waitForRelease(1)

      expect(catalog.upsertMany).toHaveBeenCalledWith(expect.any(Array), 'uuid-hq')
    })
  })

  it('upserts programs and tracks counts', async () => {
    await service.trigger()
    await waitForRelease(1)

    expect(catalog.upsertMany).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ digiforma_id: 'prog-001' })]),
      'uuid-hq'
    )
    expect(cache.invalidateCatalog).toHaveBeenCalled()
    expect(cache.setSyncRun).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: 'success', inserted: 1, updated: 0 }),
      'hq'
    )
  })

  it('falls back to fixture when Digiforma fails', async () => {
    vi.mocked(clients['uuid-hq'].fetchAllPrograms).mockRejectedValue(new Error('no key'))

    await service.trigger()
    await waitForRelease(1)

    expect(catalog.upsertMany).toHaveBeenCalled()
  })

  it('records Digiforma errors as failed in production instead of falling back', async () => {
    vi.mocked(config.get).mockImplementation((key: string) =>
      key === 'NODE_ENV' ? 'production' : undefined
    )
    vi.mocked(clients['uuid-hq'].fetchAllPrograms).mockRejectedValue(new Error('network'))

    await service.trigger()
    await waitForRelease(1)

    expect(cache.setSyncRun).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: 'failed', error: 'network' }),
      'hq'
    )
    expect(cache.invalidateCatalog).not.toHaveBeenCalled()
  })

  it('logs individual program errors without failing the run', async () => {
    vi.mocked(clients['uuid-hq'].fetchAllPrograms).mockResolvedValue([
      { id: 'prog-001' } as typeof sampleProgram,
      sampleProgram
    ])

    await service.trigger()
    await waitForRelease(1)

    expect(cache.setSyncRun).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: 'success', failed: 1 }),
      'hq'
    )
  })

  it('returns the latest sync run', async () => {
    const run = { status: 'success' } as Awaited<ReturnType<SyncService['getLatestRun']>>
    vi.mocked(cache.getSyncRun).mockResolvedValue(run)

    const latest = await service.getLatestRun()

    expect(cache.getSyncRun).toHaveBeenCalled()
    expect(latest).toEqual(run)
  })

  it('returns the latest run of each active source', async () => {
    vi.mocked(sources.listActive).mockResolvedValue([hq, lyon])
    vi.mocked(cache.getSyncRun).mockImplementation(async (code) =>
      code === 'hq' ? ({ status: 'success' } as never) : null
    )

    await expect(service.getRunsBySource()).resolves.toEqual({
      hq: { status: 'success' },
      lyon: null
    })
  })

  it('records a failed sync run and releases the lock when upsert fails', async () => {
    vi.mocked(catalog.upsertMany).mockRejectedValue(new Error('directus down'))

    await service.trigger()
    await waitForRelease(1)

    expect(cache.setSyncRun).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: 'failed' }),
      'hq'
    )
  })

  it('records unknown errors thrown as non-Error values', async () => {
    vi.mocked(catalog.upsertMany).mockRejectedValue('plain string failure')

    await service.trigger()
    await waitForRelease(1)

    expect(cache.setSyncRun).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: 'failed', error: 'Unknown error' }),
      'hq'
    )
  })

  it('does not fail a run when recording on the source row fails', async () => {
    vi.mocked(directus.updateOne).mockRejectedValue(new Error('patch failed'))

    await service.trigger()
    await waitForRelease(1)

    expect(cache.setSyncRun).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: 'success' }),
      'hq'
    )
  })
})
