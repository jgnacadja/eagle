import { describe, expect, it } from 'vitest'
import { formatRegionLabel } from '~/utils/region'

describe('formatRegionLabel', () => {
  it('mappe un slug connu vers son libellé', () => {
    expect(formatRegionLabel('ile-de-france')).toBe('Île-de-France')
    expect(formatRegionLabel('paca')).toBe('Provence-Alpes-Côte d’Azur')
  })

  it('normalise une valeur accentuée ou en variante de casse', () => {
    expect(formatRegionLabel('Île-de-France')).toBe('Île-de-France')
    expect(formatRegionLabel('ILE DE FRANCE')).toBe('Île-de-France')
  })

  it('humanise une région inconnue', () => {
    expect(formatRegionLabel('corse-du-sud')).toBe('Corse Du Sud')
  })
})
