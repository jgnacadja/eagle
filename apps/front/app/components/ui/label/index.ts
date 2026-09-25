import type { VariantProps } from 'class-variance-authority'
import { cva } from 'class-variance-authority'

export { default as Label } from './Label.vue'

export const labelVariants = cva(
  'leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
  {
    variants: {
      variant: {
        default: 'text-small font-medium text-ink',
        body: 'text-small font-normal text-ink-body',
        muted: 'text-small font-normal text-ink-muted'
      }
    },
    defaultVariants: {
      variant: 'default'
    }
  }
)

export type LabelVariants = VariantProps<typeof labelVariants>
