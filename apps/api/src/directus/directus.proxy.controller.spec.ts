import type { INestApplication } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { DirectusProxyController } from './directus.proxy.controller'

const configValues: Record<string, string> = {
  DIRECTUS_INTERNAL_URL: 'http://directus:8055'
}

const fetchMock = vi.fn()

function upstreamJson(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' }
  })
}

describe('DirectusProxyController', () => {
  let app: INestApplication

  beforeAll(async () => {
    vi.stubGlobal('fetch', fetchMock)

    const moduleRef = await Test.createTestingModule({
      imports: [],
      controllers: [DirectusProxyController],
      providers: [{ provide: ConfigService, useValue: { get: (key: string) => configValues[key] } }]
    }).compile()

    app = moduleRef.createNestApplication()
    await app.init()
  })

  beforeEach(() => {
    fetchMock.mockReset()
  })

  afterAll(async () => {
    await app.close()
    vi.unstubAllGlobals()
  })

  it('transfère GET /items/* sans token (rôle Public Directus) et avec la query', async () => {
    fetchMock.mockResolvedValueOnce(upstreamJson({ data: [{ slug: 'centre-creteil' }] }))

    const res = await request(app.getHttpServer()).get('/directus/items/centres?fields[]=slug')

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ data: [{ slug: 'centre-creteil' }] })
    expect(fetchMock).toHaveBeenCalledWith(
      'http://directus:8055/items/centres?fields%5B%5D=slug',
      expect.objectContaining({
        method: 'GET',
        headers: expect.not.objectContaining({ Authorization: expect.anything() })
      })
    )
  })

  it('transfère le statut upstream (403 Directus → 403 proxy)', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ errors: [] }), {
        status: 403,
        headers: { 'content-type': 'application/json' }
      })
    )

    const res = await request(app.getHttpServer()).get('/directus/items/centres')

    expect(res.status).toBe(403)
  })

  it('autorise la collection des articles', async () => {
    fetchMock.mockResolvedValueOnce(upstreamJson({ data: [{ slug: 'actualite-test' }] }))

    const res = await request(app.getHttpServer()).get('/directus/items/articles?limit=50')

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ data: [{ slug: 'actualite-test' }] })
    expect(fetchMock).toHaveBeenCalledWith(
      'http://directus:8055/items/articles?limit=50',
      expect.objectContaining({ method: 'GET' })
    )
  })

  it('refuse limit=-1 et les limites non positives', async () => {
    const res = await request(app.getHttpServer()).get('/directus/items/centres?limit=-1')

    expect(res.status).toBe(400)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('plafonne limit au-delà de 100', async () => {
    fetchMock.mockResolvedValueOnce(upstreamJson({ data: [] }))

    const res = await request(app.getHttpServer()).get('/directus/items/centres?limit=500')

    expect(res.status).toBe(200)
    expect(fetchMock).toHaveBeenCalledWith(
      'http://directus:8055/items/centres?limit=100',
      expect.objectContaining({ method: 'GET' })
    )
  })

  it('refuse les paramètres hors liste blanche (deep, search, meta…)', async () => {
    const res = await request(app.getHttpServer()).get(
      '/directus/items/formations?deep[sessions][_limit]=-1'
    )

    expect(res.status).toBe(400)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('refuse les expansions wildcard de fields', async () => {
    const res = await request(app.getHttpServer()).get('/directus/items/formations?fields[]=*.*.*')

    expect(res.status).toBe(400)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('relaye filter/sort/page/fields imbriqués (query SDK standard)', async () => {
    fetchMock.mockResolvedValueOnce(upstreamJson({ data: [] }))

    const res = await request(app.getHttpServer()).get(
      '/directus/items/formations?filter[status][_eq]=published&sort=-updated_at&page=2&fields[]=famille.slug&limit=20'
    )

    expect(res.status).toBe(200)
    expect(fetchMock).toHaveBeenCalledWith(
      'http://directus:8055/items/formations?filter%5Bstatus%5D%5B_eq%5D=published&sort=-updated_at&page=2&fields%5B%5D=famille.slug&limit=20',
      expect.objectContaining({ method: 'GET' })
    )
  })

  it('refuse les méthodes non-GET', async () => {
    const res = await request(app.getHttpServer())
      .post('/directus/items/centres')
      .send({ slug: 'x' })

    expect(res.status).toBe(405)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('refuse les chemins hors items/ et assets/', async () => {
    const res = await request(app.getHttpServer()).get('/directus/server/ping')

    expect(res.status).toBe(404)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('refuse les traversées de chemin ..', async () => {
    const res = await request(app.getHttpServer()).get('/directus/items/../admin/users')

    expect(res.status).toBe(404)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('refuse les traversées de chemin encodées', async () => {
    const res = await request(app.getHttpServer()).get('/directus/items/%2E%2E/admin/users')

    expect(res.status).toBe(404)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('refuse les URLs absolues ou protocol-relative', async () => {
    const res = await request(app.getHttpServer()).get('/directus//other.com/items/centres')

    expect(res.status).toBe(404)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('répond 502 si Directus est injoignable', async () => {
    fetchMock.mockRejectedValueOnce(new Error('ECONNREFUSED'))

    const res = await request(app.getHttpServer()).get('/directus/assets/abc')

    expect(res.status).toBe(502)
  })

  it('répond 503 si le proxy n’est pas configuré', async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [DirectusProxyController],
      providers: [{ provide: ConfigService, useValue: { get: () => undefined } }]
    }).compile()

    const unconfigured = moduleRef.createNestApplication()
    await unconfigured.init()
    try {
      const res = await request(unconfigured.getHttpServer()).get('/directus/items/centres')
      expect(res.status).toBe(503)
    } finally {
      await unconfigured.close()
    }
  })
})
