<template>
  <NavigationMenuTrigger
    v-bind="forwardedProps"
    :class="cn(navigationMenuTriggerStyle({ variant }), 'group', props.class)"
  >
    <slot />
    <IconChevronDown
      :size="12"
      class="relative top-px ml-1 transition duration-300 group-data-[state=open]:rotate-180"
    />
  </NavigationMenuTrigger>
</template>

<script setup lang="ts">
import type { NavigationMenuTriggerProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { NavigationMenuTrigger, useForwardProps } from 'reka-ui'
import { cn } from '@/lib/utils'
import { navigationMenuTriggerStyle, type NavigationMenuTriggerVariants } from '.'

const props = withDefaults(
  defineProps<
    NavigationMenuTriggerProps & {
      variant?: NavigationMenuTriggerVariants['variant']
      class?: HTMLAttributes['class']
    }
  >(),
  { variant: 'default', class: undefined }
)

const delegatedProps = reactiveOmit(props, 'class', 'variant')

const forwardedProps = useForwardProps(delegatedProps)
</script>
