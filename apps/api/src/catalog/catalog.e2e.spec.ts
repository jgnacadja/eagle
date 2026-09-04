import { Test, TestingModule } from '@nestjs/testing'
import { APP_GUARD } from '@nestjs/core'
import { ThrottlerGuard, ThrottlerModule, ThrottlerStorage } from '@nestjs/throttler'
import request from 'supertest'
import type { INestApplication } from '@nestjs/common'
import { CatalogController } from './catalog.controller'
import { CatalogService } from './catalog.service'
import { HttpExceptionFilter } from '../common/filters/http-exception.filter'

class InMemoryThrottlerStorage implements ThrottlerStorage {
  private readonly hits = new Map<string, number>()

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string
  ): Promise<{
    totalHits: number
    timeToExpire: number
    isBlocked: boolean
    timeToBlockExpire: number
  }> {
    const fullKey = `${key}:${throttlerName}`
    const totalHits = (this.hits.get(fullKey) ?? 0) + 1
    this.hits.set(fullKey, totalHits)

    const isBlocked = totalHits > limit
    const timeToExpire = Math.ceil(ttl / 1000)
    const timeToBlockExpire = isBlocked ? Math.ceil(blockDuration / 1000) : 0

    return { totalHits, timeToExpire, isBlocked, timeToBlockExpire }
  }
}

describe('Catalog rate limiting (e2e)', () => {
  let app: INestApplication

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot({
          throttlers: [{ ttl: 60_000, limit: 2 }],
          storage: new InMemoryThrottlerStorage()
        })
      ],
      controllers: [CatalogController],
      providers: [
        { provide: APP_GUARD, useClass: ThrottlerGuard },
        {
          provide: CatalogService,
          useValue: {
            list: vi.fn().mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 20 })
          }
        }
      ]
    }).compile()

    app = module.createNestApplication()
    app.useGlobalFilters(new HttpExceptionFilter())
    await app.init()
  })

  afterEach(async () => {
    await app.close()
  })

  it('returns 429 with a Retry-After header after the limit is exceeded', async () => {
    await request(app.getHttpServer()).get('/courses').expect(200)
    await request(app.getHttpServer()).get('/courses').expect(200)

    const response = await request(app.getHttpServer()).get('/courses').expect(429)
    expect(response.headers['retry-after']).toBeDefined()
    expect(Number(response.headers['retry-after'])).toBeGreaterThan(0)
  })
})
