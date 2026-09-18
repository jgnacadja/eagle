import type { VariantProps } from 'class-variance-authority'
import { cva } from 'class-variance-authority'

export { default as Card } from './Card.vue'
export { default as CardContent } from './CardContent.vue'
export { default as CardDescription } from './CardDescription.vue'
export { default as CardFooter } from './CardFooter.vue'
export { default as CardHeader } from './CardHeader.vue'
export { default as CardTitle } from './CardTitle.vue'

export const cardVariants = cva('rounded-md border shadow-sm', {
  variants: {
    variant: {
      default: 'bg-card text-card-foreground',
      surface: 'bg-surface',
      panel: 'border-rule bg-surface shadow-none',
      dark: 'border-transparent bg-primary-dark text-paper',
      paper: 'bg-paper'
    }
  },
  defaultVariants: {
    variant: 'default'
  }
})

export type CardVariants = VariantProps<typeof cardVariants>
