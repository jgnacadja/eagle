<template>
  <Label
    :for="delegatedProps.for"
    v-bind="forwardedProps"
    :class="cn(labelVariants({ variant }), props.class)"
  >
    <slot />
  </Label>
</template>

<script setup lang="ts">
import type { LabelProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { Label, useForwardProps } from 'reka-ui'
import { cn } from '@/lib/utils'
import { labelVariants, type LabelVariants } from '.'

const props = withDefaults(
  defineProps<
    LabelProps & {
      variant?: LabelVariants['variant']
      class?: HTMLAttributes['class']
    }
  >(),
  { variant: 'default', class: undefined }
)

const delegatedProps = reactiveOmit(props, 'class', 'variant')
const forwardedProps = useForwardProps(delegatedProps)
</script>
