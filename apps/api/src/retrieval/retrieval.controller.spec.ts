import { Test, TestingModule } from '@nestjs/testing'
import { ValidationPipe } from '@nestjs/common'
import request from 'supertest'
import type { INestApplication } from '@nestjs/common'
import { AdminApiKeyGuard } from '../common/guards/admin-api-key.guard'
import { CatalogIndexService } from './catalog-index.service'
import { RetrievalController } from './retrieval.controller'
import { RetrievalService } from './retrieval.service'

const mockGuard = { canActivate: () => true }

describe('RetrievalController', () => {
  let app: INestApplication
  let retrieval: { search: ReturnType<typeof vi.fn> }
  let catalogIndex: {
    getIndex: ReturnType<typeof vi.fn>
    rebuild: ReturnType<typeof vi.fn>
    info: { version: number; documents: number }
  }

  beforeEach(async () => {
    retrieval = { search: vi.fn().mockResolvedValue({ query: 'x', terms: [], candidates: [] }) }
    catalogIndex = {
      getIndex: vi.fn().mockResolvedValue({}),
      rebuild: vi.fn().mockResolvedValue({ info: { version: 2, documents: 8 } }),
      info: { version: 1, documents: 8 }
    }

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RetrievalController],
      providers: [
        { provide: RetrievalService, useValue: retrieval },
        { provide: CatalogIndexService, useValue: catalogIndex }
      ]
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

  it('GET /admin/retrieval/status ensures the index is built and returns its info', async () => {
    await request(app.getHttpServer())
      .get('/admin/retrieval/status')
      .expect(200)
      .expect((res) => expect(res.body).toEqual({ version: 1, documents: 8 }))

    expect(catalogIndex.getIndex).toHaveBeenCalledOnce()
  })

  it('POST /admin/retrieval/reindex rebuilds the index', async () => {
    await request(app.getHttpServer())
      .post('/admin/retrieval/reindex')
      .expect(201)
      .expect((res) => expect(res.body).toEqual({ version: 2, documents: 8 }))

    expect(catalogIndex.rebuild).toHaveBeenCalledOnce()
  })

  it('GET /admin/retrieval/search maps the query, filters and limit', async () => {
    await request(app.getHttpServer())
      .get(
        '/admin/retrieval/search?q=%20former%20des%20managers%20&limit=3&family=management&modalities=inter,%20distanciel&location=Lyon'
      )
      .expect(200)

    expect(retrieval.search).toHaveBeenCalledWith({
      text: 'former des managers',
      limit: 3,
      family: 'management',
      modalities: ['inter', 'distanciel'],
      location: 'Lyon'
    })
  })

  it('GET /admin/retrieval/search applies defaults and rejects invalid input', async () => {
    const server = app.getHttpServer()

    await request(server).get('/admin/retrieval/search?q=sst').expect(200)
    expect(retrieval.search).toHaveBeenCalledWith({
      text: 'sst',
      limit: 5,
      family: undefined,
      modalities: undefined,
      location: undefined
    })

    await request(server).get('/admin/retrieval/search').expect(400)
    await request(server).get('/admin/retrieval/search?q=%20%20').expect(400)
    await request(server).get('/admin/retrieval/search?q=sst&limit=50').expect(400)
    await request(server).get('/admin/retrieval/search?q=sst&unknown=1').expect(400)
  })
})
