<template>
  <div class="flex flex-1 flex-col">
    <!-- Bandeau d'intro : titre, filtre région, catégories -->
    <section class="bg-primary-dark text-paper">
      <div class="mx-auto max-w-container px-gutter-mobile py-2xl md:px-gutter">
        <p class="text-overline text-accent">Actualités du réseau</p>

        <div class="mt-md flex flex-col gap-lg lg:flex-row lg:items-end lg:justify-between">
          <h1 class="max-w-prose font-display text-h2 font-extrabold leading-tight lg:text-h1">
            Réglementation, formations et vie du réseau
          </h1>

          <Label for="region-select" class="relative block">
            <span class="sr-only">Filtrer par région</span>
            <Select v-model="selectedRegion">
              <SelectTrigger
                id="region-select"
                class="h-control w-full rounded-full border border-paper/20 bg-transparent px-lg text-small text-paper focus:ring-paper lg:w-56"
              >
                <span class="truncate">{{ selectedRegionLabel }}</span>
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
          class="-mx-gutter-mobile mt-xl overflow-x-auto px-gutter-mobile lg:mx-0 lg:px-0"
        >
          <ul class="flex gap-sm whitespace-nowrap">
            <li v-for="category in categoryOptions" :key="category">
              <button
                type="button"
                class="rounded-full border px-lg py-sm text-small"
                :class="
                  category === selectedCategory
                    ? 'border-paper bg-paper font-semibold text-ink'
                    : 'border-paper/20 bg-transparent font-medium text-paper/80 hover:border-paper/40 hover:text-paper'
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
            <h2 id="a-la-une-heading" class="text-overline uppercase text-accent-text">À la une</h2>
            <div class="h-px flex-1 bg-accent-text/30" aria-hidden="true" />
          </div>

          <Card class="mt-md overflow-hidden lg:flex">
            <div
              class="flex aspect-16/10 items-center justify-center border-b border-dashed border-outline bg-surface-alt text-center text-small text-ink-muted lg:aspect-auto lg:w-2/5 lg:border-b-0 lg:border-r"
            >
              {{ featuredArticle.imageLabel }}
            </div>
            <div class="flex flex-1 flex-col justify-center gap-md p-lg lg:p-2xl">
              <p class="text-overline text-accent-text">
                <span class="font-bold uppercase">{{ featuredArticle.category }}</span>
                <span class="font-medium text-ink-subtle">
                  <span class="mx-xs">·</span>{{ featuredArticle.date }} <span class="mx-xs">·</span
                  >{{ featuredArticle.readingTime }}
                </span>
              </p>
              <h3 class="font-display text-h3 font-extrabold leading-snug text-ink lg:text-h2">
                <NuxtLink :to="`/actualites/${featuredArticle.slug}`" class="hover:underline">
                  {{ featuredArticle.title }}
                </NuxtLink>
              </h3>
              <p class="text-small text-ink-body lg:text-body">
                {{ featuredArticle.excerpt }}
              </p>
              <NuxtLink
                :to="`/actualites/${featuredArticle.slug}`"
                class="mt-xs text-small font-semibold text-ink hover:underline"
              >
                Lire l'article →
              </NuxtLink>
            </div>
          </Card>
        </section>

        <!-- Grille d'articles -->
        <section aria-label="Dernières actualités" class="mt-2xl">
          <p v-if="filteredArticles.length === 0" class="text-body text-ink-muted">
            Aucun article dans cette catégorie pour le moment.
          </p>

          <ul v-else class="grid grid-cols-1 gap-lg sm:grid-cols-2 lg:grid-cols-3">
            <li
              v-for="(article, index) in filteredArticles"
              :key="article.slug"
              :class="articleClass(index)"
            >
              <ArticleCard
                :category="article.category"
                :title="article.title"
                :date="article.date"
                :excerpt="article.excerpt"
                :image-label="article.imageLabel"
                :to="`/actualites/${article.slug}`"
                class="h-full"
              />
            </li>
          </ul>

          <!-- Afficher plus — mobile -->
          <div
            v-if="mobileVisibleCount < filteredArticles.length"
            class="mt-2xl flex justify-center lg:hidden"
          >
            <Button
              type="button"
              class="h-control rounded-full border border-outline bg-transparent px-xl text-small font-semibold text-ink hover:bg-paper"
              @click="mobileVisibleCount = filteredArticles.length"
            >
              Afficher plus d'articles
            </Button>
          </div>

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
              <template v-for="item in items" :key="item.value">
                <PaginationItem
                  v-if="item.type === 'page'"
                  :value="item.value"
                  :is-active="item.value === currentPage"
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

        <!-- Bandeau newsletter -->
        <section
          aria-labelledby="newsletter-heading"
          class="mt-2xl rounded-md bg-accent/14 p-xl lg:mt-3xl lg:flex lg:items-center lg:justify-between lg:p-2xl"
        >
          <div class="max-w-prose">
            <h2 id="newsletter-heading" class="font-display text-h3 font-extrabold text-ink">
              Recevez les échéances réglementaires qui vous concernent
            </h2>
            <p class="mt-xs text-small text-ink-body">
              Un e-mail par mois : obligations, dates limites, nouvelles sessions. Désinscription en
              un clic.
            </p>
          </div>
          <form
            class="mt-lg flex flex-col gap-md sm:flex-row lg:mt-0 lg:w-auto lg:shrink-0"
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
              class="h-control shrink-0 rounded-full bg-accent px-xl text-small font-semibold text-ink hover:bg-accent-text hover:text-paper"
            >
              S'abonner
            </Button>
          </form>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
