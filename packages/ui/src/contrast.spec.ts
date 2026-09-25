import { describe, expect, it } from 'vitest'
import { colors } from './tokens/index.js'

/**
 * Vérification RGAA / WCAG 2.1 AA des couples texte / fond de la charte
 * (critère 3.2 : 4.5:1 pour le texte courant, 3:1 pour le texte large —
 * ≥ 24 px, ou ≥ 18.66 px gras — et pour les composants d'interface, 3.3).
 *
 * Les couleurs semi-transparentes sont composées sur leur fond avant calcul,
 * comme le navigateur le fait au rendu.
 */
type Rgb = readonly [number, number, number]

function parseColor(value: string): { rgb: Rgb; alpha: number } {
  const hex = /^#([0-9a-f]{6})$/i.exec(value)
  if (hex) {
    const n = Number.parseInt(hex[1], 16)
    return { rgb: [(n >> 16) & 255, (n >> 8) & 255, n & 255], alpha: 1 }
  }
  const rgb = /^rgb\((\d+) (\d+) (\d+)(?: \/ (\d+)%)?\)$/.exec(value)
  if (!rgb) throw new Error(`Unsupported colour syntax: ${value}`)
  return {
    rgb: [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])],
    alpha: rgb[4] === undefined ? 1 : Number(rgb[4]) / 100
  }
}

function composite(foreground: string, background: Rgb): Rgb {
  const { rgb, alpha } = parseColor(foreground)
  return [0, 1, 2].map((i) => rgb[i] * alpha + background[i] * (1 - alpha)) as unknown as Rgb
}

function luminance([r, g, b]: Rgb): number {
  const channel = (c: number) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

/** Contrast ratio of `text` over `background`, both possibly translucent over `base`. */
export function contrast(text: string, background: string, base = colors.paper): number {
  const bg = composite(background, parseColor(base).rgb)
  const fg = composite(text, bg)
  const [l1, l2] = [luminance(fg), luminance(bg)].sort((a, b) => b - a)
  return (l1 + 0.05) / (l2 + 0.05)
}

const AA_TEXT = 4.5
const AA_LARGE = 3

type Pair = readonly [label: string, text: string, background: string, minimum: number]

/** Couples conformes : toute régression sous le seuil RGAA casse ce test. */
const compliant: readonly Pair[] = [
  ['titres marine sur blanc', colors.ink.default, colors.paper, AA_TEXT],
  ['titres marine sur fond bleuté', colors.ink.default, colors.surface, AA_TEXT],
  ['corps long sur blanc', colors.ink.body, colors.paper, AA_TEXT],
  ['texte secondaire sur blanc', colors.ink.muted, colors.paper, AA_TEXT],
  ['texte secondaire sur fond bleuté', colors.ink.muted, colors.surface, AA_TEXT],
  ['texte secondaire sur réserve image', colors.ink.muted, colors.surfaceAlt, AA_TEXT],
  ['lien marine sur blanc', colors.navy.primary, colors.paper, AA_TEXT],
  ['lien marine sur fond bleuté', colors.navy.primary, colors.surface, AA_TEXT],
  [
    'bouton secondaire — blanc sur marine primaire',
    colors.ink.inverse,
    colors.navy.primary,
    AA_TEXT
  ],
  ['footer — blanc sur marine profond', colors.ink.inverse, colors.navy.deep, AA_TEXT],
  ['bloc immersif — blanc sur marine atténué', colors.ink.inverse, colors.navy.muted, AA_TEXT],
  ['carte sur marine — blanc sur #395680', colors.ink.inverse, colors.navy.card, AA_TEXT],
  [
    'chapeau hero — blanc 72 % sur marine profond',
    colors.ink.inverseMuted,
    colors.navy.deep,
    AA_TEXT
  ],
  ['CTA principal — marine profond sur ambre', colors.navy.deep, colors.accent.default, AA_TEXT],
  ['succès sur blanc', colors.success.default, colors.paper, AA_TEXT],
  ['danger sur blanc', colors.danger.default, colors.paper, AA_TEXT],
  ['info sur fond info', colors.info.default, colors.info.soft, AA_TEXT],
  ['pastille d’étape — blanc sur vert', colors.ink.inverse, colors.success.default, AA_TEXT],
  ['pilule contour sur marine — blanc 40 %', colors.outlineInverse, colors.navy.deep, AA_LARGE]
]

/**
 * Écarts constatés sur la charte v1.0 : ces couples sont sous 4.5:1 en
 * rendu réel. Ils restent autorisés en texte large / composant (≥ 3:1) ou
 * sont à arbitrer avec LEARN UP PRIME — voir README « Contrastes ».
 * Le seuil ici fige la valeur mesurée pour détecter toute dégradation.
 */
const deviations: readonly Pair[] = [
  [
    'surtitre ambre texte sur blanc (3.99 — AA large seulement)',
    colors.accent.text,
    colors.paper,
    AA_LARGE
  ],
  ['méta gris sur blanc (3.05 — AA large seulement)', colors.ink.subtle, colors.paper, AA_LARGE],
  ['placeholder de champ sur blanc (4.45)', colors.ink.placeholder, colors.paper, AA_LARGE],
  [
    'badge disponibilité — vert sur vert 12 % (4.28)',
    colors.success.default,
    colors.success.soft,
    AA_LARGE
  ],
  [
    'badge échéance — ambre texte sur ambre 16 % (3.54)',
    colors.warning.default,
    colors.warning.soft,
    AA_LARGE
  ],
  ['contour bouton tertiaire (2.44 — < 3:1 composant)', colors.outline, colors.paper, 2.4],
  ['contour de champ au repos (1.76 — < 3:1 composant)', colors.outlineSoft, colors.paper, 1.7]
]

describe('contraste RGAA AA', () => {
  it.each(compliant)('%s ≥ %s:1', (_label, text, background, minimum) => {
    expect(contrast(text, background)).toBeGreaterThanOrEqual(minimum)
  })

  it.each(deviations)('écart documenté — %s', (_label, text, background, minimum) => {
    expect(contrast(text, background)).toBeGreaterThanOrEqual(minimum)
  })

  it('computes the WCAG reference ratios', () => {
    expect(contrast('#000000', '#FFFFFF')).toBeCloseTo(21, 5)
    expect(contrast('#FFFFFF', '#FFFFFF')).toBeCloseTo(1, 5)
    expect(contrast('rgb(0 0 0 / 50%)', '#FFFFFF')).toBeCloseTo(3.94, 1)
  })
})
