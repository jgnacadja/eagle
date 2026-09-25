<template>
  <PaginationEllipsis
    data-slot="pagination-ellipsis"
    v-bind="delegatedProps"
    :class="cn('flex size-9 items-center justify-center', props.class)"
  >
    <slot>
      <IconMoreHorizontal :size="16" />
      <span class="sr-only">Plus de pages</span>
    </slot>
  </PaginationEllipsis>
</template>

<script setup lang="ts">
import type { PaginationEllipsisProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { PaginationEllipsis } from 'reka-ui'
import { cn } from '@/lib/utils'
import IconMoreHorizontal from '@/components/icons/IconMoreHorizontal.vue'

const props = withDefaults(
  defineProps<PaginationEllipsisProps & { class?: HTMLAttributes['class'] }>(),
  {
    class: undefined
  }
)

const delegatedProps = reactiveOmit(props, 'class')
</script>
