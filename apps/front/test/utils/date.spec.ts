import { describe, expect, it } from 'vitest'
import { formatDateFr, formatMonthYearFr, upcomingMonthLabelsFr } from '~/utils/date'

describe('date utils', () => {
  describe('formatDateFr', () => {
    it('formate une date complète en français', () => {
      expect(formatDateFr('2026-03-14T09:00:00Z')).toBe('14 mars 2026')
    })

    it('retourne « Date à préciser » quand la valeur est absente ou invalide', () => {
      expect(formatDateFr(null)).toBe('Date à préciser')
      expect(formatDateFr(undefined)).toBe('Date à préciser')
      expect(formatDateFr('pas-une-date')).toBe('Date à préciser')
    })
  })

  describe('formatMonthYearFr', () => {
    it('formate en « mois année »', () => {
      expect(formatMonthYearFr('2026-04-20T09:00:00+00:00')).toBe('avril 2026')
    })

    it('retourne une chaîne vide quand la valeur est absente ou invalide', () => {
      expect(formatMonthYearFr(null)).toBe('')
      expect(formatMonthYearFr(undefined)).toBe('')
      expect(formatMonthYearFr('pas-une-date')).toBe('')
    })
  })

  describe('upcomingMonthLabelsFr', () => {
    it('liste le mois courant et les suivants, capitalisés', () => {
      expect(upcomingMonthLabelsFr(3, new Date(2026, 9, 15))).toEqual([
        'Octobre 2026',
        'Novembre 2026',
        'Décembre 2026'
      ])
    })

    it('enchaîne sur l’année suivante en fin d’année', () => {
      expect(upcomingMonthLabelsFr(3, new Date(2026, 11, 20))).toEqual([
        'Décembre 2026',
        'Janvier 2027',
        'Février 2027'
      ])
    })

    it('ne retourne jamais un mois passé', () => {
      const labels = upcomingMonthLabelsFr(3, new Date(2027, 0, 31))
      expect(labels[0]).toBe('Janvier 2027')
      expect(labels).not.toContain('Décembre 2026')
    })
  })
})
