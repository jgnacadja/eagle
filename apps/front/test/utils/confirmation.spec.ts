import { describe, expect, it } from 'vitest'
import { CONFIRMATION_TYPES, confirmationFlagKey } from '~/utils/confirmation'

describe('confirmation utils (ST-30)', () => {
  it('expose les quatre types de conversion du plan de tracking', () => {
    expect(CONFIRMATION_TYPES).toEqual(['devis', 'rendez-vous', 'inscription', 'candidature'])
  })

  it('construit une clé sessionStorage dédiée par type', () => {
    for (const type of CONFIRMATION_TYPES) {
      expect(confirmationFlagKey(type)).toBe(`learnup:confirmation:${type}`)
    }
    expect(new Set(CONFIRMATION_TYPES.map(confirmationFlagKey)).size).toBe(
      CONFIRMATION_TYPES.length
    )
  })
})
