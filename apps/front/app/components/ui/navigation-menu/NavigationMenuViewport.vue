<template>
  <div class="absolute left-1/2 top-full flex w-screen -translate-x-1/2 justify-center">
    <NavigationMenuViewport
      v-bind="forwardedProps"
      :class="
        cn(
          'relative h-(--reka-navigation-menu-viewport-height) w-full overflow-hidden border border-t-0 border-rule bg-paper text-ink shadow-md',
          props.class
        )
      "
    />
  </div>
</template>

<script setup lang="ts">
import type { NavigationMenuViewportProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { NavigationMenuViewport, useForwardProps } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps<NavigationMenuViewportProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = reactiveOmit(props, 'class')

const forwardedProps = useForwardProps(delegatedProps)
</script>
