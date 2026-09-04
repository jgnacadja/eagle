<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { ChevronRight } from '@lucide/vue'
import { cn } from '@/lib/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <li
    data-slot="breadcrumb-separator"
    role="presentation"
    aria-hidden="true"
    :class="cn('flex items-center text-ink-subtle', props.class)"
  >
    <slot>
      <ChevronRight class="h-4 w-4" />
    </slot>
  </li>
</template>
