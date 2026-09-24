import { ConfigService } from '@nestjs/config'
import { HttpEmbeddingsProvider } from './http-embeddings.provider'

const fetchMock = vi.fn()
vi.stubGlobal('fetch', fetchMock)

const ENV: Record<string, string> = {
  EMBEDDINGS_API_URL: 'https://embeddings.test/v1/embeddings',
  EMBEDDINGS_API_KEY: 'secret',
  EMBEDDINGS_MODEL: 'test-embed'
}

function makeProvider(env: Record<string, string> = ENV): HttpEmbeddingsProvider {
  const config = {
    getOrThrow: (key: string) => {
      if (!(key in env)) throw new Error(`${key} missing`)
      return env[key]
    }
  } as unknown as ConfigService
  return new HttpEmbeddingsProvider(config)
}

function okResponse(vectors: number[][], shuffle = false) {
  const data = vectors.map((embedding, index) => ({ index, embedding }))
  return {
    ok: true,
    status: 200,
    json: vi.fn().mockResolvedValue({ data: shuffle ? [...data].reverse() : data }),
    text: vi.fn().mockResolvedValue('')
  }
}

describe('HttpEmbeddingsProvider', () => {
  beforeEach(() => {
    fetchMock.mockReset()
  })

  it('requires the url, key and model', () => {
    expect(() => makeProvider({})).toThrow('EMBEDDINGS_API_URL missing')
    expect(makeProvider().name).toBe('http:test-embed')
  })

  it('posts an OpenAI-compatible payload, keeps the input order and normalises vectors', async () => {
    fetchMock.mockResolvedValue(
      okResponse(
        [
          [3, 4],
          [0, 2]
        ],
        true
      )
    )

    const vectors = await makeProvider().embed(['a', 'b'])

    expect(vectors).toEqual([
      [0.6, 0.8],
      [0, 1]
    ])
    const [url, init] = fetchMock.mock.calls[0] as [
      string,
      { body: string; headers: Record<string, string> }
    ]
    expect(url).toBe(ENV.EMBEDDINGS_API_URL)
    expect(JSON.parse(init.body)).toEqual({ model: 'test-embed', input: ['a', 'b'] })
    expect(init.headers.Authorization).toBe('Bearer secret')
  })

  it('splits large inputs into batches of 64', async () => {
    fetchMock.mockImplementation(async (_url: string, init: { body: string }) => {
      const { input } = JSON.parse(init.body) as { input: string[] }
      return okResponse(input.map(() => [1, 0]))
    })

    const vectors = await makeProvider().embed(Array.from({ length: 70 }, (_, i) => `t${i}`))

    expect(vectors).toHaveLength(70)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('fails loudly on HTTP errors and inconsistent responses', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 429,
      json: vi.fn(),
      text: vi.fn().mockResolvedValue('rate limited')
    })
    await expect(makeProvider().embed(['a'])).rejects.toThrow('HTTP 429')

    fetchMock.mockResolvedValue(okResponse([[1, 0]]))
    await expect(makeProvider().embed(['a', 'b'])).rejects.toThrow('returned 1 vectors for 2 texts')
  })
})
