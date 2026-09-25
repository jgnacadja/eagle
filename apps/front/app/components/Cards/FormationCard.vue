<template>
  <article
    class="rounded-md border border-rule bg-paper p-md transition-[border-color,box-shadow] hover:border-primary/40 hover:shadow-md"
  >
    <div v-if="image" class="relative aspect-video overflow-hidden rounded-sm">
      <img :src="image" :alt="title" class="h-full w-full object-cover" loading="lazy" />
      <span class="absolute inset-0 bg-ink/15" aria-hidden="true" />
    </div>
    <div
      v-else
      class="flex aspect-video items-center justify-center rounded-sm border border-dashed border-outline bg-surface-alt text-center text-meta text-ink-muted"
    >
      <span>{{ imageTop }}<br />{{ imageBottom }}</span>
    </div>
    <div class="mt-md">
      <h3 class="font-sans text-h4 text-ink">{{ title }}</h3>
      <p
        v-if="body"
        class="font-sans text-sm md:text-body text-ink-muted line-clamp-2 hidden md:block"
      >
        {{ body }}
      </p>
      <NuxtLink
        v-if="to"
        :to="to"
        class="mt-xs inline-block text-small font-bold text-primary transition-colors hover:text-accent-text"
      >
        Voir le détail <span class="link-arrow">→</span>
      </NuxtLink>
    </div>
  </article>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  imageTop: string
  imageBottom: string
  body?: string
  image?: string | null
  to?: string | null
}>()
</script>
