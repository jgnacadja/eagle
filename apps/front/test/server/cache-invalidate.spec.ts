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
let requestBody: unknown = null

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
vi.stubGlobal('useRuntimeConfig', () => ({ cachePurgeSecret: purgeSecret }))

const { default: handler } = await import('../../server/api/cache/invalidate.post')

function event(body: unknown = null, secret = 'test-secret'): H3Event {
  requestBody = body
  return { headers: { 'x-cache-secret': secret } } as unknown as H3Event
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
    requestBody = null
  })

  it('purge tout sans body', async () => {
    const result = await handler(event())
    expect(result).toEqual({ success: true, purged: 4 })
    expect(storage.keys).toEqual([])
  })

  it('purge uniquement la fiche visée par match (slug)', async () => {
    const result = await handler(event({ match: 'sst-sauveteur-secouriste-du-travail' }))
    expect(result).toEqual({ success: true, purged: 1 })
    expect(storage.keys).toHaveLength(3)
  })

  it('purge le préfixe routier de la collection', async () => {
    const result = await handler(event({ collection: 'formations' }))
    expect(result).toEqual({ success: true, purged: 2 })
    expect(storage.keys).toEqual(['nitro:isr:actualites:mon-article', 'nitro:isr:'])
  })

  it('collection inconnue → purge complète (la fraîcheur prime)', async () => {
    const result = await handler(event({ collection: 'inconnue' }))
    expect(result).toEqual({ success: true, purged: 4 })
  })

  it('rejette un secret invalide', async () => {
    await expect(handler(event(null, 'mauvais'))).rejects.toMatchObject({ statusCode: 401 })
    expect(storage.keys).toHaveLength(4)
  })

  it('renvoie 503 quand la purge n’est pas configurée', async () => {
    purgeSecret = ''
    await expect(handler(event())).rejects.toMatchObject({ statusCode: 503 })
  })
})
