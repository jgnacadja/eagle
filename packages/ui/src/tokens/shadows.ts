/**
 * Ombres — toujours teintées marine (rgb(20 42 82)), jamais noires.
 * La charte (§05) ne définit qu'une ombre forte pour la recherche IA :
 * 0 16 34 rgba(20,42,82,.13). Les deux paliers inférieurs en dérivent.
 */
export const shadows = {
  /** Cartes au repos. */
  sm: '0 1px 2px rgb(20 42 82 / 6%)',
  /** Cartes au survol. */
  md: '0 8px 20px rgb(20 42 82 / 10%)',
  /** Recherche IA, éléments flottants. */
  lg: '0 16px 34px rgb(20 42 82 / 13%)'
} as const
