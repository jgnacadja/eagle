<template>
  <LegalPage v-if="page" :page="page" :tabs="tabs" />
</template>

<script setup lang="ts">
import { readItems } from '@directus/sdk'
import type { PageLegale, PageLegaleSubsection } from '@learnup/types'
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
          fields: [
            'slug',
            'label',
            'title',
            'show_in_tabs',
            'cta_label',
            'cta_to',
            'created_at',
            'updated_at',
            'seo_title',
            'seo_description',
            'seo_canonical',
            'sections.id',
            'sections.sort',
            'sections.title',
            'sections.anchor',
            'sections.body',
            'sections.subsections.id',
            'sections.subsections.sort',
            'sections.subsections.title',
            'sections.subsections.anchor',
            'sections.subsections.body'
          ],
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

// L'ordre `sort` pilote la numérotation affichée (1., 1.1…) — repli sur
// l'id si le champ est absent (relaie par proxy, fields explicites).
const bySort = <T extends { sort: number | null; id: number }>(a: T, b: T) =>
  (a.sort ?? a.id) - (b.sort ?? b.id)

const page = computed<LegalPage | null>(() => {
  const raw = pageData.value
  if (!raw) return null
  return {
    slug: raw.slug,
    label: raw.label,
    title: raw.title,
    lastUpdated: formatDateFr(raw.updated_at ?? raw.created_at),
    sections: (raw.sections ?? [])
      .slice()
      .sort(bySort)
      .map((section, index) => ({
        id: section.anchor,
        number: `${index + 1}`,
        title: section.title,
        body: section.body,
        subsections: (section.subsections ?? [])
          .filter((sub): sub is PageLegaleSubsection => typeof sub === 'object' && sub !== null)
          .slice()
          .sort(bySort)
          .map((sub, subIndex) => ({
            id: sub.anchor,
            number: `${index + 1}.${subIndex + 1}`,
            title: sub.title,
            body: sub.body
          }))
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
  () => pageData.value ?? {},
  () => (pageData.value ? `${pageData.value.title} — LEARN UP ACADEMY` : '')
)

watchEffect(() => {
  if (page.value) {
    route.meta.breadcrumb = [{ label: 'Accueil', to: '/' }, { label: page.value.title }]
  }
})
</script>
