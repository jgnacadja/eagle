import type { Config } from 'tailwindcss'
import { breakpoints, colors, layout, radii, shadows, spacing, typography } from '@learnup/ui'

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
        primary: {
          DEFAULT: colors.primary.default,
          dark: colors.primary.dark,
          soft: colors.primary.soft
        },
        accent: {
          DEFAULT: colors.accent.default,
          text: colors.accent.text,
          soft: colors.accent.soft
        },
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
        success: { DEFAULT: colors.success.default, soft: colors.success.soft },
        warning: { DEFAULT: colors.warning.default, soft: colors.warning.soft },
        danger: { DEFAULT: colors.danger.default, soft: colors.danger.soft },
        info: { DEFAULT: colors.info.default, soft: colors.info.soft }
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
        control: layout.controlHeight
      },
      maxWidth: {
        container: layout.containerMax,
        prose: layout.proseMax
      },
      gap: { grid: layout.gridGap },
      borderRadius: { ...radii },
      boxShadow: { ...shadows }
    }
  }
}

export default config
