<template>
  <article
    class="relative flex flex-row gap-lg rounded-md border border-rule bg-paper p-md shadow-sm transition hover:border-primary/40 hover:shadow-md md:flex-col md:gap-0 md:overflow-hidden md:p-0"
  >
    <div
      class="flex aspect-3/2 w-2/5 shrink-0 items-center justify-center overflow-hidden rounded-sm text-center md:w-auto md:rounded-none"
      :class="
        imageUrl
          ? 'border-0 bg-paper'
          : 'border border-dashed border-outline bg-surface-alt text-small text-ink-muted md:border-b md:border-x-0 md:border-t-0'
      "
    >
      <NuxtImg
        v-if="imageUrl"
        :src="imageUrl"
        :alt="title"
        loading="lazy"
        class="h-full w-full object-cover"
      />
      <span v-else>Visuel article à fournir</span>
    </div>
    <div class="flex min-w-0 flex-1 flex-col bg-paper md:p-md">
      <div class="flex flex-wrap items-center gap-x-sm gap-y-xs">
        <p class="text-overline text-accent-text uppercase font-bold">{{ category }}</p>
        <p class="hidden text-meta text-ink-subtle font-medium md:block">{{ date }}</p>
      </div>

      <NuxtLink :to="to" class="after:absolute after:inset-0 hover:underline">
        <h3 class="mt-sm font-sans md:text-h4 font-bold text-small text-ink">{{ title }}</h3>
      </NuxtLink>
      <p class="mt-sm hidden text-small text-ink-body md:block">{{ excerpt }}</p>
      <p class="mt-3 pt-xs text-meta text-ink-subtle font-medium md:hidden">{{ date }}</p>
    </div>
  </article>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    category: string
    title: string
    date: string
    excerpt: string
    imageUrl?: string
    to?: string
  }>(),
  { imageUrl: '', to: '#' }
)
</script>
