import type { H3Event } from 'h3'
import { beforeEach, describe, expect, it, vi } from 'vitest'

interface FakeStorage {
  keys: string[]
  getKeys: () => Promise<string[]>
  removeItem: (key: string) => Promise<void>
}

const storage: FakeStorage = {
  keys: [],
  getKeys: vi.fn(async () => storage.keys),
  removeItem: vi.fn(async (key: string) => {
    storage.keys = storage.keys.filter((k) => k !== key)
  })
}

let purgeSecret = 'test-secret'
let bypassToken = ''
let requestBody: unknown = null

const fetchMock = vi.fn<(url: string, options?: unknown) => Promise<Response>>(
  async () => new Response(null, { status: 200 })
)

vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
vi.stubGlobal(
  'getHeader',
  (event: { headers?: Record<string, string> }, name: string) => event.headers?.[name]
)
vi.stubGlobal('readBody', () => requestBody)
vi.stubGlobal('createError', (input: { statusCode: number; statusMessage: string }) => {
  const error = new Error(input.statusMessage) as Error & { statusCode: number }
  error.statusCode = input.statusCode
  return error
})
vi.stubGlobal('useStorage', () => storage)
vi.stubGlobal('useRuntimeConfig', () => ({
  cachePurgeSecret: purgeSecret,
  isrBypassToken: bypassToken
}))
vi.stubGlobal('$fetch', { raw: fetchMock })

const { default: handler } = await import('../../server/api/cache/invalidate.post')

function event(body: unknown = null, secret = 'test-secret'): H3Event {
  requestBody = body
  return {
    headers: {
      'x-cache-secret': secret,
      host: 'front.test',
      'x-forwarded-proto': 'https'
    }
  } as unknown as H3Event
}

// URL et header des requêtes de revalidation Vercel capturées par le mock.
function revalidatedPaths(): string[] {
  return fetchMock.mock.calls.map(([url]) => url as string)
}

describe('server/api/cache/invalidate', () => {
  beforeEach(() => {
    storage.keys = [
      'nitro:isr:formations:sante:sst-sauveteur-secouriste-du-travail',
      'nitro:isr:formations:caces-conduite-engins:caces-r489',
      'nitro:isr:actualites:mon-article',
      'nitro:isr:'
    ]
    purgeSecret = 'test-secret'
    bypassToken = ''
    requestBody = null
    fetchMock.mockClear()
  })

  it('purge tout sans body', async () => {
    const result = await handler(event())
    expect(result).toEqual({ success: true, purged: 4, revalidated: 0 })
    expect(storage.keys).toEqual([])
  })

  it('purge uniquement la fiche visée par match (slug)', async () => {
    const result = await handler(event({ match: 'sst-sauveteur-secouriste-du-travail' }))
    expect(result).toEqual({ success: true, purged: 1, revalidated: 0 })
    expect(storage.keys).toHaveLength(3)
  })

  it('purge les routes contenant le préfixe path', async () => {
    const result = await handler(event({ path: '/actualites' }))
    expect(result).toEqual({ success: true, purged: 1, revalidated: 0 })
    expect(storage.keys).not.toContain('nitro:isr:actualites:mon-article')
  })

  it('purge le préfixe routier de la collection', async () => {
    const result = await handler(event({ collection: 'formations' }))
    expect(result).toEqual({ success: true, purged: 2, revalidated: 0 })
    expect(storage.keys).toEqual(['nitro:isr:actualites:mon-article', 'nitro:isr:'])
  })

  it('collection inconnue → purge complète (la fraîcheur prime)', async () => {
    const result = await handler(event({ collection: 'inconnue' }))
    expect(result).toEqual({ success: true, purged: 4, revalidated: 0 })
  })

  it('collection héritée (__proto__) → purge complète, sans lever', async () => {
    const result = await handler(event({ collection: '__proto__' }))
    expect(result).toEqual({ success: true, purged: 4, revalidated: 0 })
  })

  it('articles purge /actualites et la racine, pas les formations', async () => {
    const result = await handler(event({ collection: 'articles' }))
    expect(result).toEqual({ success: true, purged: 2, revalidated: 0 })
    expect(storage.keys).toEqual([
      'nitro:isr:formations:sante:sst-sauveteur-secouriste-du-travail',
      'nitro:isr:formations:caces-conduite-engins:caces-r489'
    ])
  })

  it('pages ne purge que la racine', async () => {
    const result = await handler(event({ collection: 'pages' }))
    expect(result).toEqual({ success: true, purged: 1, revalidated: 0 })
    expect(storage.keys).not.toContain('nitro:isr:')
    expect(storage.keys).toHaveLength(3)
  })

  it('rejette un secret invalide', async () => {
    await expect(handler(event(null, 'mauvais'))).rejects.toMatchObject({ statusCode: 401 })
    expect(storage.keys).toHaveLength(4)
  })

  it('rejette un secret de longueur différente sans lever', async () => {
    await expect(handler(event(null, 'x'))).rejects.toMatchObject({ statusCode: 401 })
    expect(storage.keys).toHaveLength(4)
  })

  it('renvoie 503 quand la purge n’est pas configurée', async () => {
    purgeSecret = ''
    await expect(handler(event())).rejects.toMatchObject({ statusCode: 503 })
  })

  describe('revalidation Vercel (bypassToken configuré)', () => {
    beforeEach(() => {
      bypassToken = 'vercel-token'
    })

    it('revalide le représentant du groupe formations pour une collection', async () => {
      const result = await handler(event({ collection: 'formations' }))
      expect(result).toEqual({ success: true, purged: 2, revalidated: 1 })
      expect(revalidatedPaths()).toEqual(['https://front.test/formations'])
      expect(fetchMock.mock.calls[0]![1]).toMatchObject({
        method: 'HEAD',
        headers: { 'x-prerender-revalidate': 'vercel-token' }
      })
    })

    it('collection centres → groupes centres et formations', async () => {
      const result = await handler(event({ collection: 'centres' }))
      expect(result.revalidated).toBe(2)
      expect(revalidatedPaths()).toEqual([
        'https://front.test/centres',
        'https://front.test/formations'
      ])
    })

    it('articles → actualites et racine', async () => {
      await handler(event({ collection: 'articles' }))
      expect(revalidatedPaths()).toEqual(['https://front.test/actualites', 'https://front.test/'])
    })

    it('match (slug de fiche) couvre tous les groupes', async () => {
      const result = await handler(event({ match: 'sst-sauveteur-secouriste-du-travail' }))
      expect(result.revalidated).toBe(4)
      expect(revalidatedPaths()).toEqual([
        'https://front.test/formations',
        'https://front.test/centres',
        'https://front.test/actualites',
        'https://front.test/'
      ])
    })

    it('sans body → revalidation complète', async () => {
      await handler(event())
      expect(revalidatedPaths()).toHaveLength(4)
    })

    it('une revalidation en échec ne fait pas échouer la purge', async () => {
      fetchMock.mockImplementationOnce(async () => {
        throw new Error('cdn down')
      })
      const result = await handler(event({ collection: 'centres' }))
      expect(result).toEqual({ success: true, purged: 2, revalidated: 1 })
    })
  })
})
