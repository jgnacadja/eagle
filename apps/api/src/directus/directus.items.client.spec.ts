import { ConfigService } from '@nestjs/config'
import { DirectusItemsClient } from './directus.items.client'

type FetchInit = NonNullable<Parameters<typeof fetch>[1]>

const fetchMock = vi.fn()
vi.stubGlobal('fetch', fetchMock)

function makeClient(env: Record<string, string | undefined>): DirectusItemsClient {
  const config = { get: (key: string) => env[key] } as unknown as ConfigService
  return new DirectusItemsClient(config)
}

function okResponse(payload: unknown, status = 200) {
  return {
    ok: true,
    status,
    json: vi.fn().mockResolvedValue(payload),
    text: vi.fn().mockResolvedValue('')
  }
}

const ENV = { DIRECTUS_TOKEN: 'token', DIRECTUS_INTERNAL_URL: 'http://directus:8055/' }

describe('DirectusItemsClient', () => {
  beforeEach(() => {
    fetchMock.mockReset()
  })

  it('is disabled without token or url and never calls fetch', async () => {
    const client = makeClient({ DIRECTUS_TOKEN: 'token' })

    expect(client.enabled).toBe(false)
    await expect(client.createOne('x', { a: 1 })).resolves.toBeNull()
    await expect(client.readMany('x', {})).resolves.toEqual({ data: [] })
    await expect(client.deleteMany('x', {})).resolves.toBeUndefined()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('posts the payload and returns the created item', async () => {
    fetchMock.mockResolvedValue(okResponse({ data: { id: 42 } }))
    const client = makeClient(ENV)

    const created = await client.createOne<{ id: number }>('recherches', { query_text: 'x' })

    expect(created).toEqual({ id: 42 })
    const [url, init] = fetchMock.mock.calls[0] as [string, FetchInit]
    expect(url).toBe('http://directus:8055/items/recherches?fields%5B%5D=id')
    expect(init.method).toBe('POST')
    expect(init.body).toBe(JSON.stringify({ query_text: 'x' }))
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer token')
  })

  it('serialises filter, fields, sort, pagination and meta on reads', async () => {
    fetchMock.mockResolvedValue(okResponse({ data: [{ id: 1 }], meta: { filter_count: 7 } }))
    const client = makeClient(ENV)

    const result = await client.readMany<{ id: number }>('recherches', {
      filter: { outcome: { _eq: 'no_result' } },
      fields: ['id', 'query_text'],
      sort: ['-date_created'],
      limit: 50,
      page: 2,
      meta: 'filter_count'
    })

    expect(result).toEqual({ data: [{ id: 1 }], meta: { filter_count: 7 } })
    const url = new URL(fetchMock.mock.calls[0]![0] as string)
    expect(url.searchParams.get('filter')).toBe(JSON.stringify({ outcome: { _eq: 'no_result' } }))
    expect(url.searchParams.getAll('fields[]')).toEqual(['id', 'query_text'])
    expect(url.searchParams.get('sort')).toBe('-date_created')
    expect(url.searchParams.get('limit')).toBe('50')
    expect(url.searchParams.get('page')).toBe('2')
    expect(url.searchParams.get('meta')).toBe('filter_count')
  })

  it('returns an empty list when the response has no data', async () => {
    fetchMock.mockResolvedValue(okResponse({}))
    const client = makeClient(ENV)

    await expect(client.readMany('recherches', {})).resolves.toEqual({
      data: [],
      meta: undefined
    })
  })

  it('deletes by query without a limit and tolerates a 204', async () => {
    const response = okResponse(null, 204)
    fetchMock.mockResolvedValue(response)
    const client = makeClient(ENV)

    await client.deleteMany('recherches', { date_created: { _lt: '2026-01-01' } })

    const [, init] = fetchMock.mock.calls[0] as [string, FetchInit]
    expect(init.method).toBe('DELETE')
    expect(init.body).toBe(
      JSON.stringify({ query: { filter: { date_created: { _lt: '2026-01-01' } }, limit: -1 } })
    )
    expect(response.json).not.toHaveBeenCalled()
  })

  it('throws with the status and body on a failed response', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 403,
      json: vi.fn(),
      text: vi.fn().mockResolvedValue('forbidden')
    })
    const client = makeClient(ENV)

    await expect(client.readMany('recherches', {})).rejects.toThrow(
      'Directus GET /items/recherches failed: 403 forbidden'
    )
  })

  it('aborts the request after the timeout', async () => {
    vi.useFakeTimers()
    fetchMock.mockImplementation(
      (_url: string, init: FetchInit) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener('abort', () => reject(new Error('aborted')))
        })
    )
    const client = makeClient(ENV)

    const expectation = expect(client.readMany('recherches', {})).rejects.toThrow('aborted')
    await vi.advanceTimersByTimeAsync(10_001)

    await expectation
    vi.useRealTimers()
  })
})
