import { afterEach, describe, expect, it, vi } from 'vitest'
import { directusAssetUrl } from '~/utils/directusAsset'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('directusAssetUrl', () => {
  it('retourne null sans fileId', () => {
    expect(directusAssetUrl(null)).toBeNull()
    expect(directusAssetUrl(undefined)).toBeNull()
    expect(directusAssetUrl('')).toBeNull()
  })

  it('construit l’URL du proxy avec un apiBase explicite', () => {
    expect(directusAssetUrl('file-123', 'http://api.test')).toBe(
      'http://api.test/directus/assets/file-123'
    )
  })

  it('résout apiBase via la runtime config en contexte Nuxt', () => {
    vi.stubGlobal('useRuntimeConfig', () => ({ public: { apiBase: 'http://cfg.test' } }))

    expect(directusAssetUrl('file-123')).toBe('http://cfg.test/directus/assets/file-123')
  })

  it('retourne null hors contexte Nuxt et sans apiBase', () => {
    vi.stubGlobal('useRuntimeConfig', undefined)

    expect(directusAssetUrl('file-123')).toBeNull()
  })
})
