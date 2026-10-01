import { Test, TestingModule } from '@nestjs/testing'
import { ConfigService } from '@nestjs/config'
import { EventEmitter } from 'node:events'
import { CacheService } from './cache.service'

// Store partagé entre toutes les instances MockRedis : permet de simuler
// plusieurs instances CacheService derrière un seul Redis (multi-instances).
const sharedStore = vi.hoisted(() => new Map<string, string>())

vi.mock('ioredis', () => ({
  default: class MockRedis {
    private readonly store = sharedStore
    status?: string

    get = vi.fn((key: string) => Promise.resolve(this.store.get(key) ?? null))

    set = vi.fn((key: string, value: string | number, ...args: unknown[]) => {
      // SET ... NX : null si la clé existe déjà
      if (args.includes('NX') && this.store.has(key)) return Promise.resolve(null)
      this.store.set(key, String(value))
      return Promise.resolve('OK')
    })

    eval = vi.fn((_script: string, _numKeys: number, key: string, token: string) => {
      if (this.store.get(key) !== token) return Promise.resolve(0)
      this.store.delete(key)
      return Promise.resolve(1)
    })

    incr = vi.fn((key: string) => {
      const current = parseInt(this.store.get(key) ?? '0', 10) + 1
      this.store.set(key, String(current))
      return Promise.resolve(current)
    })

    setex = vi.fn((key: string, _ttl: number, value: string) => {
      this.store.set(key, value)
      return Promise.resolve('OK')
    })

    quit = vi.fn().mockResolvedValue(undefined)

    on = vi.fn()

    scanStream = vi.fn(({ match }: { match?: string }) => {
      const pattern = match ? `^${match.replace(/\*/g, '.*')}$` : '.*'
      const regex = new RegExp(pattern)
      const keys = Array.from(this.store.keys()).filter((key) => regex.test(key))
      const stream = new EventEmitter()
      setImmediate(() => {
        stream.emit('data', keys)
        stream.emit('end')
      })
      return stream
    })

    pipeline = vi.fn(() => {
      const self = {
        del: (key: string) => {
          this.store.delete(key)
          return self
        },
        exec: () => Promise.resolve([])
      }
      return self
    })
  }
}))

