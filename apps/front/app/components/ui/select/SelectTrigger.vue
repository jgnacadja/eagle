<template>
  <SelectTrigger
    v-bind="forwardedProps"
    :class="cn(selectTriggerVariants({ variant }), props.class)"
  >
    <slot />
    <SelectIcon as-child>
      <IconChevronDown :size="16" class="opacity-50 shrink-0" />
    </SelectIcon>
  </SelectTrigger>
</template>

<script setup lang="ts">
import type { SelectTriggerProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { SelectIcon, SelectTrigger, useForwardProps } from 'reka-ui'
import { cn } from '@/lib/utils'
import { selectTriggerVariants, type SelectTriggerVariants } from '.'

const props = withDefaults(
  defineProps<
    SelectTriggerProps & {
      variant?: SelectTriggerVariants['variant']
      class?: HTMLAttributes['class']
    }
  >(),
  { variant: 'default', class: undefined }
)

const delegatedProps = reactiveOmit(props, 'class', 'variant')

const forwardedProps = useForwardProps(delegatedProps)
</script>
