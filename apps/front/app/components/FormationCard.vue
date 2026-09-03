<template>
  <article class="overflow-hidden rounded-md border border-rule bg-paper">
    <div
      class="flex aspect-video items-center justify-center bg-surface-alt text-center text-meta text-ink-subtle px-md"
    >
      <span>{{ imageTop }}<br />{{ imageBottom }}</span>
    </div>
    <div class="p-md">
      <h3 class="font-sans text-h4 font-semibold text-ink">{{ title }}</h3>
      <NuxtLink to="/" class="mt-xs inline-block text-small text-accent-text hover:text-accent">
        Voir le détail →
      </NuxtLink>
    </div>
  </article>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  imageTop: string
  imageBottom: string
}>()
</script>
