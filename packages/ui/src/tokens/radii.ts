/**
 * Rayons — charte §07 : 16 px cartes, 10 px images, 999 px pilules.
 * Figma : `radius/sm` 8, `corner radius/10`, `radius/md` 16, `radius/lg` 28,
 * `corner radius/999`.
 */
export const radii = {
  /** Figma `radius/sm` — petits éléments (tags carrés, réserves internes). */
  xs: '8px',
  /** Figma `corner radius/10` — images dans les cartes. */
  sm: '10px',
  /** Figma `radius/md` — cartes, blocs de section. */
  md: '16px',
  /** Figma `radius/lg` — grands panneaux immersifs. */
  lg: '28px',
  /** Figma `corner radius/999` — pilules : boutons, badges, champ de recherche. */
  full: '999px'
} as const
