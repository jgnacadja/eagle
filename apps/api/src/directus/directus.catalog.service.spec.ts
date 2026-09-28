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

  it('fetchAllFormations fetches every published formation', async () => {
    fetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ data: [{ id: 1, slug: 'pilotage' }] }), { status: 200 })
    )

    const rows = await service.fetchAllFormations()

    expect(rows).toEqual([{ id: 1, slug: 'pilotage' }])
    const url = String(fetch.mock.calls[0][0])
    expect(url).toContain('/items/formations')
    expect(url).toContain('filter%5Bstatus%5D%5B_eq%5D=published')
    expect(url).toContain('limit=-1')
  })

  it('fetchAllFormations returns [] when data is missing', async () => {
    fetch.mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }))
    expect(await service.fetchAllFormations()).toEqual([])
  })

  it('fetchAllCentres fetches every published centre sorted', async () => {
    fetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ data: [{ id: 3, slug: 'creteil' }] }), { status: 200 })
    )

    const rows = await service.fetchAllCentres()

    expect(rows).toEqual([{ id: 3, slug: 'creteil' }])
    const url = String(fetch.mock.calls[0][0])
    expect(url).toContain('/items/centres')
    expect(url).toContain('sort=sort%2Cname')
  })

  it('fetchAllCentres returns [] when data is missing', async () => {
    fetch.mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }))
    expect(await service.fetchAllCentres()).toEqual([])
  })

  it('fetchCentresForGeocoding fetches minimal fields without status filter', async () => {
    fetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ data: [{ id: 4, slug: 'draft-centre', status: 'draft' }] }), {
        status: 200
      })
    )

    const rows = await service.fetchCentresForGeocoding()

    expect(rows).toEqual([{ id: 4, slug: 'draft-centre', status: 'draft' }])
    const url = String(fetch.mock.calls[0][0])
    expect(url).toContain('/items/centres')
    expect(url).not.toContain('filter')
    expect(url).toContain('geocoded_address')
  })

  it('updateCentre patches geodata on the centre item', async () => {
    fetch.mockResolvedValueOnce(new Response(JSON.stringify({ data: {} }), { status: 200 }))

    await service.updateCentre(7, { latitude: 48.1, longitude: 2.4 })

    expect(fetch.mock.calls[0][0]).toBe('http://directus:8055/items/centres/7')
    expect(fetch.mock.calls[0][1]?.method).toBe('PATCH')
  })

  it('applyFamilyAssignments patches famille and empty sous_famille', async () => {
    fetch
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: [
              {
                id: 9,
                digiforma_id: 'p1',
                famille: { slug: 'old-family' },
                sous_famille: null
              }
            ]
          }),
          { status: 200 }
        )
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ data: [{ id: 1, slug: 'management' }] }), { status: 200 })
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: [
              { id: 5, slug: 'leadership', famille: { slug: 'management' } },
              { id: 6, slug: 'orphee', famille: null }
            ]
          }),
          { status: 200 }
        )
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }))

    const result = await service.applyFamilyAssignments(
      new Map([['p1', { famille: 'management', sousFamille: 'leadership' }]])
    )

    expect(result).toEqual({ assigned: 1, cleared: 0, subAssigned: 1 })
    const patchCall = fetch.mock.calls[3]
    expect(patchCall[0]).toBe('http://directus:8055/items/formations/9')
    expect(JSON.parse(patchCall[1].body)).toEqual({ famille: 1, sous_famille: 5 })
  })

  it('applyFamilyAssignments skips empty patches and missing proposals', async () => {
    fetch
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: [
              {
                id: 9,
                digiforma_id: 'p1',
                famille: { slug: 'management' },
                sous_famille: { id: 5, slug: 'leadership' }
              },
              { id: 10, digiforma_id: 'p2', famille: null, sous_famille: null }
            ]
          }),
          { status: 200 }
        )
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ data: [{ id: 1, slug: 'management' }] }), { status: 200 })
      )
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: [] }), { status: 200 }))

    const result = await service.applyFamilyAssignments(
      new Map([['p1', { famille: 'management', sousFamille: 'leadership' }]])
    )

    expect(result).toEqual({ assigned: 0, cleared: 0, subAssigned: 0 })
    expect(fetch).toHaveBeenCalledTimes(3)
  })

  it('applyFamilyAssignments resolves sous_famille via the current famille', async () => {
    fetch
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: [
              {
                id: 9,
                digiforma_id: 'p1',
                famille: { slug: 'management' },
                sous_famille: null
              }
            ]
          }),
          { status: 200 }
        )
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ data: [{ id: 1, slug: 'management' }] }), { status: 200 })
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: [{ id: 5, slug: 'leadership', famille: { slug: 'management' } }]
          }),
          { status: 200 }
        )
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }))

    const result = await service.applyFamilyAssignments(
      new Map([['p1', { sousFamille: 'leadership' }]])
    )

    expect(result).toEqual({ assigned: 0, cleared: 0, subAssigned: 1 })
    expect(JSON.parse(fetch.mock.calls[3][1].body)).toEqual({ sous_famille: 5 })
  })

  it('applyFamilyAssignments ignores unknown slugs', async () => {
    fetch
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: [{ id: 9, digiforma_id: 'p1', famille: null, sous_famille: null }]
          }),
          { status: 200 }
        )
      )
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: [] }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: [] }), { status: 200 }))

    const result = await service.applyFamilyAssignments(
      new Map([['p1', { famille: 'unknown', sousFamille: 'orphan' }]])
    )

    expect(result).toEqual({ assigned: 0, cleared: 0, subAssigned: 0 })
    expect(fetch).toHaveBeenCalledTimes(3)
  })

  it('returns empty collections and no-ops writes when Directus is disabled', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DirectusCatalogService,
        { provide: ConfigService, useValue: { get: () => undefined } }
      ]
    }).compile()
    const disabled = module.get<DirectusCatalogService>(DirectusCatalogService)

    expect(await disabled.fetchAllFormations()).toEqual([])
    expect(await disabled.fetchAllCentres()).toEqual([])
    expect(await disabled.fetchCentresForGeocoding()).toEqual([])
    expect(await disabled.upsertMany(samplePayloads)).toEqual({ inserted: 0, updated: 0 })
    await expect(disabled.updateCentre(1, { latitude: 1 })).rejects.toThrow(
      'Directus catalog disabled'
    )
    await expect(disabled.applyFamilyAssignments(new Map())).rejects.toThrow(
      'Directus catalog disabled'
    )
    expect(fetch).not.toHaveBeenCalled()
  })
  it('overwrites an empty-object field on update', async () => {
    fetch
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ data: [{ id: 1, digiforma_id: 'prog-002', blocks: {} }] }), {
          status: 200
        })
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }))

    await service.upsertMany([{ ...samplePayloads[1], blocks: [{ name: 'Bloc sync', goals: [] }] }])

    const patchCall = fetch.mock.calls.find((call) => call[1]?.method === 'PATCH')
    expect(patchCall).toBeDefined()
    expect(JSON.parse(patchCall?.[1]?.body ?? '{}').blocks).toEqual([
      { name: 'Bloc sync', goals: [] }
    ])
  })

  it('links the imported image on a newly created formation', async () => {
    fetch
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: [] }), { status: 200 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ data: [{ id: 9, digiforma_id: 'prog-002' }] }), {
          status: 200
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ data: { id: 'file-created' } }), { status: 200 })
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }))

    await service.upsertMany([
      { ...samplePayloads[1], image_url: 'https://cdn.example/visuel.jpg' }
    ])

    const linkCall = fetch.mock.calls.find(
      (call) =>
        call[1]?.method === 'PATCH' &&
        call[0] === 'http://directus:8055/items/formations/9' &&
        JSON.parse(call[1].body).image === 'file-created'
    )
    expect(linkCall).toBeDefined()
  })

  it('skips image import when the formation id cannot be resolved', async () => {
    fetch
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: [] }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: [] }), { status: 200 }))

    await service.upsertMany([
      { ...samplePayloads[1], image_url: 'https://cdn.example/visuel.jpg' }
    ])

    expect(fetch.mock.calls.some((call) => call[0].endsWith('/files/import'))).toBe(false)
  })

  it('skips image import when the synced marker already matches', async () => {
    fetch
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: [
              {
                id: 1,
                digiforma_id: 'prog-002',
                image: {
                  id: 'file-same',
                  description: 'digiforma-sync:https://cdn.example/visuel.jpg'
                }
              }
            ]
          }),
          { status: 200 }
        )
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }))

    await service.upsertMany([
      { ...samplePayloads[1], image_url: 'https://cdn.example/visuel.jpg' }
    ])

    expect(fetch.mock.calls.some((call) => call[0].endsWith('/files/import'))).toBe(false)
  })

  it('leaves the image empty when the import response has no id', async () => {
    fetch
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ data: [{ id: 1, digiforma_id: 'prog-002', image: null }] }), {
          status: 200
        })
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }))

    await service.upsertMany([
      { ...samplePayloads[1], image_url: 'https://cdn.example/visuel.jpg' }
    ])

    expect(
      fetch.mock.calls.some(
        (call) =>
          call[1]?.method === 'PATCH' && JSON.parse(call[1].body ?? '{}').image !== undefined
      )
    ).toBe(false)
  })

  it('returns [] for geocoding and assignment fetches without data', async () => {
    fetch.mockImplementation(() =>
      Promise.resolve(new Response(JSON.stringify({}), { status: 200 }))
    )

    expect(await service.fetchCentresForGeocoding()).toEqual([])
    expect(await service.getFamilyIdsBySlug()).toEqual(new Map())
    expect(await service.getSubFamilyIdsByFamilySlug()).toEqual(new Map())

    const result = await service.applyFamilyAssignments(new Map([['prog-1', { famille: 'x' }]]))
    expect(result).toEqual({ assigned: 0, cleared: 0, subAssigned: 0 })
  })

  it('treats a missing data payload on fetchExisting as new formations', async () => {
    fetch
      .mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ data: [{ id: 3, digiforma_id: 'prog-002' }] }), {
          status: 200
        })
      )

    const result = await service.upsertMany([samplePayloads[1]])

    expect(result.inserted).toBe(1)
    expect(fetch.mock.calls.some((call) => call[1]?.method === 'PATCH')).toBe(false)
  })
})
