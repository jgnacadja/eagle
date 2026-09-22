<template>
  <figure :class="['rounded-md p-lg', variant === 'white' ? 'bg-white' : 'bg-surface']">
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
    variant?: 'surface' | 'white'
  }>(),
  {
    variant: 'surface'
  }
)
</script>
