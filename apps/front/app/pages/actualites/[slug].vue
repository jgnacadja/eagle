<template>
  <div class="bg-paper-warm flex flex-1 flex-col">
    <template v-if="pageState === 'found'">
      <div class="mx-auto w-full max-w-container px-gutter-mobile py-2xl md:px-gutter">
        <div class="lg:grid lg:grid-cols-12 lg:gap-2xl">
          <article class="lg:col-span-8">
            <header class="max-w-prose">
              <p class="text-overline text-accent-text">
                <span class="font-bold uppercase">{{ article?.category }}</span>
                <span class="font-medium text-ink-subtle">
                  <span class="mx-xs">·</span>{{ formatArticleDate(article?.publish_at) }}
                  <span class="mx-xs">· <span class="md:inline hidden">lecture</span></span
                  >{{ readingTime }} min
                </span>
              </p>
              <h1
                class="mt-sm font-display text-2xl font-extrabold leading-tight text-ink lg:text-4xl"
              >
                {{ article?.title }}
              </h1>
              <div class="mt-md h-0.75 flex-1 bg-accent w-16" aria-hidden="true" />
              <p class="mt-md text-body text-ink-body">{{ article?.excerpt }}</p>
            </header>

            <div class="mt-lg flex items-center justify-between border-y border-rule py-md">
              <div class="flex items-center gap-md">
                <NuxtImg
                  v-if="article?.author_image"
                  class="h-10 w-10 rounded-full border border-outline object-cover"
                  :src="assetUrl(article.author_image)"
                  :alt="article?.author_name ?? 'Auteur'"
                />
                <span
                  v-else
                  class="flex h-xl w-xl items-center justify-center rounded-full bg-primary text-meta font-semibold text-paper"
                  aria-hidden="true"
                  >{{ article?.author_name?.slice(0, 2).toUpperCase() || 'LU' }}</span
                >
                <div class="text-meta">
                  <p class="font-semibold text-ink leading-5">{{ article?.author_name }}</p>
                  <p class="text-ink-muted leading-5">
                    Publié le {{ formatArticleDate(article?.publish_at) }}
                  </p>
                </div>
              </div>
              <div class="flex items-center gap-md text-ink-subtle">
                <Button
                  type="button"
                  variant="ghost"
                  aria-label="Partager l'article"
                  class="h-control-sm w-control-sm rounded-full border border-primary/25 p-0 hover:bg-surface hover:text-ink"
                  @click="onShare"
                >
                  <IconShare :size="18" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  aria-label="Copier le lien de l'article"
                  class="h-control-sm w-control-sm rounded-full border border-primary/25 p-0 hover:bg-surface hover:text-ink"
                  @click="onCopyLink"
                >
                  <IconLink :size="18" />
                </Button>
              </div>
            </div>

            <figure class="mt-lg">
              <div
                v-if="!article?.cover_image"
                class="flex aspect-video items-center justify-center rounded-md border border-dashed border-outline bg-surface-alt text-center text-small text-ink-muted"
              >
                Visuel article à fournir
              </div>
              <NuxtImg
                v-else
                class="aspect-video w-full rounded-md border border-outline object-cover"
                :src="assetUrl(article.cover_image)"
                :alt="article.title"
              />
            </figure>

            <div class="mt-2xl max-w-prose space-y-xl text-body text-ink-body">
              <div class="article-content" v-html="sanitizeHtml(article?.content ?? '')"></div>

              <!-- <Card v-if="article?.related_formation_slug" class="p-lg lg:hidden">
                <p class="mb-md text-overline text-ink-subtle font-bold">Formation liée</p>
                <p class="mt-xs text-meta font-medium text-ink-muted">
                  {{ article.related_formation_slug }}
                </p>
                <NuxtLink
                  :to="`/formations/${article.related_formation_slug}`"
                  class="mt-lg block h-control rounded-full bg-primary px-lg text-center text-small font-semibold leading-11 text-paper hover:bg-primary-dark"
                >
                  Voir la formation
                </NuxtLink>
              </Card> -->
            </div>
          </article>

          <aside class="hidden lg:col-span-4 lg:block" aria-label="Informations complémentaires">
            <div class="sticky top-lg space-y-lg">
              <Card
                v-if="articleHeadings.length > 0"
                class="p-lg"
                role="navigation"
                aria-labelledby="dans-cet-article-heading"
              >
                <h2
                  id="dans-cet-article-heading"
                  class="text-overline text-ink-subtle uppercase font-bold"
                >
                  Dans cet article
                </h2>
                <ul class="mt-md space-y-md text-small">
                  <li v-for="heading in articleHeadings" :key="heading.id">
                    <a
                      :href="`#${heading.id}`"
                      :class="[
                        activeHeading === heading.id
                          ? 'font-extrabold text-ink'
                          : 'text-ink-body hover:text-ink hover:underline font-semibold text-sm',
                        'hover:underline'
                      ]"
                      @click="activeHeading = heading.id"
                    >
                      {{ heading.label }}
                    </a>
                  </li>
                </ul>
              </Card>

              <!-- <CenterFormationCard
                eyebrow="Formation liée"
                variant="button"
                :family="article.relatedFormation.family"
                :title="article.relatedFormation.title"
                :meta="article.relatedFormation.meta"
                :status="article.relatedFormation.status"
                :to="article.relatedFormation.to"
              /> -->

              <Card class="bg-primary-dark p-lg text-paper">
                <h3 class="text-sm font-bold">Un doute sur vos échéances ?</h3>
                <p class="mt-sm text-meta leading-5 text-white/72">
                  Transmettez vos dates de délivrance : un conseiller planifie les recyclages en
                  série avec vos équipes.
                </p>
                <NuxtLink
                  to="/centres/demande-de-formation"
                  class="mt-lg block h-control rounded-full bg-white px-lg text-center text-small font-semibold leading-11 text-ink hover:bg-paper/90"
                >
                  Parler à un conseiller
                </NuxtLink>
              </Card>
            </div>
          </aside>
        </div>
      </div>

      <section aria-labelledby="lire-ensuite-heading" class="bg-paper">
        <div class="mx-auto w-full max-w-container px-gutter-mobile py-2xl md:px-gutter">
          <div class="flex items-center justify-between">
            <h2 id="lire-ensuite-heading" class="font-display text-h3 font-extrabold text-ink">
              À lire ensuite
            </h2>
            <NuxtLink
              to="/actualites"
              class="hidden text-small font-bold text-ink hover:underline sm:inline"
            >
              Toute l'actualité →
            </NuxtLink>
          </div>
          <ul class="mt-lg grid grid-cols-1 gap-lg sm:grid-cols-3">
            <li
              v-for="related in relatedArticles"
              :key="related.slug"
              class="border-t border-accent-text/30 pt-md"
            >
              <article>
                <p class="text-overline text-accent-text">
                  <span class="font-bold uppercase">{{ related.category ?? 'Actualité' }}</span>
                  <span class="font-medium text-ink-subtle">
                    <span class="mx-xs">·</span>{{ formatArticleDate(related.publish_at) }}
                  </span>
                </p>
                <h3 class="mt-xs text-small font-bold leading-snug text-ink">
                  <NuxtLink :to="`/actualites/${related.slug}`" class="hover:underline">
                    {{ related.title }}
                  </NuxtLink>
                </h3>
              </article>
            </li>
          </ul>
        </div>
      </section>
    </template>

    <LoadError
      v-else-if="loadError"
      title="L'article n'a pas pu être chargé."
      link-to="/actualites"
      link-label="Voir toute l'actualité"
      @retry="retry"
    >
      Le problème est temporaire. Vous pouvez réessayer, ou consulter toute l'actualité du réseau.
    </LoadError>

    <NotFound
      v-else
      title="Cet article n'est pas disponible."
      primary-to="/actualites"
      primary-label="Voir toute l'actualité"
      secondary-to="/formations"
      secondary-label="Trouver ma formation"
      search-placeholder="Titre, mot-clé ou catégorie d'article"
      search-label="Rechercher un article"
      search-input-id="article-search"
      @search="onErrorSearch"
    >
      <template #icon>
        <IconFileOff :size="32" class="text-ink" />
      </template>
      La page demandée n'existe pas ou n'est plus publiée. L'actualité du réseau reste accessible.
    </NotFound>
  </div>
