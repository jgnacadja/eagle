<template>
  <article class="rounded-md border border-rule bg-paper p-md">
    <div
      class="flex aspect-video items-center justify-center rounded-sm border border-dashed border-outline bg-surface-alt text-center text-meta text-ink-muted"
    >
      Visuel article à fournir
    </div>
    <div class="mt-md">
      <p class="text-overline text-accent-text uppercase">{{ category }}</p>
      <h3 class="mt-xs font-sans text-h4 text-ink">{{ title }}</h3>
      <p class="mt-sm text-small text-ink-subtle">{{ date }}</p>
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
