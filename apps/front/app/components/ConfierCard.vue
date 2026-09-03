<template>
  <article class="overflow-hidden rounded-md bg-primary">
    <div
      class="flex aspect-video items-center justify-center bg-primary/60 text-center text-small text-ink-inverse-muted px-md"
    >
      <span>{{ imageLabel }}</span>
    </div>
    <div class="p-md">
      <p class="text-overline text-accent">{{ tag }}</p>
      <h3 class="mt-xs font-sans text-h4 font-semibold">{{ title }}</h3>
      <p class="mt-sm text-small text-ink-inverse-muted">{{ body }}</p>
    </div>
  </article>
</template>

<script setup lang="ts">
defineProps<{
  tag: string
  title: string
  body: string
  imageLabel: string
}>()
</script>
