import { Test, TestingModule } from '@nestjs/testing'
import request from 'supertest'
import { ConflictException, NotFoundException, ValidationPipe } from '@nestjs/common'
import type { INestApplication } from '@nestjs/common'
import { SyncModule } from './sync.module'
import { SyncService } from './sync.service'
import { AdminApiKeyGuard } from '../common/guards/admin-api-key.guard'
import { ConfigService } from '@nestjs/config'
import { DigiformaClientFactory } from '../digiforma/digiforma-client.factory'
import { SourcesService } from '../sources/sources.service'
import { CacheService } from '../common/cache/cache.service'
import { DirectusCatalogService } from '../directus/directus.catalog.service'

const mockGuard = { canActivate: () => true }

describe('SyncController', () => {
  let app: INestApplication

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [SyncModule]
    })
      .overrideProvider(SyncService)
      .useValue({
        trigger: vi.fn().mockResolvedValue({
          started: true,
          runs: [{ source: 'hq', status: 'accepted' }]
        }),
        getLatestRun: vi.fn().mockResolvedValue({ status: 'success' }),
        getRunsBySource: vi.fn().mockResolvedValue({ hq: { status: 'success' }, lyon: null })
      })
      .overrideProvider(ConfigService)
      .useValue({ get: () => 'test', getOrThrow: () => 'test' })
      .overrideProvider(DigiformaClientFactory)
      .useValue({})
      .overrideProvider(SourcesService)
      .useValue({})
      .overrideProvider(CacheService)
      .useValue({})
      .overrideProvider(DirectusCatalogService)
      .useValue({})
      .overrideGuard(AdminApiKeyGuard)
      .useValue(mockGuard)
      .compile()

    app = module.createNestApplication()
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })
    )
    await app.init()
  })

  afterEach(async () => {
    await app.close()
  })

  it('POST /admin/sync accepts and returns immediately (202)', async () => {
    await request(app.getHttpServer())
      .post('/admin/sync')
      .expect(202)
      .expect({ started: true, runs: [{ source: 'hq', status: 'accepted' }] })
    expect(app.get(SyncService).trigger).toHaveBeenCalledWith({ sourceCode: undefined })
  })

  it('POST /admin/sync reports a run already in progress', async () => {
    const sync = app.get(SyncService)
    vi.mocked(sync.trigger).mockResolvedValueOnce({ started: false, runs: [] })

    await request(app.getHttpServer())
      .post('/admin/sync')
      .expect(202)
      .expect({ started: false, runs: [] })
  })

  it('POST /admin/sync?source=lyon targets a single source', async () => {
    const sync = app.get(SyncService)
    vi.mocked(sync.trigger).mockResolvedValueOnce({
      started: true,
      runs: [{ source: 'lyon', status: 'accepted' }]
    })

    await request(app.getHttpServer())
      .post('/admin/sync?source=lyon')
      .expect(202)
      .expect({ started: true, runs: [{ source: 'lyon', status: 'accepted' }] })
    expect(sync.trigger).toHaveBeenCalledWith({ sourceCode: 'lyon' })
  })

  it('POST /admin/sync?source=nope answers 404 for an unknown source', async () => {
    const sync = app.get(SyncService)
    vi.mocked(sync.trigger).mockRejectedValueOnce(new NotFoundException('Unknown source'))

    await request(app.getHttpServer()).post('/admin/sync?source=nope').expect(404)
  })

  it('POST /admin/sync?source=lyon answers 409 when the source is locked', async () => {
    const sync = app.get(SyncService)
    vi.mocked(sync.trigger).mockRejectedValueOnce(new ConflictException('locked'))

    await request(app.getHttpServer()).post('/admin/sync?source=lyon').expect(409)
  })

  it('POST /admin/sync rejects a malformed source code (400)', async () => {
    const sync = app.get(SyncService)
    await request(app.getHttpServer()).post('/admin/sync?source=Bad%20Code').expect(400)
    await request(app.getHttpServer()).post('/admin/sync?other=1').expect(400)
    expect(sync.trigger).not.toHaveBeenCalled()
  })

  it('GET /admin/sync/status returns the latest run and the run of each source', async () => {
    await request(app.getHttpServer())
      .get('/admin/sync/status')
      .expect(200)
      .expect((res) => {
        expect(res.body.latest.status).toBe('success')
        expect(res.body.runs).toEqual({ hq: { status: 'success' }, lyon: null })
      })
  })
})
