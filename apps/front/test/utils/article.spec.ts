import { describe, expect, it } from 'vitest'
import {
  articleAssetUrl,
  articleReadingTime,
  formatArticleDate,
  slugifyHeading,
  stripHtmlTags
} from '~/utils/article'

describe('formatArticleDate', () => {
  it('formate une date ISO en français', () => {
    expect(formatArticleDate('2026-09-02T10:00:00Z')).toBe('02 septembre 2026')
  })

  it('retourne un libellé de secours sans date', () => {
    expect(formatArticleDate(null)).toBe('Date à préciser')
    expect(formatArticleDate(undefined)).toBe('Date à préciser')
    expect(formatArticleDate('')).toBe('Date à préciser')
  })

  it('retourne un libellé de secours pour une date invalide', () => {
    expect(formatArticleDate('not-a-date')).toBe('Date à préciser')
  })
})

describe('articleAssetUrl', () => {
  it('construit l’URL de l’asset via le proxy API', () => {
    expect(articleAssetUrl('abc-123', 'https://api.test')).toBe(
      'https://api.test/directus/assets/abc-123'
    )
  })

  it('retourne null sans identifiant', () => {
    expect(articleAssetUrl(null, 'https://api.test')).toBeNull()
    expect(articleAssetUrl('', 'https://api.test')).toBeNull()
  })
})

describe('articleReadingTime', () => {
  it('retourne au moins 1 minute', () => {
    expect(articleReadingTime('')).toBe(1)
    expect(articleReadingTime(null)).toBe(1)
    expect(articleReadingTime(undefined)).toBe(1)
  })

  it('estime à partir du texte sans les balises HTML', () => {
    expect(articleReadingTime(`<p>${'a'.repeat(2600)}</p>`)).toBe(2)
  })
})

describe('stripHtmlTags', () => {
  it('retire les balises et normalise les espaces', () => {
    expect(stripHtmlTags('<p>Bonjour <strong>le</strong>   monde</p>')).toBe('Bonjour le monde')
  })
})

describe('slugifyHeading', () => {
  it('slugifie la casse et les accents', () => {
    expect(slugifyHeading('Échéances réglementaires 2027')).toBe('echeances-reglementaires-2027')
  })

  it('retire les caractères spéciaux', () => {
    expect(slugifyHeading('CACES® : recyclage !')).toBe('caces-recyclage')
  })
})
