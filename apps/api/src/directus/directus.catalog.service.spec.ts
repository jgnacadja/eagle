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
