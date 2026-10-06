import { describe, expect, it } from 'vitest'
import { directusAssetUrl } from '~/utils/directusAsset'

describe('directusAssetUrl', () => {
  it('retourne null sans fileId', () => {
    expect(directusAssetUrl(null, 'http://api.test')).toBeNull()
    expect(directusAssetUrl(undefined, 'http://api.test')).toBeNull()
    expect(directusAssetUrl('', 'http://api.test')).toBeNull()
  })

  it('construit l’URL du proxy avec l’apiBase fourni', () => {
    expect(directusAssetUrl('file-123', 'http://api.test')).toBe(
      'http://api.test/directus/assets/file-123'
    )
  })
})
