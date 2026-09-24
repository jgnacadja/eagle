import { Test, TestingModule } from '@nestjs/testing'
import { ValidationPipe } from '@nestjs/common'
import request from 'supertest'
import type { INestApplication } from '@nestjs/common'
import { AssistantController } from './assistant.controller'
import { FallbackRecommendationService } from './fallback/fallback-recommendation.service'

describe('AssistantController', () => {
  let app: INestApplication
  let fallback: { recommend: ReturnType<typeof vi.fn> }

  beforeEach(async () => {
    fallback = {
      recommend: vi.fn().mockResolvedValue({
        outcome: { kind: 'no-result' },
        mode: 'fallback',
        notice: 'n',
        intent: null
      })
    }

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssistantController],
      providers: [{ provide: FallbackRecommendationService, useValue: fallback }]
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

  it('GET /assistant/fallback answers deterministically with the trimmed query and location', async () => {
    await request(app.getHttpServer())
      .get('/assistant/fallback?q=%20former%20des%20managers%20&location=Lyon')
      .expect(200)
      .expect((res) => expect(res.body.mode).toBe('fallback'))

    expect(fallback.recommend).toHaveBeenCalledWith({
      text: 'former des managers',
      location: 'Lyon'
    })
  })

  it('GET /assistant/fallback validates the query', async () => {
    const server = app.getHttpServer()

    await request(server).get('/assistant/fallback').expect(400)
    await request(server).get('/assistant/fallback?q=a').expect(400)
    await request(server).get('/assistant/fallback?q=sst&extra=1').expect(400)
    await request(server)
      .get(`/assistant/fallback?q=${'a'.repeat(501)}`)
      .expect(400)
    expect(fallback.recommend).not.toHaveBeenCalled()
  })
})
