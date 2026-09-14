import { describe, expect, it } from 'vitest'
import {
  MODALITY_OPTIONS,
  DURATION_OPTIONS,
  CERTIFICATION_OPTIONS,
  getFilterLabel
} from '~/utils/catalog-filters'

describe('catalog-filters', () => {
  it('contains all modality options', () => {
    expect(MODALITY_OPTIONS.map((o) => o.key)).toEqual([
      'presentiel',
      'distanciel',
      'hybride',
      'intra',
      'inter'
    ])
  })

  it('contains all duration options', () => {
    expect(DURATION_OPTIONS.map((o) => o.key)).toEqual(['courte', 'moyenne', 'longue'])
  })

  it('contains all certification options', () => {
    expect(CERTIFICATION_OPTIONS.map((o) => o.key)).toEqual([
      'certification',
      'habilitation',
      'recyclage',
      'reglementaire'
    ])
  })

  it('returns modality and certification labels', () => {
    expect(getFilterLabel('modalities', 'presentiel')).toBe('Présentiel')
    expect(getFilterLabel('certifications', 'habilitation')).toBe('Habilitation')
  })

  it('returns the key itself when label is unknown', () => {
    expect(getFilterLabel('durations', 'unknown')).toBe('unknown')
  })

  it('returns location key as-is', () => {
    expect(getFilterLabel('location', 'Île-de-France')).toBe('Île-de-France')
  })
})
