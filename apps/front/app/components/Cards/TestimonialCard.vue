<template>
  <figure class="rounded-md bg-surface p-lg">
    <div class="text-small font-semibold text-accent" aria-hidden="true">{{ stars }}</div>
    <blockquote class="mt-md text-body text-ink">{{ quote }}</blockquote>
    <figcaption class="mt-md text-meta font-bold text-primary">{{ author }}</figcaption>
  </figure>
</template>

<script setup lang="ts">
defineProps<{
  stars: string
  quote: string
  author: string
}>()
</script>