describe('CacheService', () => {
  let service: CacheService

  const buildService = async (): Promise<CacheService> => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheService,
        {
          provide: ConfigService,
          useValue: {
            get: () => 'redis://localhost:6379',
            getOrThrow: () => 'redis://localhost:6379'
          }
        }
      ]
    }).compile()

    const instance = module.get<CacheService>(CacheService)
    const client = Reflect.get(instance, 'client') as { status?: string }
    client.status = 'ready'
    await instance.onModuleInit()
    return instance
  }

  beforeEach(async () => {
    sharedStore.clear()
    service = await buildService()
  })

  afterEach(async () => {
    await service.onModuleDestroy()
  })

  it('returns null for missing keys', async () => {
    const value = await service.get('courses')
    expect(value).toBeNull()
  })

  it('sets and gets JSON values', async () => {
    await service.set('courses', { id: 1 })
    const value = await service.get('courses')
    expect(value).toEqual({ id: 1 })
  })

  it('deletes a key by pattern', async () => {
    await service.set('courses', { id: 1 })
    await service.del('courses')
    const value = await service.get('courses')
    expect(value).toBeNull()
  })

  it('invalidates the catalogue and bumps the version', async () => {
    await service.set('courses', { id: 1 })
    const before = service.version
    await service.invalidateCatalog()

    const value = await service.get('courses')
    expect(value).toBeNull()
    expect(service.version).toBe(before + 1)
  })

  it('notifies catalogue listeners on full and targeted invalidations until unsubscribed', async () => {
    const listener = vi.fn()
    const failing = vi.fn(() => {
      throw new Error('listener boom')
    })
    const unsubscribe = service.onCatalogInvalidated(listener)
    service.onCatalogInvalidated(failing)

    await service.invalidateCatalog()
    await service.invalidatePatterns(['courses:*'])
    expect(listener).toHaveBeenCalledTimes(2)
    expect(failing).toHaveBeenCalledTimes(2)

    unsubscribe()
    await service.invalidateCatalog()
    expect(listener).toHaveBeenCalledTimes(2)
  })

  it('catches up on invalidations made by another instance', async () => {
    const listener = vi.fn()
    service.onCatalogInvalidated(listener)
    const client = Reflect.get(service, 'client') as {
      set: (key: string, value: string) => Promise<unknown>
    }
    await service.invalidateCatalog()
    listener.mockClear()

    // Rien de nouveau : la génération connue est celle de notre propre purge.
    await expect(service.syncInvalidations()).resolves.toBe(false)
    expect(listener).not.toHaveBeenCalled()

    // Purge ciblée d'une autre instance : génération avancée, version inchangée.
    const version = service.version
    await client.set('catalog:generation', '5')
    await expect(service.syncInvalidations()).resolves.toBe(true)
    expect(listener).toHaveBeenCalledOnce()
    expect(service.version).toBe(version)

    // Purge complète d'une autre instance : génération et version avancées.
    await client.set('catalog:generation', '7')
    await client.set('catalog:version', '9')
    await expect(service.syncInvalidations()).resolves.toBe(true)
    expect(listener).toHaveBeenCalledTimes(2)
    expect(service.key('x')).toBe('catalog:v9:x')

    await expect(service.syncInvalidations()).resolves.toBe(false)
  })

  it('has nothing to catch up on a fresh store and keeps its version without a stored one', async () => {
    await expect(service.syncInvalidations()).resolves.toBe(false)

    const client = Reflect.get(service, 'client') as {
      set: (key: string, value: string) => Promise<unknown>
    }
    await client.set('catalog:generation', '2')
    await expect(service.syncInvalidations()).resolves.toBe(true)
    expect(service.key('x')).toBe('catalog:v0:x')
  })

  it('reports nothing when the invalidation sync cannot reach Redis', async () => {
    const client = Reflect.get(service, 'client') as { get: ReturnType<typeof vi.fn> }
    client.get.mockRejectedValueOnce(new Error('down'))

    await expect(service.syncInvalidations()).resolves.toBe(false)
  })

  it('retries a generation whose version read failed', async () => {
    const client = Reflect.get(service, 'client') as {
      get: ReturnType<typeof vi.fn>
      set: (key: string, value: string) => Promise<unknown>
    }
    await client.set('catalog:generation', '3')
    await client.set('catalog:version', '4')

    // Génération lue, version en échec : rien n'est consommé.
    client.get.mockImplementationOnce(() => Promise.resolve('3'))
    client.get.mockRejectedValueOnce(new Error('down'))
    await expect(service.syncInvalidations()).resolves.toBe(false)
    expect(service.key('x')).toBe('catalog:v0:x')

    // Passage suivant : les deux lectures aboutissent.
    await expect(service.syncInvalidations()).resolves.toBe(true)
    expect(service.key('x')).toBe('catalog:v4:x')
  })

  it('announces a new version to other instances even when the old keys cannot be purged', async () => {
    const client = Reflect.get(service, 'client') as {
      get: (key: string) => Promise<string | null>
      scanStream: ReturnType<typeof vi.fn>
    }
    const generation = Number((await client.get('catalog:generation')) ?? '0')
    client.scanStream = vi.fn().mockImplementation(() => {
      throw new Error('scan error')
    })

    await service.invalidateCatalog()

    expect(Number(await client.get('catalog:generation'))).toBe(generation + 1)
  })

  it('returns null for non-JSON cached values', async () => {
    const key = service.key('broken')
    await service.set('broken', { ok: true })
    const redis = Reflect.get(service, 'client') as {
      set: (k: string, v: string) => Promise<unknown>
    }
    await redis.set(key, 'not-json')

    const value = await service.get('broken')
    expect(value).toBeNull()
  })

  it('returns null when Redis get fails', async () => {
    const redis = Reflect.get(service, 'client') as { get: ReturnType<typeof vi.fn> }
    redis.get = vi.fn().mockRejectedValue(new Error('redis down'))

    const value = await service.get('courses')
    expect(value).toBeNull()
  })

  it('does not throw when Redis set fails', async () => {
    const redis = Reflect.get(service, 'client') as { setex: ReturnType<typeof vi.fn> }
    redis.setex = vi.fn().mockRejectedValue(new Error('redis down'))

    await expect(service.set('courses', { id: 1 })).resolves.toBeUndefined()
  })

  it('defaults the cache version to 0 when Redis is unreachable at boot', async () => {
    const redis = Reflect.get(service, 'client') as { get: ReturnType<typeof vi.fn> }
    redis.get = vi.fn().mockRejectedValue(new Error('redis down'))

    await expect(service.onModuleInit()).resolves.toBeUndefined()
    expect(service.key('courses')).toBe('catalog:v0:courses')
  })

  it('does not throw when delete by pattern fails', async () => {
    const redis = Reflect.get(service, 'client') as {
      scanStream: ReturnType<typeof vi.fn>
    }
    redis.scanStream = vi.fn().mockImplementation(() => {
      throw new Error('scan error')
    })

    await expect(service.del('courses')).resolves.toBeUndefined()
  })

  it('disables the cache when REDIS_URL is missing', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheService,
        {
          provide: ConfigService,
          useValue: { get: () => undefined }
        }
      ]
    }).compile()

    const disabled = module.get<CacheService>(CacheService)
    await disabled.onModuleInit()

    await expect(disabled.get('courses')).resolves.toBeNull()
    await expect(disabled.set('courses', { id: 1 })).resolves.toBeUndefined()
    const listener = vi.fn()
    disabled.onCatalogInvalidated(listener)
    await expect(disabled.invalidateCatalog()).resolves.toBeUndefined()
    expect(listener).toHaveBeenCalledOnce()
    await expect(disabled.invalidatePatterns(['courses:*'])).resolves.toBeUndefined()
    expect(listener).toHaveBeenCalledTimes(2)
    await expect(disabled.syncInvalidations()).resolves.toBe(false)
    await expect(disabled.getSyncRun()).resolves.toBeNull()
    expect(disabled.key('courses')).toBe('catalog:v0:courses')
    await expect(disabled.onModuleDestroy()).resolves.toBeUndefined()
  })

  it('deletes only the matching patterns on invalidatePatterns', async () => {
    await service.set('courses', { id: 1 })
    await service.set('centres', { id: 2 })

    await service.invalidatePatterns(['courses'])

    await expect(service.get('courses')).resolves.toBeNull()
    await expect(service.get('centres')).resolves.toEqual({ id: 2 })
  })

  it('round-trips the sync run status', async () => {
    const run = {
      status: 'success' as const,
      startedAt: '2025-01-01T00:00:00Z',
      finishedAt: '2025-01-01T00:01:00Z',
      inserted: 3,
      updated: 1,
      failed: 0,
      error: null
    }

    await service.setSyncRun(run)

    await expect(service.getSyncRun()).resolves.toEqual(run)
  })

  it('returns null when the sync run store is unreadable', async () => {
    const redis = Reflect.get(service, 'client') as { get: ReturnType<typeof vi.fn> }
    redis.get = vi.fn().mockRejectedValue(new Error('redis down'))

    await expect(service.getSyncRun()).resolves.toBeNull()
  })

  it('returns null for a corrupt sync run payload', async () => {
    const redis = Reflect.get(service, 'client') as {
      set: (k: string, v: string) => Promise<unknown>
    }
    await redis.set('sync:last_run', 'not-json')

    await expect(service.getSyncRun()).resolves.toBeNull()
  })

  it('acquires the sync lock once and releases it to its owner only', async () => {
    const other = await buildService()

    await expect(service.acquireSyncLock('token-a', 60_000)).resolves.toBe(true)
    await expect(other.acquireSyncLock('token-b', 60_000)).resolves.toBe(false)

    // Un autre token ne libère pas le verrou (TTL dépassé entre-temps).
    await other.releaseSyncLock('token-b')
    await expect(other.acquireSyncLock('token-b', 60_000)).resolves.toBe(false)

    await service.releaseSyncLock('token-a')
    await expect(other.acquireSyncLock('token-b', 60_000)).resolves.toBe(true)

    await other.onModuleDestroy()
  })

  it('fails open on the sync lock when Redis is absent or errors', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CacheService, { provide: ConfigService, useValue: { get: () => undefined } }]
    }).compile()
    const disabled = module.get<CacheService>(CacheService)
    await disabled.onModuleInit()

    await expect(disabled.acquireSyncLock('t', 60_000)).resolves.toBe(true)
    await expect(disabled.releaseSyncLock('t')).resolves.toBeUndefined()

    const redis = Reflect.get(service, 'client') as { set: ReturnType<typeof vi.fn> }
    redis.set = vi.fn().mockRejectedValue(new Error('redis down'))
    await expect(service.acquireSyncLock('t', 60_000)).resolves.toBe(true)

    const redisEval = Reflect.get(service, 'client') as { eval: ReturnType<typeof vi.fn> }
    redisEval.eval = vi.fn().mockRejectedValue(new Error('redis down'))
    await expect(service.releaseSyncLock('t')).resolves.toBeUndefined()
  })

  it('does not throw when setSyncRun fails', async () => {
    const redis = Reflect.get(service, 'client') as { setex: ReturnType<typeof vi.fn> }
    redis.setex = vi.fn().mockRejectedValue(new Error('redis down'))

    await expect(
      service.setSyncRun({
        status: 'running',
        startedAt: '2025-01-01T00:00:00Z',
        finishedAt: null,
        inserted: 0,
        updated: 0,
        failed: 0,
        error: null
      })
    ).resolves.toBeUndefined()
  })

  it('does not throw when the version bump fails during invalidation', async () => {
    const redis = Reflect.get(service, 'client') as { incr: ReturnType<typeof vi.fn> }
    redis.incr = vi.fn().mockRejectedValue(new Error('redis down'))

    await expect(service.invalidateCatalog()).resolves.toBeUndefined()
  })

  it('marks the cache unavailable on connection error, once', async () => {
    const redis = Reflect.get(service, 'client') as { on: ReturnType<typeof vi.fn> }
    const onError = redis.on.mock.calls.find(([event]) => event === 'error')?.[1] as (
      e: Error
    ) => void

    onError(new Error('lost'))
    onError(new Error('lost again'))

    await expect(service.get('courses')).resolves.toBeNull()
  })

  it('marks the cache unavailable on close and end events', async () => {
    const redis = Reflect.get(service, 'client') as { on: ReturnType<typeof vi.fn> }
    const handlerFor = (event: string) =>
      redis.on.mock.calls.find(([name]) => name === event)?.[1] as () => void

    handlerFor('close')()
    await expect(service.get('courses')).resolves.toBeNull()
    handlerFor('end')()
    await expect(service.get('courses')).resolves.toBeNull()
  })

  it('does not quit Redis when the cache never became ready', async () => {
    const redis = Reflect.get(service, 'client') as {
      quit: ReturnType<typeof vi.fn>
      on: ReturnType<typeof vi.fn>
    }
    const onError = redis.on.mock.calls.find(([event]) => event === 'error')?.[1] as (
      e: Error
    ) => void
    onError(new Error('lost'))
    redis.quit.mockClear()

    await service.onModuleDestroy()

    expect(redis.quit).not.toHaveBeenCalled()
  })

  it('does not throw when Redis quit fails during shutdown', async () => {
    const redis = Reflect.get(service, 'client') as { quit: ReturnType<typeof vi.fn> }
    redis.quit = vi.fn().mockRejectedValue(new Error('quit failed'))

    await expect(service.onModuleDestroy()).resolves.toBeUndefined()
  })
  it('no-ops set and del while the client is not ready', async () => {
    const redis = Reflect.get(service, 'client') as {
      setex: ReturnType<typeof vi.fn>
      scanStream: ReturnType<typeof vi.fn>
    }
    Reflect.set(service, 'isReady', false)

    await service.set('key', { a: 1 }, 60)
    await service.setSyncRun({ status: 'running' } as never)
    await service.del('key:*')
    await service.invalidateCatalog()
    expect(await service.getSyncRun()).toBeNull()

    expect(redis.setex).not.toHaveBeenCalled()
    expect(redis.scanStream).not.toHaveBeenCalled()
  })

  it('returns null when the sync run key is absent', async () => {
    const redis = Reflect.get(service, 'client') as { get: ReturnType<typeof vi.fn> }
    redis.get.mockResolvedValueOnce(null)

    expect(await service.getSyncRun()).toBeNull()
  })

  it('skips empty scan batches during pattern deletes', async () => {
    const redis = Reflect.get(service, 'client') as {
      scanStream: ReturnType<typeof vi.fn>
      pipeline: ReturnType<typeof vi.fn>
    }
    redis.pipeline.mockClear()
    redis.scanStream.mockReturnValue(
      (() => {
        const stream = new EventEmitter()
        setImmediate(() => {
          stream.emit('data', [])
          stream.emit('data', ['catalog:v1:a'])
          stream.emit('end')
        })
        return stream
      })()
    )

    await service.del('a*')

    expect(redis.pipeline).toHaveBeenCalledTimes(1)
  })
  it('deduplicates concurrent initialization calls', async () => {
    const init = Reflect.get(service, 'initializeClient') as () => Promise<void>
    const bound = init.bind(service)

    const [first, second] = await Promise.all([bound(), bound()])

    expect(first).toBe(second)
  })

  it('keeps a stored cache version and invalidation generation at boot', async () => {
    const redis = Reflect.get(service, 'client') as { get: ReturnType<typeof vi.fn> }
    redis.get.mockImplementation((key: string) =>
      Promise.resolve(key === 'catalog:version' ? '7' : key === 'catalog:generation' ? '3' : null)
    )

    await Reflect.get(service, 'initializeClient').call(service)

    expect(service.key('x')).toBe('catalog:v7:x')
    // Génération 3 déjà connue : rien à rattraper.
    await expect(service.syncInvalidations()).resolves.toBe(false)
  })

  it('does not throw when the generation bump fails', async () => {
    const redis = Reflect.get(service, 'client') as { incr: ReturnType<typeof vi.fn> }
    redis.incr.mockImplementation((key: string) =>
      key === 'catalog:generation' ? Promise.reject(new Error('down')) : Promise.resolve(1)
    )

    await expect(service.invalidatePatterns(['courses:*'])).resolves.toBeUndefined()
  })

  it('does not serve the old version to another instance after invalidation', async () => {
    const other = await buildService()

    await service.set('courses', { id: 1 })
    await expect(other.get('courses')).resolves.toEqual({ id: 1 })

    await service.invalidateCatalog()

    // `other` n'a pas été notifié : son get lit la version Redis (v1) et
    // ne doit plus voir la valeur stockée sous catalog:v0:*.
    await expect(other.get('courses')).resolves.toBeNull()
    expect(sharedStore.has('catalog:v1:courses')).toBe(false)

    await other.onModuleDestroy()
  })

  it('writes under the latest version on another instance after invalidation', async () => {
    const other = await buildService()

    await service.invalidateCatalog() // Redis: v1 — `other` ne le sait pas
    await other.set('courses', { id: 2 })

    expect(sharedStore.get('catalog:v1:courses')).toBe(JSON.stringify({ id: 2 }))
    expect(sharedStore.has('catalog:v0:courses')).toBe(false)

    await other.onModuleDestroy()
  })

  it('purges the current Redis version on invalidatePatterns from a stale instance', async () => {
    const other = await buildService()

    await service.invalidateCatalog() // v1 — `other` reste sur v0
    await other.set('courses', { id: 1 })
    expect(sharedStore.has('catalog:v1:courses')).toBe(true)

    await other.invalidatePatterns(['courses'])

    expect(sharedStore.has('catalog:v1:courses')).toBe(false)

    await other.onModuleDestroy()
  })
})
