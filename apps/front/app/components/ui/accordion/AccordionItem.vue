<template>
  <AccordionItem
    v-bind="forwardedProps"
    :class="cn(accordionItemVariants({ variant }), props.class)"
  >
    <slot />
  </AccordionItem>
</template>

<script setup lang="ts">
import type { AccordionItemProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { AccordionItem, useForwardProps } from 'reka-ui'
import { cn } from '@/lib/utils'
import { accordionItemVariants, type AccordionItemVariants } from '.'

const props = withDefaults(
  defineProps<
    AccordionItemProps & {
      variant?: AccordionItemVariants['variant']
      class?: HTMLAttributes['class']
    }
  >(),
  { variant: 'default', class: undefined }
)

const delegatedProps = reactiveOmit(props, 'class', 'variant')

const forwardedProps = useForwardProps(delegatedProps)
</script>
