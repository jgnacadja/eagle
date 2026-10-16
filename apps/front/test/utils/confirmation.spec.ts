import { describe, expect, it } from 'vitest'
import { CONFIRMATION_TYPES, confirmationFlagKey, isConfirmationPath } from '~/utils/confirmation'

describe('confirmation utils', () => {
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

  it('reconnaît les routes de confirmation connues', () => {
    for (const type of CONFIRMATION_TYPES) {
      expect(isConfirmationPath(`/confirmation/${type}`)).toBe(true)
    }
  })

  it('rejette les autres chemins, les types inconnus et les sous-routes', () => {
    expect(isConfirmationPath('/')).toBe(false)
    expect(isConfirmationPath('/formations')).toBe(false)
    expect(isConfirmationPath('/confirmation')).toBe(false)
    expect(isConfirmationPath('/confirmation/inconnu')).toBe(false)
    expect(isConfirmationPath('/confirmation/devis/extra')).toBe(false)
  })
})
