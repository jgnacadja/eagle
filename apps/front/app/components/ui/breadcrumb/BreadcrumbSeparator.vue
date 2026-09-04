<template>
  <li
    data-slot="breadcrumb-separator"
    aria-hidden="true"
    :class="cn('flex items-center text-ink-subtle', props.class)"
  >
    <slot>
      <IconChevronRight :size="16" />
    </slot>
  </li>
</template>

<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>
