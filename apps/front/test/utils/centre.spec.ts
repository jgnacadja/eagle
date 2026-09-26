import { describe, expect, it } from 'vitest'
import type { Centre } from '@learnup/types'
import { toCenterResults } from '~/utils/centre'

const centre = (overrides: Partial<Centre> = {}): Centre =>
  ({
    slug: 'creteil',
    name: 'Centre de Créteil',
    address: '12 rue de Paris',
    postal_code: '94000',
    city: 'Créteil',
    department: 'Val-de-Marne',
    specialties: ['CACES', 'SST'],
    latitude: 48.78,
    longitude: 2.45,
    ...overrides
  }) as Centre

describe('toCenterResults', () => {
  it('mappe un centre vers la forme attendue par la carte', () => {
    expect(toCenterResults([centre()])).toEqual([
      {
        id: 'creteil',
        name: 'Centre de Créteil',
        cp: '94000',
        address: '12 rue de Paris, 94000, Créteil, Val-de-Marne',
        tags: 'CACES · SST',
        tagsShort: 'CACES · SST',
        lat: 48.78,
        lng: 2.45
      }
    ])
  })

  it('tolère les champs nuls', () => {
    const [result] = toCenterResults([
      centre({
        address: null,
        postal_code: null,
        city: null,
        department: null,
        specialties: null,
        latitude: null,
        longitude: null
      })
    ])
    expect(result.address).toBe('')
    expect(result.cp).toBe('')
    expect(result.tags).toBe('')
    expect(result.lat).toBeUndefined()
    expect(result.lng).toBeUndefined()
  })

  it('renvoie un tableau vide sans données', () => {
    expect(toCenterResults(null)).toEqual([])
    expect(toCenterResults(undefined)).toEqual([])
    expect(toCenterResults([])).toEqual([])
  })
})
