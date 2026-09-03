import { Test, TestingModule } from '@nestjs/testing'
import { ValidationPipe } from '@nestjs/common'
import request from 'supertest'
import type { INestApplication } from '@nestjs/common'
import { CatalogController } from './catalog.controller'
import { CatalogService } from './catalog.service'

describe('CatalogController', () => {
  let app: INestApplication
  let service: { list: ReturnType<typeof vi.fn>; findBySlug: ReturnType<typeof vi.fn> }

  beforeEach(async () => {
    service = {
      list: vi.fn(),
      findBySlug: vi.fn()
    }

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CatalogController],
      providers: [{ provide: CatalogService, useValue: service }]
    }).compile()

    app = module.createNestApplication()
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }))
    await app.init()
  })

  afterEach(async () => {
    await app.close()
  })

  it('GET /courses returns the course list', async () => {
    service.list.mockResolvedValue({
      items: [{ id: 1, slug: 'pilotage', title: 'Pilotage' }],
      total: 1,
      page: 1,
      pageSize: 20
    })

    await request(app.getHttpServer())
      .get('/courses')
      .expect(200)
      .expect((res) => {
        expect(res.body.items).toHaveLength(1)
        expect(res.body.total).toBe(1)
      })
  })

  it('GET /courses rejects invalid pagination', async () => {
    await request(app.getHttpServer()).get('/courses?page=0').expect(400)
  })

  it('GET /courses/:family/:slug returns a course', async () => {
    service.findBySlug.mockResolvedValue({ id: 1, slug: 'pilotage', title: 'Pilotage' })

    await request(app.getHttpServer())
      .get('/courses/management/pilotage')
      .expect(200)
      .expect((res) => {
        expect(res.body.slug).toBe('pilotage')
      })
  })

  it('GET /courses/:family/:slug returns 404 when not found', async () => {
    service.findBySlug.mockResolvedValue(null)

    await request(app.getHttpServer()).get('/courses/management/inexistant').expect(404)
  })
})
