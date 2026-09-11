<template>
  <article class="rounded-md bg-surface p-lg">
    <h3 class="font-display text-h3 font-extrabold uppercase text-ink">{{ title }}</h3>
    <p class="mt-xs text-meta font-bold text-accent-text">{{ subtitle }}</p>
    <p class="mt-md max-w-callout text-sm text-ink-muted">{{ body }}</p>
    <NuxtLink
      :to="to"
      class="mt-md inline-block text-small font-bold text-primary transition-colors hover:text-accent-text"
    >
      {{ cta }}
    </NuxtLink>
  </article>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  subtitle: string
  body: string
  cta: string
  to: string
}>()
</script>
