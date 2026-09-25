import type { VariantProps } from 'class-variance-authority'
import { cva } from 'class-variance-authority'

export { default as NavigationMenu } from './NavigationMenu.vue'
export { default as NavigationMenuContent } from './NavigationMenuContent.vue'
export { default as NavigationMenuItem } from './NavigationMenuItem.vue'
export { default as NavigationMenuLink } from './NavigationMenuLink.vue'
export { default as NavigationMenuList } from './NavigationMenuList.vue'
export { default as NavigationMenuTrigger } from './NavigationMenuTrigger.vue'
export { default as NavigationMenuViewport } from './NavigationMenuViewport.vue'

export const navigationMenuTriggerStyle = cva(
  'group inline-flex w-max items-center justify-center transition-colors focus:outline-none disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'h-9 rounded-md px-4 py-2 text-sm font-medium',
        header:
          'mx-sm h-9 rounded-none border-b-2 border-transparent px-0 py-2 text-body font-semibold text-primary hover:text-accent-text data-[state=open]:border-accent'
      }
    },
    defaultVariants: {
      variant: 'default'
    }
  }
)

export type NavigationMenuTriggerVariants = VariantProps<typeof navigationMenuTriggerStyle>
