import { Test, TestingModule } from '@nestjs/testing'
import { ConfigService } from '@nestjs/config'
import { EventEmitter } from 'node:events'
import { CacheService } from './cache.service'

vi.mock('ioredis', () => ({
  default: class MockRedis {
    private readonly store = new Map<string, string>()

    get = vi.fn((key: string) => Promise.resolve(this.store.get(key) ?? null))

    set = vi.fn((key: string, value: string | number) => {
      this.store.set(key, String(value))
      return Promise.resolve('OK')
    })

    setex = vi.fn((key: string, _ttl: number, value: string) => {
      this.store.set(key, value)
      return Promise.resolve('OK')
    })

    quit = vi.fn().mockResolvedValue(undefined)

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
            getOrThrow: () => 'redis://localhost:6379'
          }
        }
      ]
    }).compile()

    service = module.get<CacheService>(CacheService)
    await service.onModuleInit()
  })

  afterEach(async () => {
    await service.onModuleDestroy()
  })

  it('returns null for missing keys', async () => {
    const value = await service.get('formations')
    expect(value).toBeNull()
  })

  it('sets and gets JSON values', async () => {
    await service.set('formations', { id: 1 })
    const value = await service.get('formations')
    expect(value).toEqual({ id: 1 })
  })

  it('deletes a key by pattern', async () => {
    await service.set('formations', { id: 1 })
    await service.del('formations')
    const value = await service.get('formations')
    expect(value).toBeNull()
  })

  it('invalidates the catalogue and bumps the version', async () => {
    await service.set('formations', { id: 1 })
    await service.invalidateCatalog()

    const value = await service.get('formations')
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
})
