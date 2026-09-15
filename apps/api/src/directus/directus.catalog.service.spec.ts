import { Test, TestingModule } from '@nestjs/testing'
import { ConfigService } from '@nestjs/config'
import { DirectusCatalogService } from './directus.catalog.service'
import type { FormationDirectusPayload } from '../digiforma/digiforma.mapper'

const samplePayloads: FormationDirectusPayload[] = [
  {
    digiforma_id: 'prog-001',
    slug: 'pilotage',
    title: 'Pilotage',
    description: null,
    duration_days: 3,
    duration_hours: 21,
    price: 1500,
    cpf: true,
    cpf_code: null,
    certification: null,
    certifier_name: null,
    category_name: 'Management',
    center_slug: null,
    center_slugs: [],
    modalities: [],
    sessions: null,
    locations_text: null,
    blocks: null,
    image_url: null,
    generated_program_url: null,
    status: 'published',
    seo_title: 'Pilotage',
    seo_description: null,
    seo_canonical: null,
    raw: {}
  },
  {
    digiforma_id: 'prog-002',
    slug: 'securite',
    title: 'Sécurité',
    description: null,
    duration_days: null,
    duration_hours: null,
    price: null,
    cpf: false,
    cpf_code: null,
    certification: null,
    certifier_name: null,
    category_name: null,
    center_slug: null,
    center_slugs: [],
    modalities: [],
    sessions: null,
    locations_text: null,
    blocks: null,
    image_url: null,
    generated_program_url: null,
    status: 'published',
    seo_title: 'Sécurité',
    seo_description: null,
    seo_canonical: null,
    raw: {}
  }
]

