<template>
  <section id="actualites" class="bg-surface py-20">
    <div class="mx-auto max-w-container px-6">
      <div class="flex items-end justify-between">
        <h2 class="font-display text-2xl font-extrabold text-ink md:text-3xl">Actualités</h2>
        <NuxtLink
          to="/actualites"
          class="whitespace-nowrap text-sm font-semibold text-ink hover:text-accent-text"
        >
          Tout le blog →
        </NuxtLink>
      </div>

      <div v-if="articles?.length" class="mt-10 grid gap-6 md:grid-cols-3">
        <article
          v-for="article in displayedArticles"
          :key="article.id"
          class="overflow-hidden rounded-md border border-rule bg-paper"
        >
          <div class="h-40 overflow-hidden bg-surface-alt">
            <img
              v-if="article.cover_image"
              :src="assetUrl(article.cover_image) ?? undefined"
              :alt="article.title"
              class="h-full w-full object-cover"
              loading="lazy"
            />
            <div
              v-else
              class="flex h-full w-full items-center justify-center text-center text-xs text-ink-subtle"
            >
              {{ article.category }}
            </div>
          </div>
          <div class="p-5">
            <p class="text-xs font-bold tracking-wide text-accent-text">{{ article.category }}</p>
            <h3 class="mt-1 font-sans font-semibold text-ink">{{ article.title }}</h3>
            <p class="mt-3 text-xs text-ink-subtle">{{ formatDate(article.publish_at) }}</p>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDirectusAsset } from '~/composables/useDirectusAsset'
import type { Article } from '@learnup/types'

const props = defineProps<{
  articles: Article[]
}>()

const displayedArticles = computed(() => props.articles.slice(0, 3))

function assetUrl(fileId: string | null): string | null {
  return useDirectusAsset(fileId)
}

function formatDate(value: string | null): string {
  if (!value) return ''
  return new Date(value).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}
</script>
