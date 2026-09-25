<template>
  <div class="bg-paper-warm flex flex-1 flex-col">
    <template v-if="pageState === 'found'">
      <div class="mx-auto w-full px-gutter-mobile py-2xl md:px-gutter">
        <div class="lg:grid lg:grid-cols-12 lg:gap-2xl">
          <article class="lg:col-span-8">
            <header class="max-w-prose">
              <p class="text-overline text-accent-text">
                <span class="font-bold uppercase">{{ article?.category }}</span>
                <span class="font-medium text-ink-subtle">
                  <span class="mx-xs">·</span>{{ formatArticleDate(article?.publish_at) }}
                  <span class="mx-xs">· <span class="md:inline hidden">lecture</span> </span
                  >{{ readingTime }} min
                </span>
              </p>
              <h1
                class="mt-sm font-display text-h2 font-extrabold leading-tight text-ink lg:text-h1"
              >
                {{ article?.title }}
              </h1>
              <div class="mt-md h-xs flex-1 bg-accent w-4xl" aria-hidden="true" />
              <p class="mt-md text-body text-ink-body">{{ article?.excerpt }}</p>
            </header>

            <div class="mt-lg flex items-center justify-between border-y border-rule py-md">
              <div class="flex items-center gap-md">
                <NuxtImg
                  v-if="article?.author_image"
                  class="h-control-sm w-control-sm rounded-full border border-outline object-cover"
                  :src="assetUrl(article.author_image)"
                  :alt="article?.author_name ?? 'Auteur'"
                />
                <span
                  v-else
                  class="flex h-xl w-xl items-center justify-center rounded-full bg-primary text-meta font-semibold text-paper"
                  aria-hidden="true"
                  >{{ article?.author_name?.slice(0, 2).toUpperCase() || 'LU' }}</span
                >
                <div class="text-meta leading-relaxed">
                  <p class="font-semibold text-ink">{{ article?.author_name }}</p>
                  <p class="text-ink-muted">
                    Publié le {{ formatArticleDate(article?.publish_at) }}
                  </p>
                </div>
              </div>
              <div class="flex items-center gap-md text-ink-subtle">
                <ShareMenu
                  :url="shareUrl"
                  :title="article?.title"
                  :text="article?.excerpt ?? undefined"
                />
                <Button
                  type="button"
                  variant="icon-outline"
                  size="icon-sm"
                  :aria-label="linkCopied ? 'Lien copié' : 'Copier le lien de l\'article'"
                  @click="onCopyLink"
                >
                  <IconCheck v-if="linkCopied" :size="18" class="text-success" />
                  <IconLink v-else :size="18" />
                </Button>
                <output class="sr-only" aria-live="polite">{{
                  linkCopied ? 'Lien copié dans le presse-papiers' : ''
                }}</output>
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

            <div class="mt-2xl space-y-xl text-body text-ink-body">
              <div class="post__content" v-html="sanitizedArticle.html"></div>

              <CenterFormationCard
                v-if="relatedFormationCard"
                v-reveal
                class="lg:hidden"
                eyebrow="Formation liée"
                variant="button"
                :sub-family="relatedFormationCard.family"
                :title="relatedFormationCard.title"
                :meta="relatedFormationCard.meta"
                :status="relatedFormationCard.status"
                :to="relatedFormationCard.to ?? undefined"
              />

              <!-- C6 — fin d'article : le thème éditorial est transmis au moteur -->
              <div class="rounded-md border-t-4 border-accent bg-paper p-lg shadow-sm">
                <h2 class="font-sans text-h4 font-bold text-ink">
                  Un besoin de formation sur ce sujet ?
                </h2>
                <p class="mt-sm text-small text-ink-muted">
                  Décrivez votre situation&nbsp;: le moteur recherche les formations correspondantes
                  du catalogue.
                </p>
                <Button
                  class="mt-md h-control rounded-full bg-accent px-lg text-small font-semibold text-ink hover:bg-accent-text hover:text-paper"
                  @click="openAssistant"
                >
                  Décrire mon besoin
                </Button>
              </div>
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
                      :class="
                        activeHeading === heading.id
                          ? 'font-bold text-ink'
                          : 'text-ink-body transition-colors hover:text-accent-text'
                      "
                      @click="activeHeading = heading.id"
                    >
                      {{ heading.label }}
                    </a>
                  </li>
                </ul>
              </Card>

              <CenterFormationCard
                v-if="relatedFormationCard"
                v-reveal
                eyebrow="Formation liée"
                variant="button"
                :sub-family="relatedFormationCard.family"
                :title="relatedFormationCard.title"
                :meta="relatedFormationCard.meta"
                :status="relatedFormationCard.status"
                :to="relatedFormationCard.to ?? undefined"
              />

              <Card variant="dark" class="p-lg">
                <h3 class="text-small font-bold">Un doute sur vos échéances ?</h3>
                <p class="mt-sm text-meta leading-relaxed text-ink-inverse-muted">
                  Transmettez vos dates de délivrance : un conseiller planifie les recyclages en
                  série avec vos équipes.
                </p>
                <Button as-child variant="paper" size="pill" class="mt-lg w-full">
                  <NuxtLink to="/parler-a-votre-conseiller">Parler à votre conseiller</NuxtLink>
                </Button>
              </Card>
            </div>
          </aside>
        </div>
      </div>

      <section aria-labelledby="lire-ensuite-heading" class="bg-paper">
        <div class="mx-auto w-full px-gutter-mobile py-2xl md:px-gutter">
          <div class="flex items-center justify-between">
            <h2 id="lire-ensuite-heading" class="font-display text-h3 font-extrabold text-ink">
              À lire ensuite
            </h2>
            <NuxtLink
              to="/actualites"
              class="hidden text-small font-semibold text-ink transition-colors hover:text-accent-text sm:inline"
            >
              Toute l'actualité <span class="link-arrow">→</span>
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
                  <NuxtLink
                    :to="`/actualites/${related.slug}`"
                    class="transition-colors hover:text-accent-text"
                  >
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
import type { Article, Course } from '@learnup/types'
import { buildMeta, mapCourse, type FormationItem } from '~/composables/useCatalog'
import { useAssistantLauncher } from '~/composables/useAssistantLauncher'
import { articleAssetUrl, articleReadingTime, formatArticleDate } from '~/utils/article'
import { sanitizeHtmlWithHeadings } from '~/utils/sanitizeHtml'
import { copyTextToClipboard } from '~/utils/clipboard'

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
} = await useAsyncData<Article | null>(
  `article-${slug}`,
  async () => {
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
            'related_formation.slug',
            'related_formation.status',
            'related_formation.famille.slug',
            'related_formation.famille.name',
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
  },
  {
    getCachedData: (key, nuxtApp) =>
      (nuxtApp.payload.data[key] ?? nuxtApp.static.data[key]) as Article | null | undefined
  }
)

