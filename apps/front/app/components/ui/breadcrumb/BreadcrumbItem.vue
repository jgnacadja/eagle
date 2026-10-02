<template>
  <li data-slot="breadcrumb-item" :class="cn('inline-flex items-center gap-xs', props.class)">
    <slot />
  </li>
</template>

<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>
