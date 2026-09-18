<template>
  <PaginationNext
    data-slot="pagination-next"
    :class="cn(buttonVariants({ variant, size }), props.class)"
    v-bind="forwarded"
  >
    <slot>
      <IconChevronRight :size="16" />
    </slot>
  </PaginationNext>
</template>

<script setup lang="ts">
import type { PaginationNextProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import type { ButtonVariants } from '@/components/ui/button'
import { reactiveOmit } from '@vueuse/core'
import { PaginationNext, useForwardProps } from 'reka-ui'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import IconChevronRight from '@/components/icons/IconChevronRight.vue'

const props = withDefaults(
  defineProps<
    PaginationNextProps & {
      variant?: ButtonVariants['variant']
      size?: ButtonVariants['size']
      class?: HTMLAttributes['class']
    }
  >(),
  {
    variant: 'ghost',
    size: 'default',
    class: undefined
  }
)

const delegatedProps = reactiveOmit(props, 'class', 'variant', 'size')
const forwarded = useForwardProps(delegatedProps)
</script>
