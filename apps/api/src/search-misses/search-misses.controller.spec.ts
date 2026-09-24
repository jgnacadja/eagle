import { Test, TestingModule } from '@nestjs/testing'
import { ValidationPipe } from '@nestjs/common'
import request from 'supertest'
import type { INestApplication } from '@nestjs/common'
import { AdminApiKeyGuard } from '../common/guards/admin-api-key.guard'
import { SearchMissesController } from './search-misses.controller'
import { SearchMissesService } from './search-misses.service'

const mockGuard = { canActivate: () => true }

describe('SearchMissesController', () => {
  let app: INestApplication
  let service: {
    list: ReturnType<typeof vi.fn>
    aggregate: ReturnType<typeof vi.fn>
    exportCsv: ReturnType<typeof vi.fn>
    purgeExpired: ReturnType<typeof vi.fn>
  }

  beforeEach(async () => {
    service = {
      list: vi.fn().mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 50 }),
      aggregate: vi.fn().mockResolvedValue([]),
      exportCsv: vi.fn().mockResolvedValue('﻿requete_normalisee\r\n'),
      purgeExpired: vi.fn().mockResolvedValue({ deleted: 3, cutoff: '2026-03-29T00:00:00.000Z' })
    }

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SearchMissesController],
      providers: [{ provide: SearchMissesService, useValue: service }]
    })
      .overrideGuard(AdminApiKeyGuard)
      .useValue(mockGuard)
      .compile()

    app = module.createNestApplication()
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true })
    )
    await app.init()
  })

  afterEach(async () => {
    await app.close()
  })

  it('GET /admin/search-misses returns the page with transformed filters', async () => {
    await request(app.getHttpServer())
      .get('/admin/search-misses?from=2026-09-01&outcome=no_result&page=2&limit=10')
      .expect(200)
      .expect((res) => {
        expect(res.body.total).toBe(0)
      })

    expect(service.list).toHaveBeenCalledWith(
      expect.objectContaining({ from: '2026-09-01', outcome: 'no_result', page: 2, limit: 10 })
    )
  })

  it('GET /admin/search-misses applies default pagination', async () => {
    await request(app.getHttpServer()).get('/admin/search-misses').expect(200)

    expect(service.list).toHaveBeenCalledWith(expect.objectContaining({ page: 1, limit: 50 }))
  })

  it('GET /admin/search-misses rejects invalid dates, outcomes and limits', async () => {
    const server = app.getHttpServer()

    await request(server).get('/admin/search-misses?from=2026/09/01').expect(400)
    await request(server).get('/admin/search-misses?to=2026-02-30').expect(400)
    await request(server).get('/admin/search-misses?outcome=unknown').expect(400)
    await request(server).get('/admin/search-misses?limit=500').expect(400)
    await request(server).get('/admin/search-misses?unknown=1').expect(400)
    expect(service.list).not.toHaveBeenCalled()
  })

  it('GET /admin/search-misses/aggregate returns the grouped view', async () => {
    service.aggregate.mockResolvedValue([{ queryNormalized: 'drone', occurrences: 2 }])

    await request(app.getHttpServer())
      .get('/admin/search-misses/aggregate?from=2026-09-01&to=2026-09-25')
      .expect(200)
      .expect((res) => {
        expect(res.body).toEqual([{ queryNormalized: 'drone', occurrences: 2 }])
      })

    expect(service.aggregate).toHaveBeenCalledWith(
      expect.objectContaining({ from: '2026-09-01', to: '2026-09-25' })
    )
  })

  it('GET /admin/search-misses/export streams a CSV attachment', async () => {
    await request(app.getHttpServer())
      .get('/admin/search-misses/export')
      .expect(200)
      .expect('Content-Type', /text\/csv; charset=utf-8/)
      .expect('Content-Disposition', 'attachment; filename="recherches-sans-resultat.csv"')
      .expect((res) => {
        expect(res.text.startsWith('﻿requete_normalisee')).toBe(true)
      })
  })

  it('POST /admin/search-misses/purge returns the purge result', async () => {
    await request(app.getHttpServer())
      .post('/admin/search-misses/purge')
      .expect(201)
      .expect((res) => {
        expect(res.body).toEqual({ deleted: 3, cutoff: '2026-03-29T00:00:00.000Z' })
      })
  })
})