describe('DirectusCatalogService', () => {
  let service: DirectusCatalogService
  let fetch: ReturnType<typeof vi.fn>

  beforeEach(async () => {
    fetch = vi.fn()
    global.fetch = fetch

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DirectusCatalogService,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => (key === 'DIRECTUS_TOKEN' ? 'token' : 'http://directus:8055')
          }
        }
      ]
    }).compile()

    service = module.get<DirectusCatalogService>(DirectusCatalogService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  it('creates new formations and patches existing ones', async () => {
    fetch
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ data: [{ id: 1, digiforma_id: 'prog-002' }] }), {
          status: 200
        })
      )
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: [] }), { status: 200 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))

    await service.upsertMany(samplePayloads)

    const createCall = fetch.mock.calls.find((call) => call[1]?.method === 'POST')
    expect(createCall).toBeDefined()
    if (!createCall) throw new Error('POST call not found')
    expect(createCall[0]).toBe('http://directus:8055/items/formations')
    expect(JSON.parse(createCall[1].body)).toHaveLength(1)

    const patchCall = fetch.mock.calls.find((call) => call[1]?.method === 'PATCH')
    expect(patchCall).toBeDefined()
    if (!patchCall) throw new Error('PATCH call not found')
    expect(patchCall[0]).toBe('http://directus:8055/items/formations/1')
  })

  it('does not overwrite editorial pedagogy/evaluation on update', async () => {
    fetch
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: [
              {
                id: 1,
                digiforma_id: 'prog-002',
                pedagogy: [{ title: 'Contenu éditorial' }],
                evaluation: ['Épreuve éditée']
              }
            ]
          }),
          { status: 200 }
        )
      )
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: [] }), { status: 200 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))

    await service.upsertMany([
      {
        ...samplePayloads[1],
        pedagogy: [{ title: 'Proposition sync', description: null }],
        evaluation: ['Proposition sync']
      }
    ])

    const patchCall = fetch.mock.calls.find((call) => call[1]?.method === 'PATCH')
    expect(patchCall).toBeDefined()
    if (!patchCall) throw new Error('PATCH call not found')
    const body = JSON.parse(patchCall[1].body)
    expect(body).not.toHaveProperty('pedagogy')
    expect(body).not.toHaveProperty('evaluation')
  })

  it('proposes pedagogy/evaluation when the fields are empty', async () => {
    fetch
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: [{ id: 1, digiforma_id: 'prog-002', pedagogy: null, evaluation: [] }]
          }),
          { status: 200 }
        )
      )
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: [] }), { status: 200 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))

    await service.upsertMany([
      {
        ...samplePayloads[1],
        pedagogy: [{ title: 'Proposition sync', description: null }],
        evaluation: ['Proposition sync']
      }
    ])

    const patchCall = fetch.mock.calls.find((call) => call[1]?.method === 'PATCH')
    expect(patchCall).toBeDefined()
    if (!patchCall) throw new Error('PATCH call not found')
    const body = JSON.parse(patchCall[1].body)
    expect(body.pedagogy).toEqual([{ title: 'Proposition sync', description: null }])
    expect(body.evaluation).toEqual(['Proposition sync'])
  })

  it('never overwrites populated content fields but always syncs sessions/raw', async () => {
    fetch
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: [
              {
                id: 1,
                digiforma_id: 'prog-002',
                title: 'Titre éditorial',
                description: '<p>Description éditée</p>',
                price: 990,
                modalities: ['presentiel'],
                sessions: [{ id: 'old' }],
                raw: { v: 1 }
              }
            ]
          }),
          { status: 200 }
        )
      )
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: [] }), { status: 200 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))

    await service.upsertMany([
      {
        ...samplePayloads[1],
        sessions: [{ id: 'new' }],
        raw: { v: 2 }
      }
    ])

    const patchCall = fetch.mock.calls.find((call) => call[1]?.method === 'PATCH')
    expect(patchCall).toBeDefined()
    if (!patchCall) throw new Error('PATCH call not found')
    const body = JSON.parse(patchCall[1].body)
    expect(body).not.toHaveProperty('title')
    expect(body).not.toHaveProperty('description')
    expect(body).not.toHaveProperty('price')
    expect(body).not.toHaveProperty('modalities')
    expect(body.sessions).toEqual([{ id: 'new' }])
    expect(body.raw).toEqual({ v: 2 })
  })

  it('strips image_url from the write payload', async () => {
    fetch
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ data: [{ id: 1, digiforma_id: 'prog-002', image: null }] }), {
          status: 200
        })
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValue(new Response('fail', { status: 500 }))

    await service.upsertMany([{ ...samplePayloads[1], image_url: 'https://cdn.example/v.jpg' }])

    const patchCall = fetch.mock.calls.find(
      (call) => call[1]?.method === 'PATCH' && call[0] === 'http://directus:8055/items/formations/1'
    )
    expect(patchCall).toBeDefined()
    if (!patchCall) throw new Error('PATCH call not found')
    expect(JSON.parse(patchCall[1].body)).not.toHaveProperty('image_url')
  })

  it('imports the Digiforma image into the file library when image is empty', async () => {
    fetch
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ data: [{ id: 1, digiforma_id: 'prog-002', image: null }] }), {
          status: 200
        })
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ data: { id: 'file-uuid-1' } }), { status: 200 })
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }))

    await service.upsertMany([
      { ...samplePayloads[1], image_url: 'https://cdn.example/visuel.jpg' }
    ])

    const importCall = fetch.mock.calls.find(
      (call) => call[0] === 'http://directus:8055/files/import'
    )
    expect(importCall).toBeDefined()
    if (!importCall) throw new Error('files/import call not found')
    const importBody = JSON.parse(importCall[1].body)
    expect(importBody.url).toBe('https://cdn.example/visuel.jpg')
    expect(importBody.data.description).toBe('digiforma-sync:https://cdn.example/visuel.jpg')

    const linkCall = fetch.mock.calls.find(
      (call) => call[1]?.method === 'PATCH' && JSON.parse(call[1].body).image === 'file-uuid-1'
    )
    expect(linkCall).toBeDefined()
  })

  it('never replaces an image set by an editor', async () => {
    fetch
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: [
              {
                id: 1,
                digiforma_id: 'prog-002',
                image: { id: 'file-editor', description: 'Visuel choisi à la main' }
              }
            ]
          }),
          { status: 200 }
        )
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }))

    await service.upsertMany([
      { ...samplePayloads[1], image_url: 'https://cdn.example/nouveau.jpg' }
    ])

    expect(fetch.mock.calls.some((call) => call[0] === 'http://directus:8055/files/import')).toBe(
      false
    )
    expect(
      fetch.mock.calls.some(
        (call) => call[1]?.method === 'PATCH' && JSON.parse(call[1].body).image !== undefined
      )
    ).toBe(false)
  })

  it('re-imports when the source URL changed on a synced image', async () => {
    fetch
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: [
              {
                id: 1,
                digiforma_id: 'prog-002',
                image: {
                  id: 'file-old',
                  description: 'digiforma-sync:https://cdn.example/ancienne.jpg'
                }
              }
            ]
          }),
          { status: 200 }
        )
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ data: { id: 'file-new' } }), { status: 200 })
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }))

    await service.upsertMany([
      { ...samplePayloads[1], image_url: 'https://cdn.example/nouvelle.jpg' }
    ])

    const linkCall = fetch.mock.calls.find(
      (call) => call[1]?.method === 'PATCH' && JSON.parse(call[1].body).image === 'file-new'
    )
    expect(linkCall).toBeDefined()
  })

  it('throws when Directus is down', async () => {
    fetch.mockRejectedValue(new Error('network'))

    await expect(service.upsertMany(samplePayloads)).rejects.toThrow('network')
  })

  it('retries failed requests', async () => {
    fetch
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: [] }), { status: 200 }))
      .mockRejectedValueOnce(new Error('timeout'))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))

    await service.upsertMany([samplePayloads[0]])

    expect(fetch).toHaveBeenCalledTimes(3)
  })
})
