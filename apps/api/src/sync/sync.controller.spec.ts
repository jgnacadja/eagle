import { Test, TestingModule } from '@nestjs/testing'
import request from 'supertest'
import type { INestApplication } from '@nestjs/common'
import { SyncModule } from './sync.module'
import { SyncService } from './sync.service'
import { AdminApiKeyGuard } from '../common/guards/admin-api-key.guard'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../prisma/prisma.service'
import { DigiformaClient } from '../digiforma/digiforma.client'
import { CacheService } from '../common/cache/cache.service'

const mockGuard = { canActivate: () => true }

describe('SyncController', () => {
  let app: INestApplication

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [SyncModule]
    })
      .overrideProvider(SyncService)
      .useValue({
        run: vi.fn().mockResolvedValue(undefined),
        getLatestRun: vi.fn().mockResolvedValue({ id: 1, status: 'success' })
      })
      .overrideProvider(ConfigService)
      .useValue({ get: () => 'test', getOrThrow: () => 'test' })
      .overrideProvider(PrismaService)
      .useValue({ $connect: vi.fn() })
      .overrideProvider(DigiformaClient)
      .useValue({})
      .overrideProvider(CacheService)
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

  it('POST /admin/sync triggers sync', async () => {
    await request(app.getHttpServer()).post('/admin/sync').expect(201).expect({ success: true })
  })

  it('GET /admin/sync/status returns latest run', async () => {
    await request(app.getHttpServer())
      .get('/admin/sync/status')
      .expect(200)
      .expect((res) => {
        expect(res.body.latest.status).toBe('success')
      })
  })
})
