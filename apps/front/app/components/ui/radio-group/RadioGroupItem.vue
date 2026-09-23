<template>
  <RadioGroupItem
    v-bind="forwardedProps"
    :class="
      cn(
        'grid aspect-square h-5 w-5 shrink-0 place-content-center rounded-full border-2 border-outline-soft shadow-none transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-primary',
        props.class
      )
    "
  >
    <RadioGroupIndicator class="grid place-content-center">
      <span aria-hidden="true" class="block h-sm w-sm rounded-full bg-accent" />
    </RadioGroupIndicator>
  </RadioGroupItem>
</template>

<script setup lang="ts">
import type { RadioGroupItemProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { RadioGroupIndicator, RadioGroupItem, useForwardProps } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps<RadioGroupItemProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = reactiveOmit(props, 'class')

const forwardedProps = useForwardProps(delegatedProps)
</script>
