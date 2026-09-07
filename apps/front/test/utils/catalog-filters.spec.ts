import { describe, expect, it } from 'vitest'
import {
  MODALITY_OPTIONS,
  DURATION_OPTIONS,
  CERTIFICATION_OPTIONS,
  DURATION_BUCKETS,
  getFilterLabel,
  durationBucketToHours
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

  it('returns the correct duration buckets in hours', () => {
    expect(DURATION_BUCKETS.courte).toEqual({ min: 0, max: 8 })
    expect(DURATION_BUCKETS.moyenne).toEqual({ min: 9, max: 40 })
    expect(DURATION_BUCKETS.longue).toEqual({ min: 41 })
  })

  it('converts duration keys to min and max hours', () => {
    expect(durationBucketToHours(['courte'])).toEqual({ min: 0, max: 8 })
    expect(durationBucketToHours(['moyenne', 'longue'])).toEqual({ min: 9, max: 40 })
    expect(durationBucketToHours([])).toBeUndefined()
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
