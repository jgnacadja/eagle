<template>
  <figure class="rounded-md bg-surface p-lg">
    <div class="text-accent" aria-hidden="true">{{ stars }}</div>
    <blockquote class="mt-md text-small text-ink-muted">{{ quote }}</blockquote>
    <figcaption class="mt-md text-meta text-ink-subtle">{{ author }}</figcaption>
  </figure>
</template>

<script setup lang="ts">
defineProps<{
  stars: string
  quote: string
  author: string
}>()
</script>
