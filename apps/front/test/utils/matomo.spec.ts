import { describe, expect, it } from 'vitest'
import { cleanTrackedUrl, isPreviewQuery } from '~/utils/matomo'

describe('cleanTrackedUrl (MAT-15)', () => {
  it('retourne le chemin nu sans query', () => {
    expect(cleanTrackedUrl('/formations/securite', '')).toBe('/formations/securite')
    expect(cleanTrackedUrl('/formations/securite', '?')).toBe('/formations/securite')
  })

  it('retire utm_*, page, tri, sort et order', () => {
    expect(
      cleanTrackedUrl(
        '/formations',
        '?utm_source=nl&utm_medium=email&page=3&tri=prix&sort=asc&order=desc'
      )
    ).toBe('/formations')
  })

  it('conserve les paramètres métier (recherche, filtres)', () => {
    expect(cleanTrackedUrl('/formations', '?q=caces&famille=securite&page=2')).toBe(
      '/formations?q=caces&famille=securite'
    )
  })

  it('ignore la casse des clés', () => {
    expect(cleanTrackedUrl('/x', '?UTM_Source=a&Page=2')).toBe('/x')
  })
})

describe('isPreviewQuery', () => {
  it('détecte la prévisualisation Directus', () => {
    expect(isPreviewQuery({ preview: 'abc123' })).toBe(true)
    expect(isPreviewQuery({})).toBe(false)
    expect(isPreviewQuery({ q: 'caces' })).toBe(false)
  })
})
