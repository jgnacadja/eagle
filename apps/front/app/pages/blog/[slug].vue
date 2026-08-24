<template>
  <article class="mx-auto max-w-3xl px-6 py-16">
    <p v-if="article.category" class="font-sans text-sm font-semibold text-primary">
      {{ article.category }}
    </p>
    <h1 class="mt-2 font-display text-2xl font-bold text-ink">{{ article.title }}</h1>
    <!-- eslint-disable-next-line vue/no-v-html -- sanitizé via sanitizeHtml() -->
    <div v-if="article.content" class="mt-6 font-sans text-ink" v-html="sanitizeHtml(article.content)" />
  </article>
</template>

<script setup lang="ts">
import type { Article } from '@learnup/types'

const route = useRoute()
const slug = route.params.slug as string

const article = await useDirectusItemBySlug<Article>('articles', slug, `article-${slug}`)

useContentSeo(article, article.title)
</script>
