import { describe, expect, it, vi } from 'vitest'
import { useDirectusClient } from '~/composables/useDirectus'

const fetchImpl = vi.fn().mockResolvedValue('ok')
vi.stubGlobal('fetch', fetchImpl)

vi.mock('@directus/sdk', () => ({
  rest: () => 'rest-plugin',
  createDirectus: vi.fn((url: string, options: unknown) => ({
    url,
    options,
    with: (plugin: string) => ({ url, options, plugin })
  }))
}))

vi.stubGlobal('useRuntimeConfig', () => ({
  apiBase: 'http://internal:3001',
  public: { apiBase: 'http://api.test' }
}))
vi.stubGlobal(
  'internalSsrHeaders',
  vi.fn(() => ({ 'x-internal-ssr': 'token-123' }))
)

describe('useDirectusClient', () => {
  it('pointe sur le proxy /directus de l’API publique', () => {
    const client = useDirectusClient()
    expect(client.url).toBe('http://api.test/directus')
    expect(client.plugin).toBe('rest-plugin')
  })

  it('injecte les headers SSR internes dans le fetch du SDK', async () => {
    const client = useDirectusClient() as unknown as {
      options: { globals: { fetch: typeof fetch } }
    }
    const globalFetch = client.options.globals.fetch as (
      input: string,
      init?: Parameters<typeof fetch>[1]
    ) => Promise<unknown>
    void globalFetch

    await globalFetch('https://x/items', { headers: { Accept: 'application/json' } })

    const [, init] = fetchImpl.mock.calls[0]
    const headers = init.headers as Headers
    expect(headers.get('x-internal-ssr')).toBe('token-123')
    expect(headers.get('Accept')).toBe('application/json')
  })

  it('tolère l’absence de headers internes (contexte navigateur)', async () => {
    const ssrMock = vi.mocked(
      globalThis as unknown as { internalSsrHeaders: ReturnType<typeof vi.fn> }
    ).internalSsrHeaders
    ssrMock.mockReturnValueOnce(undefined)

    const client = useDirectusClient() as unknown as {
      options: { globals: { fetch: typeof fetch } }
    }
    const globalFetch = client.options.globals.fetch as (
      input: string,
      init?: Parameters<typeof fetch>[1]
    ) => Promise<unknown>

    await globalFetch('https://x/items')

    const [, init] = fetchImpl.mock.calls.at(-1)!
    expect((init.headers as Headers).get('x-internal-ssr')).toBeNull()
  })
})
