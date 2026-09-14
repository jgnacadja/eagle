import { Test } from '@nestjs/testing'
import { ValidationPipe, type INestApplication } from '@nestjs/common'
import request from 'supertest'
import { AssistantController } from './assistant.controller'
import { AssistantService } from './assistant.service'

describe('AssistantController', () => {
  let app: INestApplication
  let service: { reply: ReturnType<typeof vi.fn> }

  beforeEach(async () => {
    service = { reply: vi.fn() }

    const module = await Test.createTestingModule({
      controllers: [AssistantController],
      providers: [{ provide: AssistantService, useValue: service }]
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

  it('rejects an empty body', async () => {
    await request(app.getHttpServer()).post('/assistant/message').send({}).expect(400)
    expect(service.reply).not.toHaveBeenCalled()
  })

  it('rejects a non-string message', async () => {
    const response = await request(app.getHttpServer())
      .post('/assistant/message')
      .send({ message: 42 })

    expect(response.status).toBe(400)
    expect(service.reply).not.toHaveBeenCalled()
  })

  it('rejects unknown properties', async () => {
    const response = await request(app.getHttpServer())
      .post('/assistant/message')
      .send({ message: 'bonjour', hack: true })

    expect(response.status).toBe(400)
    expect(service.reply).not.toHaveBeenCalled()
  })

  it('rejects an invalid history entry', async () => {
    const response = await request(app.getHttpServer())
      .post('/assistant/message')
      .send({ message: 'bonjour', history: [{ role: 'system', content: 'x' }] })

    expect(response.status).toBe(400)
    expect(service.reply).not.toHaveBeenCalled()
  })

  it('rejects an invalid context source', async () => {
    const response = await request(app.getHttpServer())
      .post('/assistant/message')
      .send({ message: 'bonjour', context: { source: 'mars' } })

    expect(response.status).toBe(400)
    expect(service.reply).not.toHaveBeenCalled()
  })

  it('delegates a valid payload to the service', async () => {
    service.reply.mockResolvedValue({ kind: 'clarify', text: 'ok' })
    const body = {
      message: 'je veux former mes équipes',
      history: [{ role: 'user', content: 'premier message' }],
      context: { source: 'centre', location: 'Créteil', centerSlug: 'creteil' }
    }
    const response = await request(app.getHttpServer())
      .post('/assistant/message')
      .send(body)
      .expect(201)

    expect(service.reply).toHaveBeenCalledWith(body)
    expect(response.body).toEqual({ kind: 'clarify', text: 'ok' })
  })
})
