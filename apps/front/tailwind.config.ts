import type { Config } from 'tailwindcss'
import { colors, radii, shadows, typography } from '@learnup/ui'

const config: Config = {
  content: [
    './app/components/**/*.{vue,ts}',
    './app/layouts/**/*.{vue,ts}',
    './app/pages/**/*.{vue,ts}',
    './app/app.vue',
    './nuxt.config.{ts,js}'
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: colors.primary.default,
          dark: colors.primary.dark,
          soft: colors.primary.soft
        },
        ink: {
          DEFAULT: colors.ink.default,
          muted: colors.ink.muted
        },
        danger: colors.danger.default,
        surface: colors.surface,
        paper: colors.paper,
        rule: colors.rule
      },
      fontFamily: {
        display: [...typography.fontFamily.display],
        sans: [...typography.fontFamily.sans],
        mono: [...typography.fontFamily.mono]
      },
      borderRadius: {
        sm: radii.sm,
        md: radii.md,
        lg: radii.lg
      },
      boxShadow: {
        sm: shadows.sm,
        md: shadows.md
      }
    }
  }
}

export default config
