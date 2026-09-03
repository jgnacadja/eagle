<template>
  <article class="overflow-hidden rounded-md border border-rule bg-paper">
    <div
      class="flex aspect-video items-center justify-center bg-surface-alt text-center text-meta text-ink-subtle"
    >
      Visuel article à fournir
    </div>
    <div class="p-md">
      <p class="text-overline text-accent-text">{{ category }}</p>
      <h3 class="mt-xs font-sans text-h4 font-semibold text-ink">{{ title }}</h3>
      <p class="mt-sm text-meta text-ink-subtle">{{ date }}</p>
    </div>
  </article>
</template>

<script setup lang="ts">
defineProps<{
  category: string
  title: string
  date: string
}>()
</script>
