import { Test, TestingModule } from '@nestjs/testing'
import { ConfigService } from '@nestjs/config'
import { DigiformaClient, type Program } from './digiforma.client'

const apiUrl = 'https://app.digiforma.com/api/v1/graphql'
const apiKey = 'test-key'

const sampleProgram: Program = {
  id: 'prog-001',
  code: 'R489',
  name: 'Pilotage de projet',
  description: 'Apprendre à piloter.',
  durationInDays: 3,
  durationInHours: 21,
  cpf: true,
  cpfCode: 'CPF-12345',
  certificationType: 'Certificat',
  certifierName: 'LEARN UP',
  category: { id: 'cat-1', name: 'Management' },
  costsInter: [{ cost: 1800, vat: 20, type: 'inter' }]
}

function mockResponse(programs: Program[]) {
  return {
    ok: true,
    status: 200,
    json: vi.fn().mockResolvedValue({ data: { programs } })
  } as unknown as Response
}

function fullPage(): Program[] {
  return Array.from({ length: 100 }, (_, index) => ({
    ...sampleProgram,
    id: `prog-${index + 1}`
  }))
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

  it('fetches all programs in one page when the page is not full', async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse([sampleProgram]))

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
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('sends page and size pagination variables', async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse([]))

    await client.fetchAllPrograms()

    const body = JSON.parse(vi.mocked(fetch).mock.calls[0][1]?.body as string)
    expect(body.variables).toEqual({ page: 1, size: 100 })
  })

  it('paginates until a short page is returned', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(mockResponse(fullPage()))
      .mockResolvedValueOnce(mockResponse([{ ...sampleProgram, id: 'prog-101' }]))

    const programs = await client.fetchAllPrograms()

    expect(programs).toHaveLength(101)
    expect(fetch).toHaveBeenCalledTimes(2)

    const secondBody = JSON.parse(vi.mocked(fetch).mock.calls[1][1]?.body as string)
    expect(secondBody.variables).toEqual({ page: 2, size: 100 })
  })

  it('retries on transient failure and then succeeds', async () => {
    vi.mocked(fetch)
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValue(mockResponse([sampleProgram]))

    const programs = await client.fetchAllPrograms()

    expect(programs).toHaveLength(1)
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it('throws after max retries', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('network'))

    await expect(client.fetchAllPrograms()).rejects.toThrow('network')
    expect(fetch).toHaveBeenCalledTimes(3)
  })

  it('warns on GraphQL errors but returns data when a program payload is present', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({
        data: { programs: [sampleProgram] },
        errors: [{ message: 'partial' }]
      })
    } as unknown as Response)

    const programs = await client.fetchAllPrograms()

    expect(programs).toHaveLength(1)
  })

  it('throws when GraphQL errors are returned without a program payload', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({
        data: { programs: null },
        errors: [{ message: 'fatal' }]
      })
    } as unknown as Response)

    await expect(client.fetchAllPrograms()).rejects.toThrow('Digiforma GraphQL errors')
  })
})
