<template>
  <div class="flex flex-1 flex-col">
    <!-- Bandeau d'intro : titre, filtre région, catégories -->
    <section class="bg-primary-dark text-paper">
      <div class="mx-auto px-gutter-mobile py-lg md:py-2xl md:px-gutter">
        <p class="text-overline text-accent font-extrabold">ACTUALITÉS DU RÉSEAU</p>

        <div class="mt-md flex flex-col gap-lg lg:flex-row lg:items-end lg:justify-between">
          <h1 class="max-w-prose font-display text-h2 font-extrabold leading-tight lg:text-h1">
            Réglementation, formations et vie du réseau
          </h1>

          <Label for="region-select" class="relative block">
            <span class="sr-only">Filtrer par région</span>
            <Select v-model="regionModel">
              <SelectTrigger id="region-select" variant="inverse" class="lg:w-56">
                <span class="flex min-w-0 items-center gap-sm">
                  <IconMapPin :size="20" class="shrink-0" />
                  <span class="truncate">{{ selectedRegionLabel }}</span>
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="region in regionOptions"
                  :key="region.value"
                  :value="region.value"
                  class="text-small"
                >
                  {{ region.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </Label>
        </div>

        <!-- Filtres catégories -->
        <nav
          aria-label="Filtrer les actualités par catégorie"
          class="-mx-gutter-mobile md:mt-xl hide-scrollbar overflow-x-auto px-gutter-mobile lg:mx-0 lg:px-0 mt-lg"
        >
          <ul class="flex gap-sm whitespace-nowrap">
            <li v-for="category in categoryOptions" :key="category">
              <Button
                type="button"
                :variant="category === selectedCategory ? 'paper' : 'outline-inverse'"
                size="chip"
                class="px-lg py-3 text-meta capitalize"
                :aria-current="category === selectedCategory ? 'true' : undefined"
                @click="setCategory(category)"
              >
                {{ category }}
              </Button>
            </li>
          </ul>
        </nav>
      </div>
    </section>

    <div class="bg-paper-warm">
      <div class="mx-auto w-full px-gutter-mobile py-2xl md:px-gutter">
        <div v-if="articlesPending" aria-label="Chargement des actualités">
          <output class="sr-only">Chargement des actualités</output>
          <div class="grid grid-cols-1 gap-lg lg:grid-cols-3" aria-hidden="true">
            <div class="h-3xl animate-pulse rounded-md bg-surface lg:col-span-3" />
            <div v-for="i in 6" :key="i" class="h-2xl animate-pulse rounded-md bg-surface" />
          </div>
        </div>

        <LoadError
          v-else-if="articlesError"
          title="Les actualités n'ont pas pu être chargées."
          link-to="/actualites"
          link-label="Réessayer"
          @retry="refreshArticles"
        >
          Vérifiez votre connexion, puis réessayez. Si le problème persiste, revenez un peu plus
          tard.
        </LoadError>

        <template v-else>
          <!-- À la une -->
          <section v-if="featuredArticle" aria-labelledby="a-la-une-heading">
            <div class="flex items-center gap-md">
              <h2
                id="a-la-une-heading"
                class="text-overline uppercase text-accent-text font-extrabold"
              >
                À la une
              </h2>
              <div class="h-px flex-1 bg-accent-text/30" aria-hidden="true" />
            </div>

            <Card
              v-reveal
              class="mt-md overflow-hidden transition hover:border-primary/40 hover:shadow-md lg:flex"
            >
              <div
                class="flex aspect-16/10 items-center justify-center border-b border-dashed border-outline bg-surface-alt text-center text-small text-ink-muted lg:aspect-auto lg:w-2/5 lg:border-b-0 lg:border-r"
              >
                <NuxtImg
                  v-if="featuredArticle.cover_image"
                  :src="assetUrl(featuredArticle.cover_image)"
                  :alt="featuredArticle.title"
                  class="h-full w-full object-cover"
                />
                <span v-else>Visuel article à fournir</span>
              </div>
              <div class="flex flex-1 flex-col justify-center gap-md bg-paper p-lg lg:p-xl">
                <p class="text-overline text-accent-text">
                  <span class="font-bold uppercase">{{ featuredArticle.category }}</span>
                  <span class="font-medium text-ink-subtle">
                    <span class="mx-xs">·</span>{{ formatArticleDate(featuredArticle.publish_at) }}
                    <span class="mx-xs">·</span> {{ readingTime }} min
                  </span>
                </p>
                <h3 class="font-display text-h3 font-extrabold leading-snug text-ink lg:text-h2">
                  <NuxtLink
                    :to="`/actualites/${featuredArticle.slug}`"
                    class="transition-colors hover:text-accent-text"
                  >
                    {{ featuredArticle.title }}
                  </NuxtLink>
                </h3>
                <p class="hidden md:block text-small text-ink-body lg:text-body">
                  {{ featuredArticle.excerpt }}
                </p>
                <NuxtLink
                  :to="`/actualites/${featuredArticle.slug}`"
                  class="mt-xs text-small font-semibold text-ink transition-colors hover:text-accent-text"
                >
                  Lire l'article <span class="link-arrow">→</span>
                </NuxtLink>
              </div>
            </Card>
          </section>

          <!-- Grille d'articles -->
          <section aria-label="Dernières actualités" class="mt-4 md:mt-2xl">
            <p v-if="articles.length === 0" class="text-body text-ink-muted">
              Aucun article ne correspond à ces filtres pour le moment.
            </p>

            <ul v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <li
                v-for="(article, index) in articles"
                :key="article.slug"
                v-reveal="revealStagger(index % 3)"
              >
                <ArticleCard
                  :category="article.category ?? 'Actualité'"
                  :title="article.title"
                  :date="formatArticleDate(article.publish_at)"
                  :excerpt="article.excerpt ?? ''"
                  :image-url="assetUrl(article.cover_image) ?? undefined"
                  :to="`/actualites/${article.slug}`"
                  class="h-full"
                />
              </li>
            </ul>

            <!-- Bandeau newsletter -->
            <section
              aria-labelledby="newsletter-heading"
              class="rounded-md bg-accent-soft p-xl mt-xl lg:mt-3xl lg:flex lg:items-center lg:justify-between lg:p-2xl"
            >
              <div class="max-w-prose">
                <h2
                  id="newsletter-heading"
                  class="font-display text-button md:text-h3 font-extrabold text-ink"
                >
                  Recevez les échéances réglementaires
                  <span class="hidden md:inline">qui vous concernent</span>
                </h2>
                <p class="text-small text-ink-body my-3">
                  <span class="md:hidden text-meta"
                    >Un e-mail par mois. Désinscription en un clic.</span
                  >
                  <span class="hidden md:inline"
                    >Un e-mail par mois : obligations, dates limites, nouvelles sessions.
                    Désinscription en un clic.</span
                  >
                </p>
              </div>
              <form
                class="flex flex-col gap-md sm:flex-row lg:mt-0 lg:w-auto lg:shrink-0"
                @submit.prevent="onSubscribe"
              >
                <Label for="newsletter-email" class="sr-only">Adresse e-mail professionnelle</Label>
                <Input
                  id="newsletter-email"
                  v-model="newsletterEmail"
                  type="email"
                  required
                  placeholder="votre@email-professionnel.fr"
                  variant="field-lg"
                  class="sm:w-72"
                />
                <Button
                  type="submit"
                  variant="accent"
                  size="pill-sm"
                  class="w-full shrink-0 px-xl sm:w-auto"
                >
                  S'abonner
                </Button>
              </form>
            </section>

            <!-- Pagination -->
            <Pagination
              v-if="totalItems > perPage"
              v-model:page="pageModel"
              :total="totalItems"
              :items-per-page="perPage"
              :sibling-count="1"
              class="mt-2xl flex items-center justify-center"
              aria-label="Pagination des actualités"
            >
              <PaginationContent v-slot="{ items }" class="gap-sm">
                <PaginationPrevious variant="icon-outline" size="icon-sm" />
                <template
                  v-for="(item, index) in items"
                  :key="item.type === 'page' ? `page-${item.value}` : `ellipsis-${index}`"
                >
                  <PaginationItem
                    v-if="item.type === 'page'"
                    :value="item.value"
                    :is-active="item.value === currentPage"
                    variant="icon-outline"
                  >
                    {{ item.value }}
                  </PaginationItem>
                  <PaginationEllipsis
                    v-else-if="item.type === 'ellipsis'"
                    class="h-control-sm w-control-sm text-ink-subtle"
                  />
                </template>
                <PaginationNext variant="icon-outline" size="icon-sm" />
              </PaginationContent>
            </Pagination>
          </section>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { aggregate, readItems } from '@directus/sdk'
import type { Article } from '@learnup/types'
import { articleAssetUrl, articleReadingTime, formatArticleDate } from '~/utils/article'
import { formatRegionLabel } from '~/utils/region'
import { revealStagger } from '~/utils/reveal'

const config = useRuntimeConfig()
const route = useRoute()

function assetUrl(id: string | null): string | undefined {
  return articleAssetUrl(id, config.public.apiBase) ?? undefined
}

useContentSeo(
  {
    seo_title: 'Actualités — LEARN UP ACADEMY',
    seo_description:
      'Réglementation, nouvelles formations et vie du réseau LEARN UP ACADEMY : toute l’actualité de vos centres.'
  },
  'Actualités — LEARN UP ACADEMY'
)

const CATEGORY_ALL = 'Tout'
const REGION_ALL = 'all'
const perPage = 6
const directus = useDirectusClient()

// Filtres portés par l'URL : partageables, rendus côté serveur et cachés
// par variante grâce à l'ISR `passQuery`.
const selectedCategory = computed(() =>
  typeof route.query.category === 'string' && route.query.category
    ? route.query.category
    : CATEGORY_ALL
)
const selectedRegion = computed(() =>
  typeof route.query.region === 'string' && route.query.region ? route.query.region : REGION_ALL
)
const currentPage = computed(() => {
  const page = Number(route.query.page)
  return Number.isInteger(page) && page > 0 ? page : 1
})

function filtersQuery(patch: { category?: string; region?: string; page?: number }) {
  const category = patch.category ?? selectedCategory.value
  const region = patch.region ?? selectedRegion.value
  const page = patch.page ?? 1
  const query: Record<string, string> = {}
  if (category !== CATEGORY_ALL) query.category = category
  if (region !== REGION_ALL) query.region = region
  if (page > 1) query.page = String(page)
  return query
}

function setCategory(category: string) {
  if (category !== selectedCategory.value) {
    navigateTo({ path: '/actualites', query: filtersQuery({ category }) })
  }
}

const regionModel = computed<string>({
  get: () => selectedRegion.value,
  set: (region) => {
    if (region !== selectedRegion.value) {
      navigateTo({ path: '/actualites', query: filtersQuery({ region }) })
    }
  }
})

const pageModel = computed<number>({
  get: () => currentPage.value,
  set: (page) => {
    if (page !== currentPage.value) {
      navigateTo({ path: '/actualites', query: filtersQuery({ page }) })
    }
  }
})

// Le payload SSR n'est resservi que pendant l'hydratation — ensuite tout
// remount repart sur des données fraîches.
function hydrationCache<T>(
  key: string,
  nuxtApp: ReturnType<typeof useNuxtApp>,
  ctx: { cause: string }
): T | undefined {
  return ctx.cause === 'initial' && nuxtApp.isHydrating
    ? ((nuxtApp.payload.data[key] ?? nuxtApp.static.data[key]) as T | undefined)
    : undefined
}

// À la une : dernier article publié, indépendant des filtres. Seul fetch
// qui charge `content` — il ne sert qu'au temps de lecture de la carte.
const { data: featuredArticle } = await useAsyncData<Article | null>(
  'actualites-featured',
  async () => {
    try {
      const items = await directus.request<Article[]>(
        readItems('articles', {
          fields: [
            'id',
            'status',
            'slug',
            'title',
            'excerpt',
            'category',
            'publish_at',
            'cover_image',
            'content'
          ],
          filter: { status: { _eq: 'published' } },
          sort: ['-publish_at'],
          limit: 1
        })
      )
      return items[0] ?? null
    } catch (error) {
      if (import.meta.server) {
        logServerError('[actualites] featured fetch failed:', error)
      }
      return null
    }
  },
  { getCachedData: hydrationCache<Article | null> }
)

interface ArticleFacet {
  category: string | null
  region: string | null
  count: string | null
}

// Options de filtres : une seule agrégation donne les catégories et les
// régions réellement utilisées, sans charger tous les articles.
const { data: facets } = await useAsyncData<ArticleFacet[]>(
  'actualites-facets',
  async () => {
    try {
      return await directus.request<ArticleFacet[]>(
        aggregate('articles', {
          aggregate: { count: '*' },
          groupBy: ['category', 'region'],
          query: { filter: { status: { _eq: 'published' } } }
        })
      )
    } catch (error) {
      if (import.meta.server) {
        logServerError('[actualites] facets fetch failed:', error)
      }
      return []
    }
  },
  { getCachedData: hydrationCache<ArticleFacet[]> }
)

const categoryOptions = computed(() => {
  const categories = new Set(
    (facets.value ?? [])
      .map((facet) => facet.category)
      .filter((category): category is string => Boolean(category?.trim()))
  )

  return [CATEGORY_ALL, ...Array.from(categories)]
})

const regionOptions = computed(() => {
  const regions = new Set(
    (facets.value ?? [])
      .map((facet) => facet.region)
      .filter((region): region is string => Boolean(region?.trim()))
  )

  return [
    { value: REGION_ALL, label: 'Toutes les régions' },
    ...Array.from(regions).map((region) => ({ value: region, label: formatRegionLabel(region) }))
  ]
})

const selectedRegionLabel = computed(() => {
  return (
    regionOptions.value.find((r) => r.value === selectedRegion.value)?.label ?? 'Toutes les régions'
  )
})

const articlesFilter = computed(() => ({
  _and: [
    { status: { _eq: 'published' } },
    ...(featuredArticle.value ? [{ slug: { _neq: featuredArticle.value.slug } }] : []),
    ...(selectedCategory.value === CATEGORY_ALL
      ? []
      : [{ category: { _eq: selectedCategory.value } }]),
    ...(selectedRegion.value === REGION_ALL ? [] : [{ region: { _eq: selectedRegion.value } }])
  ]
}))

interface ArticleList {
  items: Article[]
  total: number
}

// Liste paginée côté serveur : la clé dépend des filtres et de la page,
// chaque variante est requêtée (et cachée) séparément.
const {
  data: listData,
  pending: articlesPending,
  error: articlesError,
  refresh: refreshArticles
} = await useAsyncData<ArticleList>(
  () =>
    `actualites-list:${JSON.stringify({
      category: selectedCategory.value,
      region: selectedRegion.value,
      page: currentPage.value,
      featured: featuredArticle.value?.slug ?? ''
    })}`,
  async () => {
    const filter = articlesFilter.value
    try {
      const [items, countRows] = await Promise.all([
        directus.request<Article[]>(
          readItems('articles', {
            fields: [
              'id',
              'status',
              'slug',
              'title',
              'excerpt',
              'category',
              'region',
              'publish_at',
              'cover_image'
            ],
            filter,
            sort: ['-publish_at'],
            limit: perPage,
            page: currentPage.value
          })
        ),
        directus.request<{ count: string | null }[]>(
          aggregate('articles', { aggregate: { count: '*' }, query: { filter } })
        )
      ])
      return { items, total: Number(countRows[0]?.count ?? 0) }
    } catch (error) {
      if (import.meta.server) {
        logServerError('[actualites] articles fetch failed:', error)
      }
      throw error
    }
  },
  { getCachedData: hydrationCache<ArticleList> }
)

const articles = computed(() => listData.value?.items ?? [])
const totalItems = computed(() => listData.value?.total ?? 0)

const readingTime = computed(() => {
  return articleReadingTime(featuredArticle.value?.content)
})

const newsletterEmail = ref('')
function onSubscribe() {
  // Branchement API à venir — la maquette se contente de l'envoi simulé.
  newsletterEmail.value = ''
}
</script>
