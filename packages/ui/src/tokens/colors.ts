/**
 * Palette LEARN UP ACADEMY — charte graphique v1.0 (septembre 2026), thème
 * « bleu marine & ambre » validé (passe 9a). Source : Claude Design
 * « Charte standalone-src.html » / Figma « Website » (node 8-4994).
 *
 * Répartition cible : blanc & fonds clairs ~62 % · marines ~30 % · ambre ~8 %.
 * L'ambre reste rare : un seul CTA ambre visible par écran. Vert et orangé ne
 * servent qu'aux états (disponibilité, échéance), jamais en décoration.
 *
 * Mapping Figma → token → usage : voir README.md.
 */
export const colors = {
  /** Marines — réassurance institutionnelle. */
  navy: {
    /** Figma `color/azure/18` (Bunting) — titres, footer, bandeau chiffres. */
    deep: '#14264a',
    /** Figma `color/azure/27` (Biscay) — boutons, liens, bordures actives. */
    primary: '#1e3a6e',
    /** Figma `color/azure/32` (San Juan) — blocs immersifs. */
    muted: '#2e4a76',
    /** Figma `color/azure/36` (Chambray) — cartes sur fond marine. */
    card: '#395680'
  },
  /** Alias sémantique consommé par Tailwind (`bg-primary`, `text-primary`…). */
  primary: {
    default: '#1e3a6e',
    dark: '#14264a',
    soft: '#edf2fa'
  },
  /** Ambre — guide l'action. */
  accent: {
    /** Figma `color/orange/56` (Fuel Yellow) — CTA principal, étoiles, étincelle IA. */
    default: '#f0a030',
    /** Figma `color/orange/38` (Pumpkin Skin) — surtitres, liens ambre sur blanc. */
    text: '#b4700f',
    /** Figma `color/orange/56 16%` — fond de badge échéance. */
    soft: 'rgb(240 160 48 / 16%)'
  },
  /** Textes. */
  ink: {
    /** Figma `color/azure/18` — titres et texte principal. */
    default: '#14264a',
    /** Figma `Fiord` — corps de texte long sur blanc. */
    body: '#44526b',
    /** Figma `color/azure/44` (Blue Bayoux) — texte secondaire, corps 14–15 px. */
    muted: '#5a6b85',
    /** Figma `color/azure/60` (Regent Gray) — méta ; AA « texte large » seulement, voir README. */
    subtle: '#8a94a8',
    /** Figma `color/azure/49` (Slate Gray) — placeholders de champs. */
    placeholder: '#6b7890',
    /** Texte sur fond marine. */
    inverse: '#ffffff',
    /** Figma `color/white/ 72%` — texte secondaire sur fond marine. */
    inverseMuted: 'rgb(255 255 255 / 72%)'
  },
  /** Fond blanc — cartes catalogue, header. */
  paper: '#ffffff',
  /** Figma `color/grey/97` — fond de section bleuté, cartes profil. */
  surface: '#f4f7fc',
  /** Figma `color/grey/95` (Link Water) — réserves images. */
  surfaceAlt: '#edf2fa',
  /** Figma `color/azure/20 12%` (Blue Zodiac 12%) — bordures de cartes et séparateurs. */
  rule: 'rgb(20 42 82 / 12%)',
  /** Figma `color/azure/20 15%` — bordures appuyées (barre 62/30/8). */
  ruleStrong: 'rgb(20 42 82 / 15%)',
  /** Figma `color/azure/27 45%` (Biscay 45%) — contour du bouton tertiaire. */
  outline: 'rgb(30 58 110 / 45%)',
  /** Figma `color/azure/27 30%` (Biscay 30%) — contour des champs au repos. */
  outlineSoft: 'rgb(30 58 110 / 30%)',
  /** Figma `color/white/ 40%` — contour des pilules sur fond marine. */
  outlineInverse: 'rgb(255 255 255 / 40%)',

  /** Sémantiques — états uniquement. */
  success: {
    /** Figma `color/spring green/34` (Sea Green) — disponibilité, étape finale. */
    default: '#2e7d5b',
    /** Figma `color/spring green/34 12%`. */
    soft: 'rgb(46 125 91 / 12%)'
  },
  warning: {
    /** Échéance / prochaine session — même ambre texte que les surtitres. */
    default: '#b4700f',
    soft: 'rgb(240 160 48 / 16%)'
  },
  danger: {
    /** Charte §01 — pictogramme « ✗ » des interdits. */
    default: '#b03a2e',
    soft: 'rgb(176 58 46 / 10%)'
  },
  info: {
    default: '#1e3a6e',
    soft: '#edf2fa'
  }
} as const
