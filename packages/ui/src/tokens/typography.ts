/**
 * Typographie — charte §03 : Figtree, une seule famille (Google Fonts,
 * graisses 400 à 800), repli sans-serif système. Les titres serrent leur
 * interlettrage (-0.01 à -0.02 em), les surtitres l'ouvrent (+0.09 à +0.11 em).
 */
export const typography = {
  fontFamily: {
    display: ['Figtree', 'sans-serif'],
    sans: ['Figtree', 'sans-serif'],
    mono: ['ui-monospace', 'monospace']
  },
  /** À déclarer dans le `<head>`, précédé des preconnect fonts.googleapis.com / fonts.gstatic.com. */
  googleFontsUrl:
    'https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700;800&display=swap',
  fontWeight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800'
  },
  /**
   * Échelle de texte (taille / interligne / interlettrage / graisse).
   * Figma : `font size/*`, `line height/*`, `letter spacing/*`, `font weight/*`.
   */
  scale: {
    /** H1 hero · 800 · 46/1.1 · -.02em */
    hero: { fontSize: '46px', lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '800' },
    /** H1 page · 800 · 40/1.1 · -.02em */
    h1: { fontSize: '40px', lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '800' },
    /** H2 section · 800 · 26–27/1.2 · -.012em */
    h2: { fontSize: '26px', lineHeight: '1.2', letterSpacing: '-0.012em', fontWeight: '800' },
    /** H3 carte · 800 · 18/1.25 · +.01em */
    h3: { fontSize: '18px', lineHeight: '1.25', letterSpacing: '0.01em', fontWeight: '800' },
    /** Titre de carte catalogue · 700 · 16/1.3 */
    h4: { fontSize: '16px', lineHeight: '1.3', letterSpacing: '0', fontWeight: '700' },
    /** Surtitre · 800 · 11/1 · +.11em · ambre texte */
    overline: { fontSize: '11px', lineHeight: '1', letterSpacing: '0.11em', fontWeight: '800' },
    /** Chapeau hero · 400 · 15.5/1.55 */
    lead: { fontSize: '15.5px', lineHeight: '1.55', letterSpacing: '0', fontWeight: '400' },
    /** Corps · 400 · 14.5/1.55 · ink.muted */
    body: { fontSize: '14.5px', lineHeight: '1.55', letterSpacing: '0', fontWeight: '400' },
    /** Corps réduit · 400 · 13/1.5 */
    small: { fontSize: '13.5px', lineHeight: '1.5', letterSpacing: '0', fontWeight: '400' },
    /** Méta · 500 · 12.5/1 · ink.subtle */
    meta: { fontSize: '12.5px', lineHeight: '1', letterSpacing: '0', fontWeight: '500' },
    /** Libellé de bouton · 700 · 15/1 */
    button: { fontSize: '15px', lineHeight: '1', letterSpacing: '0', fontWeight: '700' },
    /** Badge d'état · 700 · 11.5/1 */
    badge: { fontSize: '12px', lineHeight: '1', letterSpacing: '0', fontWeight: '700' }
  }
} as const