</template>

<script setup lang="ts">
import { readItems } from '@directus/sdk'
import type { Article } from '@learnup/types'
import { sanitizeHtml } from '~/utils/sanitizeHtml'

definePageMeta({
  layout: 'with-breadcrumb',
  layoutProps: {
    color: 'bg-paper-warm'
  }
})

const route = useRoute()
const slug = route.params.slug as string
const directus = useDirectusClient()
const config = useRuntimeConfig()

const {
  data: articleData,
  error: loadError,
  refresh
} = await useAsyncData<Article | null>(`article-${slug}`, async () => {
  if (route.query.error === '1') {
    throw new Error('Article load failed')
  }

  try {
    const results = await directus.request<Article[]>(
      readItems('articles', {
        fields: [
          'id',
          'status',
          'slug',
          'title',
          'excerpt',
          'content',
          'category',
          'author_name',
          'author_image',
          'region',
          'related_formation_slug',
          'publish_at',
          'centre',
          'cover_image',
          'seo_title',
          'seo_description',
          'seo_canonical'
        ],
        filter: { slug: { _eq: slug }, status: { _eq: 'published' } },
        limit: 1
      })
    )
    return results[0] ?? null
  } catch (error) {
    if (import.meta.server) {
      logServerError(`[actualites/slug] ${slug} load failed:`, error)
    }
    throw error
  }
})

