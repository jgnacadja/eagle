<template>
  <div
    :class="cn('flex flex-col-reverse gap-sm sm:flex-row sm:justify-end sm:gap-x-sm', props.class)"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{ class?: HTMLAttributes['class'] }>()
</script>
