import type { H3Event } from 'h3'
import { describe, expect, it, vi } from 'vitest'

vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)

const redirects: Array<{ location: string; code: number }> = []
vi.stubGlobal('sendRedirect', (_event: unknown, location: string, code: number) => {
  redirects.push({ location, code })
  return location
})

let url = 'https://learnup.test/formations'
vi.stubGlobal('getRequestURL', () => new URL(url))

const { default: handler } = await import('../../server/middleware/trailing-slash')

function run(path: string, method = 'GET') {
  url = `https://learnup.test${path}`
  redirects.length = 0
  const event = { method } as H3Event
  return handler(event)
}

describe('server/middleware/trailing-slash (ST-02)', () => {
  it('redirige en 301 vers la forme slashée en un seul saut', () => {
    run('/formations')
    expect(redirects).toEqual([{ location: '/formations/', code: 301 }])
  })

  it('conserve la query string dans la cible', () => {
    run('/formations?centre=lille&page=2')
    expect(redirects[0]).toEqual({
      location: '/formations/?centre=lille&page=2',
      code: 301
    })
  })

  it.each([
    '/',
    '/formations/',
    '/api/courses',
    '/directus/items/articles',
    '/_nuxt/app.js',
    '/__sitemap__/urls',
    '/favicon.ico',
    '/images/hero.webp',
    '/uploads/guide.pdf'
  ])('laisse passer %s sans redirection', (path) => {
    run(path)
    expect(redirects).toHaveLength(0)
  })

  it('ignore les méthodes non idempotentes de lecture (POST)', () => {
    const result = run('/formations', 'POST')
    expect(redirects).toHaveLength(0)
    expect(result).toBeUndefined()
  })

  it('redirige les routes profondes dynamiques', () => {
    run('/formations/caces-conduite-engins/caces-r489')
    expect(redirects[0].location).toBe('/formations/caces-conduite-engins/caces-r489/')
  })
})
