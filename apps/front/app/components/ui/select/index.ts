import type { VariantProps } from 'class-variance-authority'
import { cva } from 'class-variance-authority'

export { default as Select } from './Select.vue'
export { default as SelectContent } from './SelectContent.vue'
export { default as SelectGroup } from './SelectGroup.vue'
export { default as SelectItem } from './SelectItem.vue'
export { default as SelectItemText } from './SelectItemText.vue'
export { default as SelectLabel } from './SelectLabel.vue'
export { default as SelectScrollDownButton } from './SelectScrollDownButton.vue'
export { default as SelectScrollUpButton } from './SelectScrollUpButton.vue'
export { default as SelectSeparator } from './SelectSeparator.vue'
export { default as SelectTrigger } from './SelectTrigger.vue'
export { default as SelectValue } from './SelectValue.vue'

export const selectTriggerVariants = cva(
  'flex items-center justify-between whitespace-nowrap text-start ring-offset-background data-placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 [&>span]:truncate',
  {
    variants: {
      variant: {
        default:
          'h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:ring-1 focus:ring-ring',
        pill: 'h-control w-auto gap-sm rounded-full border border-outline bg-paper px-md text-small font-semibold text-ink-body shadow-none',
        'pill-auto':
          'h-auto w-auto gap-sm rounded-full border border-outline bg-paper px-md py-sm text-small text-ink-body shadow-none',
        field:
          'h-control w-full rounded-full border border-outline bg-paper px-md text-small text-ink-body shadow-none focus:ring-1 focus:ring-ring',
        'field-lg':
          'h-control w-full rounded-full border border-outline bg-paper px-lg text-small font-medium text-ink focus:ring-1 focus:ring-outline',
        surface:
          'h-control w-full rounded-lg border border-rule bg-surface px-lg text-small font-medium text-ink shadow-sm focus:ring-2 focus:ring-accent',
        inverse:
          'h-control w-full rounded-full border border-outline-inverse bg-transparent px-lg text-small font-semibold text-paper focus:ring-1 focus:ring-paper'
      }
    },
    defaultVariants: {
      variant: 'default'
    }
  }
)

export type SelectTriggerVariants = VariantProps<typeof selectTriggerVariants>
