import { Test, TestingModule } from '@nestjs/testing'
import { ValidationPipe } from '@nestjs/common'
import request from 'supertest'
import type { INestApplication } from '@nestjs/common'
import { CentresController } from './centres.controller'
import { CentresService } from './centres.service'

describe('CentresController', () => {
  let app: INestApplication
  let service: {
    list: ReturnType<typeof vi.fn>
    departments: ReturnType<typeof vi.fn>
  }

  beforeEach(async () => {
    service = {
      list: vi.fn(),
      departments: vi.fn()
    }

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CentresController],
      providers: [{ provide: CentresService, useValue: service }]
    }).compile()

    app = module.createNestApplication()
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true })
    )
    await app.init()
  })

  afterEach(async () => {
    await app.close()
  })

  it('GET /centres returns the centres list', async () => {
    service.list.mockResolvedValue([{ slug: 'lyon', name: 'Centre de Lyon' }])

    await request(app.getHttpServer())
      .get('/centres')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveLength(1)
        expect(res.body[0].slug).toBe('lyon')
      })
  })

  it('GET /centres accepts department and search filters', async () => {
    service.list.mockResolvedValue([])

    await request(app.getHttpServer()).get('/centres?department=Rhône&search= lyon ').expect(200)

    expect(service.list).toHaveBeenCalledWith(
      expect.objectContaining({ department: 'Rhône', search: 'lyon' })
    )
  })

  it('GET /centres rejects unknown query params', async () => {
    await request(app.getHttpServer()).get('/centres?filter={}').expect(400)
  })

  it('GET /centres/departments returns department values', async () => {
    service.departments.mockResolvedValue(['Paris', 'Rhône'])

    await request(app.getHttpServer())
      .get('/centres/departments')
      .expect(200)
      .expect((res) => {
        expect(res.body).toEqual(['Paris', 'Rhône'])
      })
  })
})
