<template>
  <article class="rounded-md border border-rule bg-paper p-md">
    <div
      class="flex aspect-video items-center justify-center rounded-sm border border-dashed border-outline bg-surface-alt text-center text-meta text-ink-muted"
    >
      <span>{{ imageTop }}<br />{{ imageBottom }}</span>
    </div>
    <div class="mt-md">
      <h3 class="font-sans text-h4 text-ink">{{ title }}</h3>
      <NuxtLink to="/" class="mt-xs inline-block text-small font-bold text-primary hover:text-ink">
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