const article = computed(() => {
  return articleData.value
})

// C6 — le thème de l'article est transmis au panneau comme contexte éditorial.
const assistant = useAssistantLauncher()
function openAssistant() {
  const formation = article.value?.related_formation
  assistant.open({
    context: {
      source: 'editorial',
      theme: article.value?.category ?? article.value?.title ?? undefined,
      formationSlug: typeof formation === 'object' && formation ? formation.slug : undefined
    }
  })
}

interface RelatedFormation {
  course: Course
  familyName: string | null
}

// La relation M2O `related_formation` est résolue directement dans la
// requête article (slug + famille) — reste l'appel API pour la carte.
const { data: relatedFormation } = await useAsyncData<RelatedFormation | null>(
  `article-related-formation-${slug}`,
  async () => {
    const formation = article.value?.related_formation
    if (!formation || typeof formation !== 'object' || formation.status !== 'published') {
      return null
    }
    const famille =
      formation.famille && typeof formation.famille === 'object' ? formation.famille : null
    if (!famille?.slug) return null

    try {
      const course = await $fetch<Course>(
        `${import.meta.server ? config.apiBase : config.public.apiBase}/courses/${encodeURIComponent(famille.slug)}/${encodeURIComponent(formation.slug)}`
      )
      return { course, familyName: famille.name ?? null }
    } catch (error) {
      if (import.meta.server) {
        logServerError(`[actualites/slug] related formation ${formation.slug} load failed:`, error)
      }
      return null
    }
  },
  {
    getCachedData: (key, nuxtApp) =>
      (nuxtApp.payload.data[key] ?? nuxtApp.static.data[key]) as RelatedFormation | null | undefined
  }
)

const relatedFormationCard = computed<FormationItem | null>(() => {
  const related = relatedFormation.value
  if (!related) return null

  // Méta courte (durée + modalités), sans certification — comme les
  // cartes « formations similaires » de la fiche formation.
  return {
    ...mapCourse(related.course, related.familyName ?? undefined),
    meta: buildMeta(related.course, false)
  }
})

const readingTime = computed(() => {
  return articleReadingTime(article.value?.content)
})

const activeHeading = ref<string | null>(null)

const sanitizedArticle = computed(() => sanitizeHtmlWithHeadings(article.value?.content ?? ''))
const articleHeadings = computed(() => sanitizedArticle.value.headings)

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
  () =>
    pageState.value === 'found' && article.value ? article.value : seoByState[pageState.value],
  () =>
    pageState.value === 'found'
      ? `${article.value?.title ?? 'Article'} | LEARN UP ACADEMY`
      : seoByState[pageState.value].seo_title
)

function retry() {
  if (route.query.error === '1') {
    const { error: _error, ...query } = route.query
    navigateTo({ path: route.path, query })
  } else {
    refresh()
  }
}

function onErrorSearch(query: string) {
  navigateTo({ path: '/actualites', query: query ? { q: query } : {} })
}

function assetUrl(id: string | null): string | undefined {
  return articleAssetUrl(id, config.public.apiBase) ?? undefined
}

const linkCopied = ref(false)
let linkCopiedTimer: ReturnType<typeof setTimeout> | undefined

// Lien de partage « propre » : origine + chemin, sans query (?from=,
// ?category=, ?error=1) ni ancre du sommaire. Vide en SSR — les actions
// partager/copier ne sont utilisables que côté client.
const shareUrl = computed(() =>
  typeof window === 'undefined' ? '' : `${window.location.origin}${route.path}`
)

async function onCopyLink() {
  if (typeof window === 'undefined') return
  if (!(await copyTextToClipboard(shareUrl.value))) return
  linkCopied.value = true
  clearTimeout(linkCopiedTimer)
  linkCopiedTimer = setTimeout(() => {
    linkCopied.value = false
  }, 2000)
}

onScopeDispose(() => clearTimeout(linkCopiedTimer))
</script>
