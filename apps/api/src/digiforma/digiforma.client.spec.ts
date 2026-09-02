import { Test, TestingModule } from '@nestjs/testing'
import { ConfigService } from '@nestjs/config'
import { DigiformaClient, type Program } from './digiforma.client'

const apiUrl = 'https://app.digiforma.com/api/v1/graphql'
const apiKey = 'test-key'

const sampleProgram: Program = {
  id: 'prog-001',
  title: 'Pilotage de projet',
  description: 'Apprendre à piloter.',
  durationInDays: 3,
  durationInHours: 21,
  price: 1800,
  cpf: true,
  cpfCode: 'CPF-12345',
  certificationType: 'Certificat',
  certifierName: 'LEARN UP',
  category: 'Management',
  programCategory: 'Management',
  status: 'published'
}

function mockResponse(programs: Program[] = [sampleProgram], hasNextPage = false) {
  return {
    ok: true,
    status: 200,
    json: vi.fn().mockResolvedValue({
      data: {
        programs: {
          nodes: programs,
          pageInfo: { hasNextPage, endCursor: hasNextPage ? 'cursor-1' : undefined }
        }
      }
    })
  } as unknown as Response
}

describe('DigiformaClient', () => {
  let client: DigiformaClient

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DigiformaClient,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: (key: string) => (key === 'DIGIFORMA_API_URL' ? apiUrl : apiKey)
          }
        }
      ]
    }).compile()

    client = module.get<DigiformaClient>(DigiformaClient)
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('fetches all programs in one page', async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse())

    const programs = await client.fetchAllPrograms()

    expect(programs).toHaveLength(1)
    expect(programs[0].id).toBe('prog-001')
    expect(fetch).toHaveBeenCalledWith(
      apiUrl,
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: `Bearer ${apiKey}` })
      })
    )
  })

  it('paginates through multiple pages', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(mockResponse([sampleProgram], true))
      .mockResolvedValueOnce(mockResponse([{ ...sampleProgram, id: 'prog-002' }], false))

    const programs = await client.fetchAllPrograms()

    expect(programs).toHaveLength(2)
    expect(programs[1].id).toBe('prog-002')
  })

  it('retries on transient failure and then succeeds', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('network')).mockResolvedValue(mockResponse())

    const programs = await client.fetchAllPrograms()

    expect(programs).toHaveLength(1)
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it('throws after max retries', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('network'))

    await expect(client.fetchAllPrograms()).rejects.toThrow('network')
    expect(fetch).toHaveBeenCalledTimes(3)
  })
})
