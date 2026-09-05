<template>
  <article class="flex flex-col rounded-md border border-rule bg-paper p-md">
    <div
      class="flex aspect-3/1 items-center justify-center rounded-sm border border-dashed border-outline bg-surface-alt text-center text-small text-ink-muted"
    >
      {{ imageLabel }}
    </div>
    <div class="mt-md flex items-center gap-sm">
      <p class="text-overline text-accent-text uppercase">{{ category }}</p>
      <p class="text-small text-ink-subtle">{{ date }}</p>
    </div>
    <h3 class="mt-sm font-sans text-h4 font-semibold text-ink">{{ title }}</h3>
    <p class="mt-sm text-small text-ink-body">{{ excerpt }}</p>
    <NuxtLink :to="to" class="mt-md text-small font-bold text-primary hover:text-ink">
      Lire l'article →
    </NuxtLink>
  </article>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    category: string
    title: string
    date: string
    excerpt: string
    imageLabel?: string
    to?: string
  }>(),
  { imageLabel: 'Visuel article à fournir', to: '#' }
)
</script>
