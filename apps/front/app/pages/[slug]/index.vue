<template>
  <LegalPage v-if="page" :page="page" :tabs="tabs" />
</template>

<script setup lang="ts">
import { readItems } from '@directus/sdk'
import type { PageLegale } from '@learnup/types'
import { useMenuLegalPages } from '~/composables/useMenuData'
import type { LegalPage, LegalPageTab } from '~/types/legal'
import { formatDateFr } from '~/utils/date'

definePageMeta({
  layout: 'with-breadcrumb'
})

const route = useRoute()
const slug = route.params.slug as string
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
      /* v8 ignore next 3 */
      if (import.meta.server) {
        logServerError(`[legal] ${slug} load failed:`, error)
      }
      throw error
    }
  },
  {
    // Même règle que useDirectusList : payload SSR uniquement pendant
    // l'hydratation, ensuite chaque mount repart sur des données fraîches.
    getCachedData: (key, nuxtApp, ctx) => {
      if (ctx.cause !== 'initial' || !nuxtApp.isHydrating) return undefined
      return (nuxtApp.payload.data[key] ?? nuxtApp.static.data[key]) as
        PageLegale | null | undefined
    }
  }
)

if (loadError.value) {
  throw createError({
    statusCode: 500,
    statusMessage: 'Erreur de chargement de la page'
  })
}

const page = computed<LegalPage | null>(() => {
  const raw = pageData.value
  if (!raw) return null
  return {
    slug: raw.slug,
    label: raw.label,
    title: raw.title,
    lastUpdated: formatDateFr(raw.updated_at ?? raw.created_at),
    sections: (raw.sections ?? []).map((section) => ({
      id: section.id,
      title: section.title,
      paragraphs: section.paragraphs ?? [],
      bullets: section.bullets ?? []
    })),
    cta: {
      label: raw.cta_label ?? 'Nous contacter',
      to: raw.cta_to ?? 'mailto:contact@learnup.fr'
    }
  }
})

if (!page.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Page non trouvée'
  })
}

// Onglets partagés entre les pages légales — `show_in_tabs` exclut les pages
// hors navigation (ex. cookies), qui restent accessibles par leur slug.
const legalPages = useMenuLegalPages()
const tabs = computed<LegalPageTab[]>(() =>
  legalPages.value.filter((p) => p.showInTabs).map((p) => ({ slug: p.slug, label: p.label }))
)

useContentSeo(
  // `pageData` est garanti non nul ici : le setup a déjà levé un 404 sinon.
  () => pageData.value!,
  () => `${pageData.value!.title} — LEARN UP ACADEMY`
)

watchEffect(() => {
  if (page.value) {
    route.meta.breadcrumb = [{ label: 'Accueil', to: '/' }, { label: page.value.title }]
  }
})
</script>
