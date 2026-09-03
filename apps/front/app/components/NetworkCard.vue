<template>
  <article class="rounded-md border border-rule bg-paper p-lg shadow-sm">
    <h3 class="font-display text-h4 font-bold text-ink">{{ title }}</h3>
    <p class="mt-xs text-small font-semibold text-accent-text">{{ subtitle }}</p>
    <p class="mt-md text-small text-ink-muted">{{ body }}</p>
    <NuxtLink
      to="/"
      class="mt-md inline-block text-small font-semibold text-ink hover:text-accent-text"
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
}>()
</script>