const article = computed(() => {
  return articleData.value
})

const readingTime = computed(() => {
  const content = article.value?.content ?? ''
  return Math.ceil(content.length / 200)
})

const activeHeading = ref<string | null>(null)

const articleHeadings = computed(() => extractArticleHeadings(article.value?.content ?? ''))

const relatedArticles = await useDirectusList<Article>('articles', `actualites-related-${slug}`, {
  fields: ['id', 'slug', 'title', 'category', 'publish_at'],
  filter: { status: { _eq: 'published' }, slug: { _neq: slug } },
  sort: ['-publish_at'],
  limit: 3
})

type PageState = 'found' | 'not-found' | 'error'
const pageState = computed<PageState>(() => {
  if (loadError.value) return 'error'
  return article.value ? 'found' : 'not-found'
})

if (import.meta.server) {
  const requestEvent = useRequestEvent()
  if (requestEvent) {
    if (pageState.value === 'error') {
      setResponseStatus(requestEvent, 500, "Erreur de chargement de l'article")
    } else if (pageState.value === 'not-found') {
      setResponseStatus(requestEvent, 404, 'Article introuvable')
    }
  }
}

const sourceRoute = computed(() => {
  const from = typeof route.query.from === 'string' ? route.query.from : '/actualites'

  if (from.startsWith('/formations')) {
    return { label: 'Formations', to: '/formations' }
  }

  if (from.startsWith('/centres')) {
    return { label: 'Réseau de centres', to: '/centres' }
  }

  return { label: 'Actualités', to: '/actualites' }
})

const defaultBreadcrumb = computed(() => {
  const category =
    (typeof route.query.category === 'string' && route.query.category.length > 0
      ? route.query.category
      : article.value?.category) ?? 'Article'

  return [
    { label: 'Accueil', to: '/' },
    { label: sourceRoute.value.label, to: sourceRoute.value.to },
    { label: category },
    { label: article.value?.title ?? 'Article' }
  ]
})

const stateLabels: Record<Exclude<PageState, 'found'>, string> = {
  'not-found': 'Article introuvable',
  error: 'Erreur de chargement'
}

watchEffect(() => {
  const stateLabel = pageState.value === 'found' ? null : stateLabels[pageState.value]
  route.meta.breadcrumb = stateLabel
    ? [
        { label: 'Accueil', to: '/' },
        { label: 'Actualités', to: '/actualites' },
        { label: stateLabel }
      ]
    : defaultBreadcrumb.value
})

const seoByState: Record<
  PageState,
  { seo_title: string; seo_description: string; seo_noindex?: boolean }
> = {
  found: {
    seo_title: `${article.value?.title ?? 'Article'} | LEARN UP ACADEMY`,
    seo_description: article.value?.excerpt ?? ''
  },
  'not-found': {
    seo_title: 'Article introuvable',
    seo_description: "Cet article n'existe pas ou n'est plus publié.",
    seo_noindex: true
  },
  error: {
    seo_title: 'Erreur de chargement',
    seo_description: "L'article n'a pas pu être chargé.",
    seo_noindex: true
  }
}

useContentSeo(
  () => seoByState[pageState.value],
  () => seoByState[pageState.value].seo_title
)

function retry() {
  if (route.query.error) {
    const { error: _error, ...query } = route.query
    navigateTo({ path: route.path, query })
  } else {
    refresh()
  }
}

function onErrorSearch(query: string) {
  navigateTo({ path: '/actualites', query: query ? { q: query } : {} })
}

function extractArticleHeadings(
  content: string
): Array<{ id: string; label: string; level: number }> {
  const parser = typeof window !== 'undefined' ? new DOMParser() : null
  if (!parser) return []

  const doc = parser.parseFromString(content, 'text/html')
  return Array.from(doc.querySelectorAll('h1,h2,h3')).map((node) => {
    const label = (node.textContent ?? '').trim()
    return {
      id: slugifyHeading(label || node.tagName.toLowerCase()),
      label,
      level: Number(node.tagName.replace(/H/i, ''))
    }
  })
}

function slugifyHeading(label: string): string {
  return label
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

function assetUrl(id: string | null): string | null {
  if (!id) return null
  return `${config.public.directusUrl}/assets/${id}`
}

function formatArticleDate(value: string | null): string {
  if (!value) return 'Date à préciser'
  return new Date(value).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })
}

function onShare() {
  if (typeof window !== 'undefined') {
    navigator.share?.({ title: article.value?.title, url: window.location.href })
  }
}

function onCopyLink() {
  if (typeof window !== 'undefined') {
    navigator.clipboard?.writeText(window.location.href)
  }
}
</script>
