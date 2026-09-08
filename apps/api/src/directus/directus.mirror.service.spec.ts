import { Test, TestingModule } from '@nestjs/testing'
import { ConfigService } from '@nestjs/config'
import { DirectusMirrorService, type MirrorCourse } from './directus.mirror.service'

const sampleCourses: MirrorCourse[] = [
  { digiformaId: 'prog-001', slug: 'pilotage', title: 'Pilotage', categoryName: 'Management' },
  { digiformaId: 'prog-002', slug: 'securite', title: 'Sécurité', categoryName: null }
]

describe('DirectusMirrorService', () => {
  let service: DirectusMirrorService
  let fetch: ReturnType<typeof vi.fn>

  beforeEach(async () => {
    fetch = vi.fn()
    global.fetch = fetch

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DirectusMirrorService,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => (key === 'DIRECTUS_SYNC_TOKEN' ? 'token' : 'http://directus:8055')
          }
        }
      ]
    }).compile()

    service = module.get<DirectusMirrorService>(DirectusMirrorService)
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

    await service.upsertMany(sampleCourses)

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

  it('does not send famille field when updating', async () => {
    fetch
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ data: [{ id: 1, digiforma_id: 'prog-001' }] }), {
          status: 200
        })
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }))

    await service.upsertMany([sampleCourses[0]])

    const patchBody = JSON.parse(fetch.mock.calls[1][1].body)
    expect(patchBody).not.toHaveProperty('famille')
  })

  it('logs and resolves when Directus is down', async () => {
    fetch.mockRejectedValue(new Error('network'))

    await expect(service.upsertMany(sampleCourses)).resolves.toBeUndefined()
  })

  it('fetches family assignments', async () => {
    fetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          data: [
            { digiforma_id: 'prog-001', famille: { slug: 'management' } },
            { digiforma_id: 'prog-002', famille: null }
          ]
        }),
        { status: 200 }
      )
    )

    const result = await service.fetchAssignments()

    expect(result.get('prog-001')).toBe('management')
    expect(result.has('prog-002')).toBe(false)
  })

  it('retries failed requests', async () => {
    fetch
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: [] }), { status: 200 }))
      .mockRejectedValueOnce(new Error('timeout'))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))

    await service.upsertMany([sampleCourses[0]])

    expect(fetch).toHaveBeenCalledTimes(3)
  })
})
