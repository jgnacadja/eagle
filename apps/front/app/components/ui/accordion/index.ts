import type { VariantProps } from 'class-variance-authority'
import { cva } from 'class-variance-authority'

export { default as Accordion } from './Accordion.vue'
export { default as AccordionContent } from './AccordionContent.vue'
export { default as AccordionItem } from './AccordionItem.vue'
export { default as AccordionTrigger } from './AccordionTrigger.vue'

export const accordionTriggerVariants = cva(
  'flex flex-1 items-center justify-between transition-all hover:text-accent-text [&[data-state=open]>svg]:rotate-180',
  {
    variants: {
      variant: {
        default: 'py-4 text-sm font-medium',
        menu: 'py-md text-h3 text-ink',
        submenu:
          'px-3 py-2 text-body text-primary data-[state=open]:font-bold data-[state=open]:text-ink',
        panel:
          'w-full rounded-lg border border-rule bg-surface px-lg py-md text-xs font-semibold uppercase tracking-wide text-ink'
      }
    },
    defaultVariants: {
      variant: 'default'
    }
  }
)

export type AccordionTriggerVariants = VariantProps<typeof accordionTriggerVariants>

export const accordionItemVariants = cva('', {
  variants: {
    variant: {
      default: 'border-b border-rule',
      menu: 'border-b-0',
      submenu: 'my-2 rounded-md border-b-0 transition-colors data-[state=open]:bg-surface'
    }
  },
  defaultVariants: {
    variant: 'default'
  }
})

export type AccordionItemVariants = VariantProps<typeof accordionItemVariants>
