import { describe, expect, it } from 'vitest'
import {
  renderPattern,
  resolveSeoDescription,
  resolveSeoTitle,
  truncateDescription,
  truncateTitle
} from '~/utils/metaPatterns'

describe('renderPattern', () => {
  it('substitue les variables présentes', () => {
    expect(
      renderPattern('Formation {intitulé} — {famille}', {
        intitulé: 'CACES R489',
        famille: 'Conduite'
      })
    ).toBe('Formation CACES R489 — Conduite')
  })

  it('absorbe le séparateur orphelin d’une variable vide', () => {
    expect(renderPattern('{intitulé} — {ville}', { intitulé: 'SST', ville: null })).toBe('SST')
    expect(renderPattern('{ville} — {intitulé}', { intitulé: 'SST', ville: undefined })).toBe(
      'SST'
    )
  })

  it('ne laisse ni accolades ni espaces doubles ni virgules orphelines', () => {
    const out = renderPattern('{intitulé} à {ville}, {département} ({code})', {
      intitulé: 'PRAP',
      ville: 'Lille'
    })
    expect(out).toBe('PRAP à Lille')
    expect(out).not.toMatch(/\{|\}| {2}|\(\)|,$/)
  })

  it('gère les variables accentuées et numériques', () => {
    expect(
      renderPattern('{catégorie} · {n} articles · {durée}', {
        catégorie: 'Sécurité',
        n: 12,
        durée: '2 jours'
      })
    ).toBe('Sécurité · 12 articles · 2 jours')
  })

  it('renvoie chaîne vide sur patron absent', () => {
    expect(renderPattern(null, { a: 'x' })).toBe('')
  })
})

describe('truncateTitle', () => {
  it('garde un titre ≤ 60 intact', () => {
    const t = 'CACES R489 — Conduite | LEARN UP ACADEMY'
    expect(truncateTitle(t)).toBe(t)
  })

  it('retire le suffixe de marque avant de tronquer', () => {
    const t = `${'A'.repeat(50)} | LEARN UP ACADEMY`
    expect(t.length).toBeGreaterThan(60)
    expect(truncateTitle(t)).toBe('A'.repeat(50))
  })

  it('tronque au mot avec … quand tout déborde', () => {
    const out = truncateTitle(`${'mot '.repeat(30)}fin`)
    expect(out.length).toBeLessThanOrEqual(60)
    expect(out.endsWith('…')).toBe(true)
    expect(out).not.toMatch(/ $|\s…/)
  })
})

describe('truncateDescription', () => {
  it('garde une description ≤ 160 intacte', () => {
    const d = 'Formation au travail en hauteur, centre de Lille.'
    expect(truncateDescription(d)).toBe(d)
  })

  it('coupe au mot sans espace ni ponctuation parasite avant …', () => {
    const d = `Session ${'inter entreprise '.repeat(20)}.`
    const out = truncateDescription(d)
    expect(out.length).toBeLessThanOrEqual(160)
    expect(out).not.toMatch(/[,;.!\s]…/)
    expect(out.endsWith('…')).toBe(true)
  })
})

describe('resolveSeo*', () => {
  const vars = { intitulé: 'SST' }

  it('explicite > patron > repli', () => {
    expect(resolveSeoTitle('Titre éditorial', '{intitulé} pat', vars, 'repli')).toBe(
      'Titre éditorial'
    )
    expect(resolveSeoTitle(null, '{intitulé} pat', vars, 'repli')).toBe('SST pat')
    expect(resolveSeoTitle(null, null, vars, 'repli')).toBe('repli')
    expect(resolveSeoTitle('  ', '{intitulé}', vars, 'repli')).toBe('SST')
  })

  it('applique les gardes 60/160 aussi à l’explicite', () => {
    const longTitle = `${'T'.repeat(70)}`
    expect(resolveSeoTitle(longTitle, null, vars, 'repli').length).toBeLessThanOrEqual(60)
    const longDesc = `${'d'.repeat(200)}`
    expect(resolveSeoDescription(longDesc, null, vars, 'repli').length).toBeLessThanOrEqual(
      160
    )
  })

  it('description : explicite > patron > repli', () => {
    expect(resolveSeoDescription(null, 'desc {intitulé}', vars, 'repli')).toBe('desc SST')
    expect(resolveSeoDescription(null, null, vars, 'repli')).toBe('repli')
  })
})
