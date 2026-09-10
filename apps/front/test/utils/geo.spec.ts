import { describe, expect, it } from 'vitest'
import { distanceKm, formatDistance } from '~/utils/geo'

describe('geo', () => {
  describe('distanceKm', () => {
    it('retourne 0 km entre un point et lui-même', () => {
      const paris = { lat: 48.8566, lng: 2.3522 }
      expect(distanceKm(paris, paris)).toBe(0)
    })

    it('approxime correctement la distance Paris – Lyon', () => {
      const paris = { lat: 48.8566, lng: 2.3522 }
      const lyon = { lat: 45.764, lng: 4.8357 }
      const d = distanceKm(paris, lyon)
      // Distance réelle ~ 392 km ; tolérance de 5 %.
      expect(d).toBeGreaterThan(370)
      expect(d).toBeLessThan(410)
    })

    it('approxime correctement la distance Paris – Nantes', () => {
      const paris = { lat: 48.8566, lng: 2.3522 }
      const nantes = { lat: 47.2184, lng: -1.5536 }
      const d = distanceKm(paris, nantes)
      expect(d).toBeGreaterThan(320)
      expect(d).toBeLessThan(360)
    })
  })

  describe('formatDistance', () => {
    it('affiche une distance inférieure à 1 km en mètres', () => {
      expect(formatDistance(0.75)).toBe('750 m')
      expect(formatDistance(0)).toBe('0 m')
    })

    it('affiche une distance supérieure ou égale à 1 km en kilomètres', () => {
      expect(formatDistance(1)).toBe('1,0 km')
      expect(formatDistance(12.35)).toBe('12,4 km')
      expect(formatDistance(392)).toBe('392,0 km')
    })
  })
})
