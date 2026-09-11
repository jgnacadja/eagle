<template>
  <PaginationPrev
    data-slot="pagination-previous"
    :class="cn(buttonVariants({ variant: 'ghost', size }), props.class)"
    v-bind="forwarded"
  >
    <slot>
      <IconChevronLeft :size="16" />
    </slot>
  </PaginationPrev>
</template>

<script setup lang="ts">
import type { PaginationPrevProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import type { ButtonVariants } from '@/components/ui/button'
import { reactiveOmit } from '@vueuse/core'
import { PaginationPrev, useForwardProps } from 'reka-ui'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import IconChevronLeft from '@/components/icons/IconChevronLeft.vue'

const props = withDefaults(
  defineProps<
    PaginationPrevProps & {
      size?: ButtonVariants['size']
      class?: HTMLAttributes['class']
    }
  >(),
  {
    size: 'default',
    class: undefined
  }
)

const delegatedProps = reactiveOmit(props, 'class', 'size')
const forwarded = useForwardProps(delegatedProps)
</script>
