<template>
  <figure :class="['rounded-md p-lg', variant === 'surface' ? 'bg-surface' : 'bg-paper']">
    <div class="text-small font-semibold text-accent" aria-hidden="true">{{ stars }}</div>
    <blockquote class="mt-md text-small text-ink">{{ quote }}</blockquote>
    <figcaption class="mt-md text-xs text-primary">{{ author }}</figcaption>
  </figure>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    stars: string
    quote: string
    author: string
    variant?: 'surface' | 'paper'
  }>(),
  {
    variant: 'surface'
  }
)
</script>
