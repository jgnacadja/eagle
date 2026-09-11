<template>
  <PaginationListItem
    data-slot="pagination-item"
    v-bind="delegatedProps"
    :class="
      cn(
        'flex h-control-sm w-control-sm cursor-pointer items-center justify-center rounded-full text-small font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50',
        isActive
          ? 'bg-primary text-paper'
          : 'text-ink-body transition-colors hover:text-accent-text',
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
import { reactiveOmit } from '@vueuse/core'
import { PaginationListItem } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = withDefaults(
  defineProps<
    PaginationListItemProps & {
      class?: HTMLAttributes['class']
      isActive?: boolean
    }
  >(),
  {
    class: undefined
  }
)

const delegatedProps = reactiveOmit(props, 'class', 'isActive')
</script>
