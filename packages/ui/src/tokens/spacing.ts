/**
 * Espacements — charte §07 « Rythme constant ». Base 4 px.
 * Figma : `item spacing/*`.
 */
export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  '2xl': '48px',
  '3xl': '56px',
  '4xl': '64px'
} as const

/** Gabarits et contraintes de mise en page (charte §07). */
export const layout = {
  /** Gabarit desktop. */
  containerMax: '1280px',
  /** Largeur de lecture des textes longs (Figma `width/640`). */
  proseMax: '640px',
  /** Marges latérales desktop. */
  gutterDesktop: '48px',
  /** Marges latérales mobile (gabarit 390 px). */
  gutterMobile: '20px',
  /** Padding vertical des sections (52–62 px). */
  sectionY: '56px',
  /** Gap des grilles de cartes (3–4 colonnes). */
  gridGap: '16px',
  /** Cible tactile minimale. */
  touchTarget: '44px',
  /** Hauteur des boutons (48–52 px) et du bouton icône. */
  controlHeight: '48px',
  /** Hauteur des petites pastilles (étapes numérotées, 36 px). */
  controlHeightSm: '36px'
} as const
