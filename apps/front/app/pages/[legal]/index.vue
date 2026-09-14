<template>
  <LegalPage v-if="page" :page="page" :tabs="tabs" />
</template>

<script setup lang="ts">
import { readItems } from '@directus/sdk'
import type { PageLegale } from '@learnup/types'
import type { LegalPage, LegalPageTab } from '~/types/legal'
import { formatDateFr } from '~/utils/date'

definePageMeta({
  layout: 'with-breadcrumb'
})

const route = useRoute()
const slug = route.params.legal as string
const directus = useDirectusClient()

const { data: pageData, error: loadError } = await useAsyncData<PageLegale | null>(
  `page-legale-${slug}`,
  async () => {
    try {
      const results = await directus.request<PageLegale[]>(
        readItems('pages_legales', {
          filter: { slug: { _eq: slug }, status: { _eq: 'published' } },
          limit: 1
        })
      )
      return results[0] ?? null
    } catch (error) {
      if (import.meta.server) {
        logServerError(`[legal] ${slug} load failed:`, error)
      }
      throw error
    }
  },
  {
    getCachedData: (key, nuxtApp) =>
      (nuxtApp.payload.data[key] ?? nuxtApp.static.data[key]) as PageLegale | null | undefined
  }
)

// Onglets partagés entre les pages légales — `show_in_tabs` exclut les pages
// hors navigation (ex. cookies), qui restent accessibles par leur slug.
const tabsData = await useDirectusList<Pick<PageLegale, 'slug' | 'label'>>(
  'pages_legales',
  'pages-legales-tabs',
  {
    fields: ['slug', 'label'],
    filter: { status: { _eq: 'published' }, show_in_tabs: { _eq: true } },
    sort: ['sort']
  }
)

const tabs = computed<LegalPageTab[]>(
  () => tabsData.value?.map((tab) => ({ slug: tab.slug, label: tab.label })) ?? []
)

const page = computed<LegalPage | null>(() => {
  const raw = pageData.value
  if (!raw) return null
  return {
    slug: raw.slug,
    label: raw.label,
    title: raw.title,
    lastUpdated: formatDateFr(raw.updated_at ?? raw.created_at),
    metaDescription: raw.seo_description ?? '',
    sections: (raw.sections ?? []).map((section) => ({
      id: section.id,
      title: section.title,
      paragraphs: section.paragraphs ?? [],
      bullets: section.bullets ?? []
    })),
    cta: {
      label: raw.cta_label ?? 'Nous contacter',
      to: raw.cta_to ?? '/contact'
    }
  }
})

if (loadError.value) {
  throw createError({
    statusCode: 500,
    statusMessage: 'Erreur de chargement de la page'
  })
}

if (!page.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Page non trouvée'
  })
}

useContentSeo(
  () => pageData.value ?? {},
  () => (pageData.value ? `${pageData.value.title} — LEARN UP ACADEMY` : '')
)

watchEffect(() => {
  if (page.value) {
    route.meta.breadcrumb = [{ label: 'Accueil', to: '/' }, { label: page.value.title }]
  }
})
</script>
