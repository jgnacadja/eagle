<template>
  <div :class="cn(cardVariants({ variant }), props.class)">
    <slot />
  </div>
</template>

<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'
import { cardVariants, type CardVariants } from '.'

const props = withDefaults(
  defineProps<{
    variant?: CardVariants['variant']
    class?: HTMLAttributes['class']
  }>(),
  { variant: 'default', class: undefined }
)
</script>
