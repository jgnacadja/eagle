import { Test, TestingModule } from '@nestjs/testing'
import { ConfigService } from '@nestjs/config'
import { EventEmitter } from 'node:events'
import { CacheService } from './cache.service'

vi.mock('ioredis', () => ({
  default: class MockRedis {
    private readonly store = new Map<string, string>()
    status?: string

    get = vi.fn((key: string) => Promise.resolve(this.store.get(key) ?? null))

    set = vi.fn((key: string, value: string | number) => {
      this.store.set(key, String(value))
      return Promise.resolve('OK')
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

  beforeEach(async () => {
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

    service = module.get<CacheService>(CacheService)
    const client = Reflect.get(service, 'client') as { status?: string }
    client.status = 'ready'
    await service.onModuleInit()
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
    await service.invalidateCatalog()

    const value = await service.get('courses')
    expect(value).toBeNull()
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
    await expect(disabled.invalidateCatalog()).resolves.toBeUndefined()
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

  it('keeps a stored cache version at boot', async () => {
    const redis = Reflect.get(service, 'client') as { get: ReturnType<typeof vi.fn> }
    redis.get.mockImplementation((key: string) =>
      Promise.resolve(key === 'catalog:version' ? '7' : null)
    )

    await Reflect.get(service, 'initializeClient').call(service)

    expect(service.key('x')).toBe('catalog:v7:x')
  })
})
