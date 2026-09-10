<template>
  <div class="flex flex-1 flex-col">
    <!-- Bandeau d'intro : titre, filtre région, catégories -->
    <section class="bg-primary-dark text-paper">
      <div class="mx-auto max-w-container px-gutter-mobile py-lg md:py-2xl md:px-gutter">
        <p class="text-overline text-accent font-extrabold">ACTUALITÉS DU RÉSEAU</p>

        <div class="mt-md flex flex-col gap-lg lg:flex-row lg:items-end lg:justify-between">
          <h1
            class="max-w-prose font-display text-h2 font-extrabold leading-tight text-lg lg:text-h1"
          >
            Réglementation, formations et vie du réseau
          </h1>

          <Label for="region-select" class="relative block">
            <span class="sr-only">Filtrer par région</span>
            <Select v-model="selectedRegion">
              <SelectTrigger
                id="region-select"
                class="h-control w-full rounded-full border border-white/40 bg-transparent px-lg text-small text-paper focus:ring-paper lg:w-56 font-semibold"
              >
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
              <button
                type="button"
                class="rounded-full border px-lg py-3 text-meta font-semibold capitalize"
                :class="
                  category === selectedCategory
                    ? 'border-paper bg-paper font-semibold text-ink'
                    : 'border-white/35 bg-transparent font-medium text-paper/80 hover:border-paper/40 hover:text-paper'
                "
                :aria-current="category === selectedCategory ? 'true' : undefined"
                @click="selectedCategory = category"
              >
                {{ category }}
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </section>

    <div class="bg-paper-warm">
      <div class="mx-auto w-full max-w-container px-gutter-mobile py-2xl md:px-gutter">
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

          <Card class="mt-md overflow-hidden shadow-md lg:flex">
            <div
              class="flex aspect-16/10 items-center justify-center border-b border-dashed border-outline bg-surface-alt text-center text-small text-ink-muted lg:aspect-auto lg:w-2/5 lg:border-b-0 lg:border-r"
            >
              <NuxtImg
                :src="assetUrl(featuredArticle.cover_image)"
                :alt="featuredArticle.title"
                class="h-full w-full object-cover"
              />
            </div>
            <div class="flex flex-1 flex-col justify-center gap-md bg-paper p-lg lg:p-xl">
              <p class="text-overline text-accent-text">
                <span class="font-bold uppercase">{{ featuredArticle.category }}</span>
                <span class="font-medium text-ink-subtle leading-4">
                  <span class="mx-xs leading-2.5">·</span
                  >{{ formatArticleDate(featuredArticle.publish_at) }}
                  <span class="mx-xs leading-2.5">·</span> {{ readingTime }} min
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
              <p class="text-small text-ink-body lg:text-body">
                {{ featuredArticle.excerpt }}
              </p>
              <NuxtLink
                :to="`/actualites/${featuredArticle.slug}`"
                class="mt-xs text-small font-semibold text-ink transition-colors hover:text-accent-text"
              >
                Lire l'article →
              </NuxtLink>
            </div>
          </Card>
        </section>

        <!-- Grille d'articles -->
        <section aria-label="Dernières actualités" class="mt-4 md:mt-2xl">
          <p v-if="filteredArticles.length === 0" class="text-body text-ink-muted">
            Aucun article dans cette catégorie pour le moment.
          </p>

          <ul v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <li
              v-for="(article, index) in filteredArticles"
              :key="article.slug"
              :class="articleClass(index)"
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

          <!-- Afficher plus — mobile -->
          <div
            v-if="mobileVisibleCount < filteredArticles.length"
            class="flex justify-center lg:hidden my-3.5"
          >
            <Button
              type="button"
              class="h-control rounded-full border border-outline bg-transparent px-xl text-small font-semibold text-ink hover:bg-paper"
              @click="mobileVisibleCount = filteredArticles.length"
            >
              Afficher plus d'articles
            </Button>
          </div>

          <!-- Bandeau newsletter -->
          <section
            aria-labelledby="newsletter-heading"
            class="rounded-md bg-accent/14 p-xl lg:mt-3xl lg:flex lg:items-center lg:justify-between lg:p-2xl"
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
                class="h-control w-full rounded-full border-outline bg-paper px-lg text-small placeholder:text-ink-placeholder sm:w-72"
              />
              <Button
                type="submit"
                class="h-control shrink-0 rounded-full bg-accent px-xl text-small font-bold text-ink hover:bg-accent-text hover:text-paper"
              >
                S'abonner
              </Button>
            </form>
          </section>

          <!-- Pagination desktop -->
          <Pagination
            v-if="filteredArticles.length > perPage"
            v-model:page="currentPage"
            :total="filteredArticles.length"
            :items-per-page="perPage"
            :sibling-count="1"
            class="mt-2xl hidden items-center justify-center lg:flex"
            aria-label="Pagination des actualités"
          >
            <PaginationContent v-slot="{ items }" class="gap-sm">
              <PaginationPrevious
                class="h-control-sm w-control-sm rounded-full border border-primary/25 p-0 text-ink-subtle hover:bg-surface"
              />
              <template v-for="item in items" :key="item.type">
                <PaginationItem
                  v-if="item.type === 'page'"
                  :value="item.value"
                  :is-active="item.value === currentPage"
                  class="rounded-full border border-primary/25 p-0 hover:bg-surface"
                >
                  {{ item.value }}
                </PaginationItem>
                <PaginationEllipsis
                  v-else-if="item.type === 'ellipsis'"
                  class="h-control-sm w-control-sm text-ink-subtle"
                />
              </template>
              <PaginationNext
                class="h-control-sm w-control-sm rounded-full border border-primary/25 p-0 text-ink-body hover:bg-surface"
              />
            </PaginationContent>
          </Pagination>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Article } from '@learnup/types'

