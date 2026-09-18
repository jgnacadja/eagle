<template>
  <AccordionHeader class="flex">
    <AccordionTrigger
      v-bind="delegatedProps"
      :class="cn(accordionTriggerVariants({ variant }), props.class)"
    >
      <slot />
      <slot name="icon">
        <IconChevronDown
          :size="16"
          class="shrink-0 text-ink-muted transition-transform duration-200"
        />
      </slot>
    </AccordionTrigger>
  </AccordionHeader>
</template>

<script setup lang="ts">
import type { AccordionTriggerProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { AccordionHeader, AccordionTrigger } from 'reka-ui'
import { cn } from '@/lib/utils'
import { accordionTriggerVariants, type AccordionTriggerVariants } from '.'

const props = withDefaults(
  defineProps<
    AccordionTriggerProps & {
      variant?: AccordionTriggerVariants['variant']
      class?: HTMLAttributes['class']
    }
  >(),
  { variant: 'default', class: undefined }
)

const delegatedProps = reactiveOmit(props, 'class', 'variant')
</script>
