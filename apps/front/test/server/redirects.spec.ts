import type { H3Event } from 'h3'
import { describe, expect, it, vi } from 'vitest'

vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
vi.stubGlobal('useRuntimeConfig', () => ({ apiBase: 'https://api.test', internalApiToken: 'tok' }))

const redirects: Array<{ location: string; code: number }> = []
vi.stubGlobal('sendRedirect', (_event: unknown, location: string, code: number) => {
  redirects.push({ location, code })
  return location
})

const createError = vi.fn((input: { statusCode: number }) => Object.assign(new Error(), input))
vi.stubGlobal('createError', createError)

let resolveResult: unknown = { type: null, id: null }
const fetchCalls: Array<{ url: string; query: unknown; headers: unknown }> = []
vi.stubGlobal('$fetch', async (url: string, opts: { query: unknown; headers: unknown }) => {
  fetchCalls.push({ url, query: opts.query, headers: opts.headers })
  if (resolveResult instanceof Error) throw resolveResult
  return resolveResult
})

let url = 'https://learnup.test/'
vi.stubGlobal('getRequestURL', () => new URL(url))

const { default: handler } = await import('../../server/middleware/redirects')

async function run(path: string, method = 'GET', result: unknown = { type: null, id: null }) {
  url = `https://learnup.test${path}`
  redirects.length = 0
  fetchCalls.length = 0
  resolveResult = result
  return handler({ method } as H3Event)
}

describe('server/middleware/redirects (ST-03)', () => {
  it('applique un 301 de la table redirects, query conservée', async () => {
    await run('/formations/gestion/ancien?utm=x', 'GET', {
      redirect: { to: '/formations/gestion/nouveau', status: 301 }
    })
    expect(redirects).toEqual([{ location: '/formations/gestion/nouveau?utm=x', code: 301 }])
  })

  it('normalise le chemin résolu : slash final et casse absorbés', async () => {
    await run('/Formations/Gestion/Ancien/')
    expect(fetchCalls[0].query).toEqual({ path: '/formations/gestion/ancien' })
  })

  it('répond 410 quand la résolution le demande', async () => {
    await expect(run('/page-disparue', 'GET', { gone: true })).rejects.toMatchObject({
      statusCode: 410
    })
    expect(redirects).toHaveLength(0)
  })

  it('envoie le jeton SSR interne pour le bypass throttler', async () => {
    await run('/formations/securite/caces')
    expect(fetchCalls[0].headers).toEqual({ 'x-internal-ssr': 'tok' })
  })

  it('laisse passer sans redirection quand la résolution ne conclut rien', async () => {
    for (const result of [{ type: 'formation', id: 7 }, { type: null, id: null }, null]) {
      await run('/formations/securite/caces', 'GET', result)
      expect(redirects).toHaveLength(0)
    }
  })

  it('évite la boucle : une cible identique au chemin n’est pas suivie', async () => {
    await run('/formations/x', 'GET', { redirect: { to: '/formations/x', status: 301 } })
    expect(redirects).toHaveLength(0)
  })

  it('fail-open : une API en échec laisse la requête continuer', async () => {
    const result = await run('/formations/securite/caces', 'GET', new Error('api down'))
    expect(result).toBeUndefined()
    expect(redirects).toHaveLength(0)
  })

  it.each([
    '/api/courses',
    '/directus/items/formations',
    '/_nuxt/app.js',
    '/favicon.ico',
    '/images/hero.webp'
  ])('ignore le chemin interne %s sans appel API', async (path) => {
    await run(path)
    expect(fetchCalls).toHaveLength(0)
  })

  it('ignore les méthodes non GET/HEAD', async () => {
    await run('/formations/x', 'POST')
    expect(fetchCalls).toHaveLength(0)
  })
})