const config = useRuntimeConfig()

function assetUrl(id: string | null): string | null {
  if (!id) return null
  return `${config.public.directusUrl}/assets/${id}`
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

const articles = await useDirectusList<Article>('articles', 'actualites-list', {
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
  filter: { status: { _eq: 'published' } },
  sort: ['-publish_at'],
  limit: -1
})

const categoryOptions = computed(() => {
  const categories = new Set(
    (articles.value ?? [])
      .map((article) => article.category)
      .filter((category): category is string => Boolean(category?.trim()))
  )

  return [CATEGORY_ALL, ...Array.from(categories)]
})

const regionOptions = computed(() => {
  const regions = new Set(
    (articles.value ?? [])
      .map((article) => article.region)
      .filter((region): region is string => Boolean(region?.trim()))
  )

  return [
    { value: REGION_ALL, label: 'Toutes les régions' },
    ...Array.from(regions).map((region) => ({ value: region, label: region }))
  ]
})

const featuredArticle = computed<Article | null>(
  () => (articles.value ?? []).find((a) => a.status === 'published') ?? null
)

const readingTime = computed(() => {
  const content = featuredArticle.value?.content ?? ''
  return Math.ceil(content.length / 200)
})

const selectedCategory = ref(CATEGORY_ALL)
const selectedRegion = ref(REGION_ALL)
const currentPage = ref(1)
const perPage = 6
const mobileVisibleCount = ref(3)

const selectedRegionLabel = computed(() => {
  return (
    regionOptions.value.find((r) => r.value === selectedRegion.value)?.label ?? 'Toutes les régions'
  )
})

const filteredArticles = computed(() =>
  (articles.value ?? []).filter(
    (a) =>
      a.status === 'published' &&
      (selectedCategory.value === CATEGORY_ALL || a.category === selectedCategory.value) &&
      (selectedRegion.value === REGION_ALL || a.region === selectedRegion.value)
  )
)

const pageStart = computed(() => (currentPage.value - 1) * perPage)
const pageEnd = computed(() => pageStart.value + perPage)

function articleClass(index: number): string {
  const visibleMobile = index < mobileVisibleCount.value
  const visibleDesktop = index >= pageStart.value && index < pageEnd.value
  if (visibleMobile && visibleDesktop) return ''
  if (visibleDesktop) return 'hidden lg:block'
  if (visibleMobile) return 'block lg:hidden'
  return 'hidden'
}

function formatArticleDate(value: string | null): string {
  if (!value) return 'Date à préciser'
  return new Date(value).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })
}

watch([selectedCategory, selectedRegion], () => {
  currentPage.value = 1
  mobileVisibleCount.value = 3
})

const newsletterEmail = ref('')
function onSubscribe() {
  // Branchement API à venir — la maquette se contente de l'envoi simulé.
  newsletterEmail.value = ''
}
</script>
