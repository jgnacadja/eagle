import type { H3Event } from 'h3'
import { beforeEach, describe, expect, it, vi } from 'vitest'

interface FetchCall {
  url: string
  query?: Record<string, unknown>
  headers?: Record<string, string>
}

const fetchCalls: FetchCall[] = []
let fetchImpl: (url: string, query?: Record<string, unknown>) => Promise<unknown>

vi.stubGlobal('defineSitemapEventHandler', (handler: unknown) => handler)
vi.stubGlobal('defineCachedEventHandler', (handler: unknown) => handler)
vi.stubGlobal('useRuntimeConfig', () => ({
  apiBase: 'http://api.test',
  internalApiToken: 'ssr-token'
}))
vi.stubGlobal(
  '$fetch',
  (
    url: string,
    options?: { query?: Record<string, unknown>; headers?: Record<string, string> }
  ) => {
    fetchCalls.push({ url, query: options?.query, headers: options?.headers })
    return fetchImpl(url, options?.query)
  }
)

const { default: handler } = await import('../../server/api/__sitemap__/urls')

const event = {} as H3Event

function directusList(data: unknown[]) {
  return Promise.resolve({ data })
}

const COURSES = {
  items: [
    { slug: 'sst', familySlug: 'sante' },
    { slug: 'caces-r489', familySlug: 'caces-conduite-engins' },
    // Orpheline : pas de famille → pas de route fiche, hors sitemap.
    { slug: 'orpheline', familySlug: null }
  ],
  total: 3
}

function happyFetch(url: string): Promise<unknown> {
  if (url.endsWith('/courses')) return Promise.resolve(COURSES)
  if (url.endsWith('/centres')) return Promise.resolve([{ slug: 'lyon-part-dieu' }])
  if (url.endsWith('/items/familles_formation')) return directusList([{ slug: 'sante' }])
  if (url.endsWith('/items/articles')) {
    return directusList([{ slug: 'loi-iafp', publish_at: '2026-09-01T10:00:00' }])
  }
  if (url.endsWith('/items/pages_legales')) {
    return directusList([{ slug: 'mentions-legales', updated_at: '2026-08-15T12:00:00' }])
  }
  return Promise.reject(new Error(`unexpected url ${url}`))
}

function locs(result: Array<{ loc: string }>): string[] {
  return result.map((u) => u.loc).sort()
}

describe('server/api/__sitemap__/urls', () => {
  beforeEach(() => {
    fetchCalls.length = 0
    fetchImpl = happyFetch
  })

  it('émet toutes les collections publiées avec leurs préfixes routiers', async () => {
    const result = await handler(event)
    expect(locs(result)).toEqual([
      '/actualites/loi-iafp',
      '/centres/lyon-part-dieu',
      '/formations/caces-conduite-engins/caces-r489',
      '/formations/sante',
      '/formations/sante/sst',
      '/mentions-legales'
    ])
  })

  it('passe lastmod quand la collection expose une date', async () => {
    const result = await handler(event)
    expect(result.find((u) => u.loc === '/actualites/loi-iafp')?.lastmod).toBe(
      '2026-09-01T10:00:00'
    )
    expect(result.find((u) => u.loc === '/mentions-legales')?.lastmod).toBe('2026-08-15T12:00:00')
    expect(result.find((u) => u.loc === '/formations/sante')).not.toHaveProperty('lastmod')
  })

  it('filtre status=published sur les collections Directus', async () => {
    await handler(event)
    const directusCalls = fetchCalls.filter((c) => c.url.includes('/directus/items/'))
    expect(directusCalls).toHaveLength(3)
    for (const call of directusCalls) {
      expect(call.query?.['filter[status][_eq]']).toBe('published')
    }
  })

  it('envoie le header SSR interne pour bypasser le rate-limit public', async () => {
    await handler(event)
    expect(fetchCalls.every((c) => c.headers?.['x-internal-ssr'] === 'ssr-token')).toBe(true)
  })

  it('pagine le catalogue jusqu’à épuisement du total', async () => {
    fetchImpl = (url, query) => {
      if (url.endsWith('/courses')) {
        const page = Number(query?.page ?? 1)
        const item = { slug: `f-${page}`, familySlug: 'sante' }
        return Promise.resolve({ items: page <= 2 ? [item] : [], total: 2 })
      }
      return happyFetch(url)
    }
    const result = await handler(event)
    expect(locs(result)).toContain('/formations/sante/f-1')
    expect(locs(result)).toContain('/formations/sante/f-2')
    const coursesCalls = fetchCalls.filter((c) => c.url.endsWith('/courses'))
    expect(coursesCalls.length).toBeGreaterThanOrEqual(2)
  })

  it('dégrade à un sitemap partiel si une source tombe', async () => {
    const base = fetchImpl
    fetchImpl = (url) =>
      url.endsWith('/courses') ? Promise.reject(new Error('api down')) : base(url)
    const result = await handler(event)
    expect(locs(result)).not.toContain('/formations/sante/sst')
    expect(locs(result)).toContain('/centres/lyon-part-dieu')
    expect(locs(result)).toContain('/actualites/loi-iafp')
  })

  it('renvoie [] si toutes les sources tombent', async () => {
    fetchImpl = () => Promise.reject(new Error('all down'))
    const result = await handler(event)
    expect(result).toEqual([])
  })

  it('déduplique un slug de page légale identique à une route statique', async () => {
    const base = fetchImpl
    fetchImpl = (url) =>
      url.endsWith('/items/pages_legales')
        ? directusList([{ slug: 'entreprise' }, { slug: 'mentions-legales' }])
        : base(url)
    const result = await handler(event)
    expect(locs(result).filter((l) => l === '/entreprise')).toHaveLength(1)
  })
})
