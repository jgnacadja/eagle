import type { Avis } from '@learnup/types'
import { describe, expect, it } from 'vitest'
import { mapAvis } from '~/utils/avis'

const base: Avis = {
  id: 1,
  status: 'published',
  sort: null,
  slug: 'temoignage-1',
  stars: 4,
  quote: 'Une équipe très réactive.',
  author: 'Marie D.',
  published_at: '2026-01-15T10:00:00.000Z',
  centre: null
}

describe('mapAvis', () => {
  it('transforme un avis complet (étoiles, guillemets, auteur · date)', () => {
    const mapped = mapAvis(base)
    expect(mapped.stars).toBe('★★★★☆')
    expect(mapped.quote).toBe('« Une équipe très réactive. »')
    expect(mapped.author).toMatch(/^Marie D\. · /)
  })

  it('retombe sur 0 étoile quand stars est absent', () => {
    const avis = { ...base, stars: null as unknown as number }
    expect(mapAvis(avis).stars).toBe('☆☆☆☆☆')
  })

  it('clamp les étoiles entre 0 et 5', () => {
    expect(mapAvis({ ...base, stars: 9 }).stars).toBe('★★★★★')
    expect(mapAvis({ ...base, stars: -2 }).stars).toBe('☆☆☆☆☆')
  })

  it('omet la date quand published_at est absent ou invalide', () => {
    expect(mapAvis({ ...base, published_at: null }).author).toBe('Marie D.')
    expect(mapAvis({ ...base, published_at: 'pas-une-date' }).author).toBe('Marie D.')
  })
})
