import { describe, expect, it } from 'vitest'
import { densestClusterCenter, distanceKm, formatDistance } from '~/utils/geo'

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

    it('retourne la distance brute, sans arrondi à une décimale', () => {
      const paris = { lat: 48.8566, lng: 2.3522 }
      const versailles = { lat: 48.8014, lng: 2.1301 }
      expect(distanceKm(paris, versailles) % 0.1).not.toBe(0)
    })
  })

  describe('formatDistance', () => {
    it('affiche une distance inférieure à 1 km en mètres', () => {
      expect(formatDistance(0.75)).toBe('750 m')
      expect(formatDistance(0)).toBe('0 m')
      // Frontière : une distance brute juste sous 1 km reste en mètres.
      expect(formatDistance(0.96)).toBe('960 m')
    })

    it('n’arrondit pas la distance avant le choix d’unité', () => {
      // ≈ 0,96 km au nord de Paris : doit s'afficher en mètres, pas « 1,0 km ».
      const a = { lat: 48.8566, lng: 2.3522 }
      const b = { lat: 48.8652, lng: 2.3522 }
      expect(formatDistance(distanceKm(a, b))).toMatch(/^\d{3} m$/)
    })

    it('affiche une distance supérieure ou égale à 1 km en kilomètres', () => {
      expect(formatDistance(1)).toBe('1,0 km')
      expect(formatDistance(12.35)).toBe('12,4 km')
      expect(formatDistance(392)).toBe('392,0 km')
    })
  })

  describe('densestClusterCenter', () => {
    it('retourne null sans point', () => {
      expect(densestClusterCenter([])).toBeNull()
    })

    it('retourne le point lui-même quand il est seul', () => {
      const paris = { lat: 48.8566, lng: 2.3522 }
      expect(densestClusterCenter([paris])).toEqual(paris)
    })

    it('retourne le centroïde du groupe le plus dense', () => {
      // 3 centres en petite couronne + un isolé à Lyon : le centroïde doit
      // rester dans le groupe parisien.
      const points = [
        { lat: 48.7909, lng: 2.4534 }, // Créteil
        { lat: 48.7938, lng: 2.3899 }, // Vitry
        { lat: 48.8566, lng: 2.3522 }, // Paris
        { lat: 45.764, lng: 4.8357 } // Lyon
      ]
      const center = densestClusterCenter(points)!
      expect(center.lat).toBeCloseTo(48.8138, 3)
      expect(center.lng).toBeCloseTo(2.3985, 3)
    })

    it('isole le groupe majoritaire quand les points sont éclatés', () => {
      const points = [
        { lat: 45.764, lng: 4.8357 }, // Lyon
        { lat: 43.2965, lng: 5.3698 } // Marseille
      ]
      // Groupes ex æquo : le premier gagne — centroïde du point seul.
      const center = densestClusterCenter(points)!
      expect(center).toEqual(points[0])
    })
  })
})
