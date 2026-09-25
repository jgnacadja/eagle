import { describe, expect, it } from 'vitest'
import { placesLabel, sessionSeatType } from '~/utils/placesLabel'

describe('placesLabel', () => {
  it('affiche « Complet » quand il ne reste aucune place', () => {
    expect(placesLabel(0)).toBe('Complet')
    expect(placesLabel(0, false)).toBe('Complet')
  })

  it('accorde au singulier pour une seule place', () => {
    expect(placesLabel(1)).toBe('1 place disponible')
    expect(placesLabel(1, false)).toBe('1 place')
  })

  it('accorde au pluriel au-delà d’une place', () => {
    expect(placesLabel(5)).toBe('5 places disponibles')
    expect(placesLabel(2)).toBe('2 places disponibles')
  })

  it('produit un libellé court sans « disponibles » en mode compact', () => {
    expect(placesLabel(5, false)).toBe('5 places')
  })
})

describe('sessionSeatType', () => {
  it('retourne undefined quand le nombre de places est inconnu', () => {
    expect(sessionSeatType(undefined)).toBeUndefined()
  })

  it('retourne neutral quand la session est complète', () => {
    expect(sessionSeatType(0)).toBe('neutral')
  })

  it('retourne warning quand il reste peu de places (1 à 3)', () => {
    expect(sessionSeatType(1)).toBe('warning')
    expect(sessionSeatType(3)).toBe('warning')
  })

  it('retourne success au-delà de 3 places', () => {
    expect(sessionSeatType(4)).toBe('success')
    expect(sessionSeatType(20)).toBe('success')
  })
})
