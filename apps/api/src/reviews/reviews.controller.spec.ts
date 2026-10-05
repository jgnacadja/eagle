import { Test, TestingModule } from '@nestjs/testing'
import request from 'supertest'
import type { INestApplication } from '@nestjs/common'
import { ReviewsModule } from './reviews.module'
import { ReviewsService } from './reviews.service'
import { AdminApiKeyGuard } from '../common/guards/admin-api-key.guard'
import { ConfigService } from '@nestjs/config'
import { CacheService } from '../common/cache/cache.service'
import { DirectusCatalogService } from '../directus/directus.catalog.service'

const mockGuard = { canActivate: () => true }

describe('ReviewsController', () => {
  let app: INestApplication

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ReviewsModule]
    })
      .overrideProvider(ReviewsService)
      .useValue({
        trigger: vi.fn().mockResolvedValue(true),
        getLatestRun: vi.fn().mockResolvedValue({ status: 'success' })
      })
      .overrideProvider(ConfigService)
      .useValue({ get: () => 'test', getOrThrow: () => 'test' })
      .overrideProvider(CacheService)
      .useValue({})
      .overrideProvider(DirectusCatalogService)
      .useValue({})
      .overrideGuard(AdminApiKeyGuard)
      .useValue(mockGuard)
      .compile()

    app = module.createNestApplication()
    await app.init()
  })

  afterEach(async () => {
    await app.close()
  })

  it('POST /admin/sync-reviews accepts and returns immediately (202)', async () => {
    await request(app.getHttpServer())
      .post('/admin/sync-reviews')
      .expect(202)
      .expect({ started: true })
  })

  it('POST /admin/sync-reviews reports a run already in progress', async () => {
    const reviews = app.get(ReviewsService)
    vi.mocked(reviews.trigger).mockResolvedValueOnce(false)

    await request(app.getHttpServer())
      .post('/admin/sync-reviews')
      .expect(202)
      .expect({ started: false })
  })

  it('GET /admin/sync-reviews/status returns latest run', async () => {
    await request(app.getHttpServer())
      .get('/admin/sync-reviews/status')
      .expect(200)
      .expect((res) => {
        expect(res.body.latest.status).toBe('success')
      })
  })
})
