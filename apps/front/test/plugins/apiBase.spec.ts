import { describe, it, expect, afterEach } from 'vitest'
import apiBasePlugin from '~/plugins/apiBase'

describe('apiBase plugin', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('strips trailing slashes from private and public apiBase', () => {
    const config = {
      apiBase: 'https://eagle-api.vercel.app/',
      public: { apiBase: 'https://eagle-api.vercel.app///' }
    }
    vi.stubGlobal('useRuntimeConfig', () => config)

    apiBasePlugin({} as Parameters<typeof apiBasePlugin>[0])

    expect(config.apiBase).toBe('https://eagle-api.vercel.app')
    expect(config.public.apiBase).toBe('https://eagle-api.vercel.app')
  })

  it('leaves already-normalized URLs untouched', () => {
    const config = {
      apiBase: 'http://localhost:3001',
      public: { apiBase: 'http://localhost:3001' }
    }
    vi.stubGlobal('useRuntimeConfig', () => config)

    apiBasePlugin({} as Parameters<typeof apiBasePlugin>[0])

    expect(config.apiBase).toBe('http://localhost:3001')
    expect(config.public.apiBase).toBe('http://localhost:3001')
  })
})
