export const typography = {
  fontFamily: {
    display: ['Figtree', 'sans-serif'],
    sans: ['Figtree', 'sans-serif'],
    mono: ['ui-monospace', 'monospace']
  },
  googleFontsUrl:
    'https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700;800&display=swap',
  fontWeight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800'
  },
  scale: {
    hero: { fontSize: '46px', lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '800' },
    h1: { fontSize: '40px', lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '800' },
    h2: { fontSize: '26px', lineHeight: '1.2', letterSpacing: '-0.012em', fontWeight: '800' },
    h3: { fontSize: '18px', lineHeight: '1.25', letterSpacing: '0.01em', fontWeight: '800' },
    h4: { fontSize: '16px', lineHeight: '1.3', letterSpacing: '0', fontWeight: '700' },
    overline: { fontSize: '11px', lineHeight: '1', letterSpacing: '0.11em', fontWeight: '800' },
    lead: { fontSize: '15.5px', lineHeight: '1.55', letterSpacing: '0', fontWeight: '400' },
    body: { fontSize: '14.5px', lineHeight: '1.55', letterSpacing: '0', fontWeight: '400' },
    small: { fontSize: '13.5px', lineHeight: '1.5', letterSpacing: '0', fontWeight: '400' },
    meta: { fontSize: '12.5px', lineHeight: '1', letterSpacing: '0', fontWeight: '500' },
    button: { fontSize: '15px', lineHeight: '1', letterSpacing: '0', fontWeight: '700' },
    badge: { fontSize: '12px', lineHeight: '1', letterSpacing: '0', fontWeight: '700' }
  }
} as const