useContentSeo(
  {
    seo_title: 'Actualités — LEARN UP ACADEMY',
    seo_description:
      'Réglementation, nouvelles formations et vie du réseau LEARN UP ACADEMY : toute l’actualité de vos centres.'
  },
  'Actualités — LEARN UP ACADEMY'
)

interface ActuArticle {
  slug: string
  category: string
  source: string
  region: string
  date: string
  readingTime?: string
  title: string
  excerpt: string
  imageLabel: string
}

// Maquette : données statiques en attendant le branchement Directus (collection articles).
const CATEGORY_ALL = 'Tout'
const categoryOptions = [
  CATEGORY_ALL,
  'Réglementation & obligations',
  'Nouvelles formations',
  'Vie du réseau'
]

const REGION_ALL = 'all'

const regionOptions = [
  { value: REGION_ALL, label: 'Toutes les régions' },
  { value: 'ile-de-france', label: 'Île-de-France' },
  { value: 'occitanie', label: 'Occitanie' },
  { value: 'auvergne-rhone-alpes', label: 'Auvergne-Rhône-Alpes' }
]

const featuredArticle: ActuArticle = {
  slug: 'recyclage-caces-echeances-2027',
  category: 'Réglementation & obligations',
  source: 'Réglementation & obligations',
  region: '',
  date: '2 septembre 2026',
  readingTime: '4 min',
  title: 'Recyclage CACES : comment anticiper les échéances 2027 sans immobiliser vos équipes',
  excerpt:
    'Un volume important de CACES® délivrés en 2022 arrive à échéance en 2027. Planifier les recyclages dès maintenant permet d’étaler les absences et de garantir la continuité des autorisations de conduite.',
  imageLabel: 'Photo réelle — plateau technique'
}

const articles: ActuArticle[] = [
  {
    slug: 'plateau-pemp-creteil',
    category: 'Vie du réseau',
    source: 'Centre de Créteil',
    region: 'ile-de-france',
    date: '26 août 2026',
    title: 'Nouveau plateau technique nacelles PEMP à Créteil',
    excerpt:
      'Quatre nacelles de catégories A et B pour les formations R486, en initial et recyclage.',
    imageLabel: 'Photo — nouvelle PEMP'
  },
  {
    slug: 'ouverture-centre-cergy',
    category: 'Vie du réseau',
    source: 'Vie du réseau',
    region: 'ile-de-france',
    date: '21 août 2026',
    title: 'Un nouveau centre ouvre à Cergy-Pontoise',
    excerpt:
      'Le réseau compte un 43e centre en Île-de-France, orienté logistique et conduite d’engins.',
    imageLabel: 'Photo — ouverture de centre'
  },
  {
    slug: 'habilitations-nf-c-18-510',
    category: 'Réglementation & obligations',
    source: 'Réglementation & obligations',
    region: '',
    date: '14 août 2026',
    title: 'Habilitations électriques : ce que change la nouvelle NF C 18-510',
    excerpt: 'Points de vigilance pour les employeurs de vos calendriers d’application.',
    imageLabel: 'Photo — habilitation électrique'
  },
  {
    slug: 'mac-sst-occitanie',
    category: 'Nouvelles formations',
    source: 'Nouvelles formations',
    region: 'occitanie',
    date: '7 août 2026',
    title: 'MAC SST : de nouvelles sessions chaque semaine en Occitanie',
    excerpt:
      'Le maintien-actualisation des compétences passe à un rythme hebdomadaire à Toulouse et Montpellier.',
    imageLabel: 'Photo — session SST'
  },
  {
    slug: 'aipr-qui-former',
    category: 'Réglementation & obligations',
    source: 'Réglementation & obligations',
    region: '',
    date: '31 juillet 2026',
    title: 'AIPR : qui doit être formé sur vos chantiers ?',
    excerpt: 'Opérateur, encadrant, concepteur : les bons profils et leurs obligations.',
    imageLabel: 'Photo — chantier AIPR'
  },
  {
    slug: 'portes-ouvertes-vitry',
    category: 'Vie du réseau',
    source: 'Centre de Vitry-sur-Seine',
    region: 'ile-de-france',
    date: '24 juillet 2026',
    title: 'Portes ouvertes : découvrez le plateau logistique de Vitry',
    excerpt: 'Démonstrations R485 et R489, échanges avec les formateurs le 20 septembre.',
    imageLabel: 'Photo — entrepôt logistique'
  },
  {
    slug: 'session-caces-lyon-septembre',
    category: 'Nouvelles formations',
    source: 'Nouvelles formations',
    region: 'auvergne-rhone-alpes',
    date: '1 sept. 2026',
    title: 'Nouvelles sessions CACES ouvertes à Lyon',
    excerpt:
      'Le centre de Lyon ouvre de nouvelles dates en septembre pour les recyclages R489, R482 et R486.',
    imageLabel: 'Photo — session CACES Lyon'
  }
]

const selectedCategory = ref(CATEGORY_ALL)
const selectedRegion = ref(REGION_ALL)
const currentPage = ref(1)
const perPage = 6
const mobileVisibleCount = ref(3)

const selectedRegionLabel = computed(
  () => regionOptions.find((r) => r.value === selectedRegion.value)?.label ?? regionOptions[0].label
)

const filteredArticles = computed(() =>
  articles.filter(
    (a) =>
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
