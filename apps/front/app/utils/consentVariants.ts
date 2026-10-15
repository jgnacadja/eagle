import { cva } from 'class-variance-authority'

/**
 * Surface claire/marine des contrôles de consentement — partagée entre
 * `ConsentField` et les formulaires affichés sur les deux contextes
 * (QuickCallbackCard…). Le `focus-visible:ring-ring` par défaut du
 * Checkbox reste visible dans les deux variantes ; `dark` n'en change
 * que la teinte.
 */
export type ConsentSurface = 'default' | 'dark'

export const consentCheckbox = cva('', {
  variants: {
    surface: {
      default: 'aria-invalid:border-danger',
      dark: 'border-outline-inverse focus-visible:ring-accent aria-invalid:border-danger-inverse data-[state=checked]:border-accent data-[state=checked]:bg-accent data-[state=checked]:text-ink'
    }
  },
  defaultVariants: { surface: 'default' }
})

export const consentErrorText = cva('', {
  variants: {
    surface: {
      default: 'text-danger',
      dark: 'text-danger-inverse'
    }
  },
  defaultVariants: { surface: 'default' }
})

export const consentLabelMuted = cva('', {
  variants: {
    surface: {
      default: '',
      dark: 'text-ink-inverse-muted'
    }
  },
  defaultVariants: { surface: 'default' }
})
