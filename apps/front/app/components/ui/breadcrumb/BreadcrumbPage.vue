<template>
  <span
    data-slot="breadcrumb-page"
    aria-current="page"
    :class="cn('font-medium text-ink', props.class)"
  >
    <slot />
  </span>
</template>

<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>
