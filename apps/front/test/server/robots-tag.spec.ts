import type { H3Event } from 'h3'
import { describe, expect, it, vi } from 'vitest'

vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)

const headers: Array<{ name: string; value: string }> = []
vi.stubGlobal('setHeader', (_event: unknown, name: string, value: string) => {
  headers.push({ name, value })
})

let indexable = false
vi.stubGlobal('getSiteIndexable', () => indexable)

let url = 'https://preview.vercel.app/formations/'
vi.stubGlobal('getRequestURL', () => new URL(url))

const { default: handler } = await import('../../server/middleware/robots-tag')

function run(path: string, method = 'GET') {
  url = `https://preview.vercel.app${path}`
  headers.length = 0
  handler({ method } as H3Event)
}

describe('server/middleware/robots-tag (ST-03)', () => {
  it('pose X-Robots-Tag: noindex sur les pages hors environnement indexable', () => {
    indexable = false
    run('/formations')
    expect(headers).toEqual([{ name: 'X-Robots-Tag', value: 'noindex' }])
  })

  it('ne pose aucun en-tête en environnement indexable', () => {
    indexable = true
    run('/formations')
    expect(headers).toHaveLength(0)
  })

  it.each(['/api/courses', '/directus/items/x', '/_nuxt/app.js', '/favicon.ico', '/img.svg'])(
    'ignore les routes internes et fichiers (%s)',
    (path) => {
      indexable = false
      run(path)
      expect(headers).toHaveLength(0)
    }
  )

  it('ignore les méthodes non GET/HEAD', () => {
    indexable = false
    run('/formations', 'POST')
    expect(headers).toHaveLength(0)
  })
})
