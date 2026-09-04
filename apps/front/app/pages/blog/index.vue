<template>
  <div class="mx-auto max-w-prose px-6 py-16">
    <h1 class="mb-8 font-display text-2xl font-bold text-ink">Blog</h1>

    <p v-if="!articles?.length" class="font-sans text-ink-muted">Aucun article pour le moment.</p>

    <ul v-else class="flex flex-col gap-6">
      <li v-for="article in articles" :key="article.id">
        <NuxtLink
          :to="`/blog/${article.slug}`"
          class="block rounded-md border border-rule bg-paper p-4 shadow-sm hover:shadow-md"
        >
          <p class="font-sans font-semibold text-ink">{{ article.title }}</p>
          <p v-if="article.excerpt" class="mt-1 font-sans text-sm text-ink-muted">
            {{ article.excerpt }}
          </p>
        </NuxtLink>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import type { Article } from '@learnup/types'

const articles = await useDirectusList<Article>('articles', 'blog-articles', {
  sort: ['-publish_at'],
  filter: { publish_at: { _lte: '$NOW' } }
})

useContentSeo({}, 'Blog — LEARN UP ACADEMY')
</script>
