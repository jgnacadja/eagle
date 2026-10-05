import { describe, expect, it } from 'vitest'
import type { Centre } from '@learnup/types'
import { centreLocationLabel, toCenterResults } from '~/utils/centre'

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
        city: 'Créteil',
        department: 'Val-de-Marne',
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
    expect(result!.address).toBe('')
    expect(result!.cp).toBe('')
    expect(result!.tags).toBe('')
    expect(result!.lat).toBeUndefined()
    expect(result!.lng).toBeUndefined()
  })

  it('renvoie un tableau vide sans données', () => {
    expect(toCenterResults(null)).toEqual([])
    expect(toCenterResults(undefined)).toEqual([])
    expect(toCenterResults([])).toEqual([])
  })

  it('retire la localité collée dans le champ address', () => {
    const [result] = toCenterResults([
      centre({ address: '12 rue de Paris, 94000, Créteil, France' })
    ])
    expect(result!.address).toBe('12 rue de Paris, 94000, Créteil, Val-de-Marne')
  })
})

describe('centreLocationLabel', () => {
  it('compose « Ville · Département (code) » depuis les champs structurés', () => {
    const [center] = toCenterResults([centre()])
    expect(centreLocationLabel(center!)).toBe('Créteil · Val-de-Marne (94)')
  })

  it('omet le code si le code postal est absent', () => {
    const [center] = toCenterResults([centre({ postal_code: null })])
    expect(centreLocationLabel(center!)).toBe('Créteil · Val-de-Marne')
  })

  it('retombe sur le dernier segment de address sans champs structurés', () => {
    expect(
      centreLocationLabel({
        id: 'x',
        name: 'x',
        cp: '',
        address: '14 rue des Refuzniks, Créteil · Val-de-Marne',
        tags: '',
        tagsShort: ''
      })
    ).toBe('Val-de-Marne')
  })
})
