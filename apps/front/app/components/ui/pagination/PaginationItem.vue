<template>
  <PaginationListItem
    data-slot="pagination-item"
    v-bind="delegatedProps"
    :class="
      cn(
        buttonVariants({ variant: isActive ? 'default' : variant, size: 'icon-sm' }),
        'cursor-pointer text-small font-semibold',
        !isActive && 'text-ink-body hover:text-accent-text',
        !isActive && variant === 'ghost' && 'hover:bg-transparent',
        props.class
      )
    "
  >
    <slot />
  </PaginationListItem>
</template>

<script setup lang="ts">
import type { PaginationListItemProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import type { ButtonVariants } from '@/components/ui/button'
import { reactiveOmit } from '@vueuse/core'
import { PaginationListItem } from 'reka-ui'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'

const props = withDefaults(
  defineProps<
    PaginationListItemProps & {
      variant?: ButtonVariants['variant']
      class?: HTMLAttributes['class']
      isActive?: boolean
    }
  >(),
  {
    variant: 'ghost',
    class: undefined
  }
)

const delegatedProps = reactiveOmit(props, 'class', 'variant', 'isActive')
</script>
