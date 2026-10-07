<template>
  <nav aria-label="Fil d'ariane" data-slot="breadcrumb" :class="props.class">
    <slot />
  </nav>
</template>

<script setup lang="ts">
import type { HTMLAttributes } from 'vue'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>
