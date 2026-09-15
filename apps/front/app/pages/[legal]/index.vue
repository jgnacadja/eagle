<template>
  <LegalPage v-if="page" :page="page" />
</template>

<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import { legalPages } from '~/data/legal'

definePageMeta({
  layout: 'with-breadcrumb'
})

const route = useRoute()
const slug = computed(() => route.params.legal as string)

const page = computed(() => legalPages.find((p) => p.slug === slug.value))

if (import.meta.server && !page.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Page non trouvée'
  })
}

if (!page.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Page non trouvée'
  })
}

useContentSeo(
  computed(() => ({
    seo_title: page.value ? `${page.value.title} — LEARN UP ACADEMY` : '',
    seo_description: page.value?.metaDescription
  })),
  computed(() => page.value?.title ?? '')
)

watchEffect(() => {
  if (page.value) {
    route.meta.breadcrumb = [{ label: 'Accueil', to: '/' }, { label: page.value.title }]
  }
})
</script>
