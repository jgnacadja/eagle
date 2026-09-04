import type { Config } from 'tailwindcss'
import { breakpoints, colors, layout, radii, shadows, spacing, typography } from '@learnup/ui'
import tailwindcssAnimate from 'tailwindcss-animate'

/**
 * Toute valeur de style vient de @learnup/ui — rien n'est écrit en dur ici.
 * Les noms exposés à Tailwind sont stables : le re-skin charte v1.0 (ST-13)
 * n'a modifié que les valeurs, pas les classes consommées par les composants.
 */
const fontSize = Object.fromEntries(
  Object.entries(typography.scale).map(([name, style]) => [
    name,
    [
      style.fontSize,
      {
        lineHeight: style.lineHeight,
        letterSpacing: style.letterSpacing,
        fontWeight: style.fontWeight
      }
    ]
  ])
) satisfies NonNullable<NonNullable<Config['theme']>['extend']>['fontSize']

const shadcnColors = {
  background: colors.surface,
  foreground: colors.ink.default,
  primary: {
    ...colors.primary,
    foreground: colors.paper
  },
  secondary: {
    DEFAULT: colors.surfaceAlt,
    foreground: colors.ink.default
  },
  muted: {
    DEFAULT: colors.surfaceAlt,
    foreground: colors.ink.muted
  },
  accent: {
    ...colors.accent,
    foreground: colors.ink.default
  },
  destructive: {
    DEFAULT: colors.danger.default,
    foreground: colors.paper
  },
  border: colors.rule,
  input: colors.outline,
  ring: colors.primary.default,
  card: {
    DEFAULT: colors.paper,
    foreground: colors.ink.default
  },
  popover: {
    DEFAULT: colors.paper,
    foreground: colors.ink.default
  },
  success: {
    ...colors.success,
    foreground: colors.paper
  },
  warning: {
    ...colors.warning,
    foreground: colors.paper
  },
  info: {
    ...colors.info,
    foreground: colors.paper
  }
} satisfies NonNullable<NonNullable<Config['theme']>['extend']>['colors']

const config: Config = {
  content: [
    './app/components/**/*.{vue,ts}',
    './app/layouts/**/*.{vue,ts}',
    './app/pages/**/*.{vue,ts}',
    './app/app.vue',
    './app/error.vue',
    './nuxt.config.{ts,js}'
  ],
  theme: {
    screens: { ...breakpoints },
    extend: {
      colors: {
        ...shadcnColors,
        ink: {
          DEFAULT: colors.ink.default,
          body: colors.ink.body,
          muted: colors.ink.muted,
          subtle: colors.ink.subtle,
          placeholder: colors.ink.placeholder,
          inverse: colors.ink.inverse,
          'inverse-muted': colors.ink.inverseMuted
        },
        paper: colors.paper,
        surface: { DEFAULT: colors.surface, alt: colors.surfaceAlt },
        rule: { DEFAULT: colors.rule, strong: colors.ruleStrong },
        outline: {
          DEFAULT: colors.outline,
          soft: colors.outlineSoft,
          inverse: colors.outlineInverse
        },
        danger: { DEFAULT: colors.danger.default, soft: colors.danger.soft }
      },
      fontFamily: {
        display: [...typography.fontFamily.display],
        sans: [...typography.fontFamily.sans],
        mono: [...typography.fontFamily.mono]
      },
      fontSize,
      fontWeight: { ...typography.fontWeight },
      spacing: {
        ...spacing,
        gutter: layout.gutterDesktop,
        'gutter-mobile': layout.gutterMobile,
        section: layout.sectionY,
        touch: layout.touchTarget,
        control: layout.controlHeight,
        'control-sm': layout.controlHeightSm
      },
      maxWidth: {
        container: layout.containerMax,
        prose: layout.proseMax
      },
      gap: { grid: layout.gridGap },
      borderRadius: { ...radii },
      boxShadow: {
        ...shadows,
        xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)'
      },
      ringWidth: {
        0: '0px',
        1: '1px',
        2: '2px',
        3: '3px',
        4: '4px',
        8: '8px',
        DEFAULT: '3px'
      }
    }
  },
  plugins: [tailwindcssAnimate]
}

export default config
