<template>
  <article class="mx-auto max-w-3xl px-6 py-16">
    <h1 class="font-display text-2xl font-bold text-ink">{{ famille.name }}</h1>
    <!-- Contenu WYSIWYG saisi par les éditeurs Directus, pas de l'input utilisateur -->
    <div v-if="famille.intro" class="mt-6 font-sans text-ink" v-html="famille.intro" />
  </article>
</template>

<script setup lang="ts">
import type { FamilleFormation } from '@learnup/types'

const route = useRoute()
const slug = route.params.famille as string

const famille = await useDirectusItemBySlug<FamilleFormation>(
  'familles_formation',
  slug,
  `famille-${slug}`
)

useContentSeo(famille, famille.name)
</script>
