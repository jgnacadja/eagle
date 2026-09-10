<template>
  <article
    class="flex flex-row gap-lg rounded-md bg-paper p-md shadow-md md:flex-col md:gap-0 md:overflow-hidden md:p-0"
  >
    <div
      class="flex aspect-square w-2/5 shrink-0 items-center justify-center rounded-sm border border-dashed border-outline bg-surface-alt text-center text-small text-ink-muted md:aspect-3/1 md:w-auto md:rounded-none md:border-b md:border-x-0 md:border-t-0"
    >
      <NuxtImg v-if="imageUrl" :src="imageUrl" :alt="title" class="h-full w-full object-cover" />
    </div>
    <div class="flex min-w-0 flex-1 flex-col bg-paper md:p-md">
      <div class="flex flex-wrap items-center gap-x-sm gap-y-xs">
        <p class="text-overline text-accent-text uppercase font-bold">{{ category }}</p>
        <p class="text-xs text-ink-subtle font-medium">{{ date }}</p>
      </div>

      <NuxtLink :to="to" class="hover:underline">
        <h3 class="mt-sm font-sans md:text-h4 font-bold text-small text-ink">{{ title }}</h3>
      </NuxtLink>
      <p class="mt-sm hidden text-small text-ink-body md:block">{{ excerpt }}</p>
    </div>
  </article>
</template>

<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'

withDefaults(
  defineProps<{
    category: string
    title: string
    date: string
    excerpt: string
    imageUrl?: string
    to?: RouteLocationRaw
  }>(),
  { imageUrl: '', to: '#' }
)
</script>
