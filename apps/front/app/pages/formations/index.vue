<template>
  <div class="flex flex-1 flex-col">
    <!-- Hero / recherche -->
    <section class="border-b border-rule bg-linear-to-b from-paper to-surface">
      <div class="mx-auto px-gutter-mobile py-2xl md:px-gutter">
        <p class="text-overline text-accent-text">Catalogue de formations</p>
        <h1
          class="mt-sm max-w-prose font-display text-h2 font-extrabold leading-tight text-ink lg:text-h1"
        >
          Trouvez la formation adaptée à vos besoins professionnels
        </h1>
        <p v-if="catalog.data.value" class="mt-md max-w-prose text-body text-ink-body">
          {{ catalog.data.value.total }} formations réglementaires et professionnelles, en centre
          partout en France ou dans votre entreprise.
        </p>

        <form
          class="mt-2xl max-w-prose"
          role="search"
          aria-label="Rechercher une formation"
          @submit.prevent="triggerSearch"
        >
          <SearchInput
            v-model="searchQuery"
            input-id="catalogue-search"
            sr-label="Rechercher une formation"
            placeholder="CACES, SST, habilitation électrique, hauteur…"
            button-label="Lancer la recherche"
            class="w-full"
            @submit="triggerSearch"
          >
            <template #icon>
              <IconSparkle :size="18" class="shrink-0 text-accent" />
            </template>
          </SearchInput>
        </form>

        <!-- Barre mobile : filtrer + tri -->
        <div class="mt-lg flex items-center gap-md lg:hidden">
          <Button
            type="button"
            class="h-control gap-sm rounded-full bg-primary px-md text-small font-semibold text-paper hover:bg-primary-dark"
            aria-haspopup="dialog"
            aria-controls="mobile-filter-panel"
            :aria-expanded="isFilterPanelOpen"
            @click="openFilterPanel"
          >
            <IconFilter :size="16" />
            Filtrer
            <span
              v-if="activeFilters.length"
              class="flex h-lg w-lg items-center justify-center rounded-full bg-accent text-meta font-bold text-ink"
            >
              {{ activeFilters.length }}
            </span>
          </Button>
          <Select v-model="sortBy" aria-label="Trier par">
            <SelectTrigger
              aria-label="Trier par"
              class="h-control w-auto gap-sm rounded-full border-outline bg-paper px-md text-small font-semibold text-ink-body shadow-none"
            >
              <span class="truncate">{{ sortLabel }}</span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="option in sortOptions"
                :key="option.value"
                :value="option.value"
                class="text-small"
              >
                {{ option.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- Raccourcis familles -->
        <ul class="mt-2xl hidden grid-cols-1 gap-md sm:grid sm:grid-cols-2 lg:grid-cols-4">
          <li
            v-for="shortcut in familyShortcuts"
            :key="shortcut.slug"
            class="rounded-md border border-rule bg-paper p-lg"
          >
            <p class="font-semibold text-ink">{{ shortcut.label }}</p>
            <p class="mt-xs text-small text-ink-muted">{{ shortcut.caption }}</p>
            <NuxtLink
              :to="shortcut.to"
              class="mt-md inline-block text-small font-semibold text-primary hover:underline"
            >
              {{ shortcut.linkLabel }} →
            </NuxtLink>
          </li>
        </ul>
      </div>
    </section>

    <!-- Filtres + résultats -->
    <section class="mx-auto w-full px-gutter-mobile max-md:pt-0 py-section md:px-gutter">
      <div class="grid grid-cols-1 gap-2xl lg:grid-cols-[260px_1fr]">
        <!-- Sidebar filtres desktop -->
        <aside aria-label="Filtres du catalogue" class="hidden lg:block">
          <div class="flex items-center justify-between">
            <h2 class="font-sans text-h4 font-bold text-ink">Filtres</h2>
            <span class="text-meta text-ink-subtle">
              {{ activeFilters.length ? `${activeFilters.length} actif(s)` : 'Aucun filtre actif' }}
            </span>
          </div>
          <CatalogueFilters
            v-model:families="selectedFamilies"
            v-model:modalities="selectedModalities"
            v-model:location="location"
            v-model:durations="selectedDurations"
            v-model:cpf="cpf"
            v-model:certifying="certifying"
            :family-options="familyOptions"
            location-input-id="loc-desktop"
          />
        </aside>

        <!-- Résultats -->
        <div>
          <!-- Chips filtres actifs -->
          <div v-if="activeFilters.length" class="mt-md lg:mt-0">
            <div class="flex flex-wrap items-center gap-sm">
              <span class="hidden text-meta font-bold tracking-wide text-ink-muted lg:inline">
                Filtres actifs
              </span>
              <span
                v-for="filter in activeFilters"
                :key="`${filter.group}:${filter.key}`"
                class="inline-flex items-center gap-sm rounded-full bg-primary px-md py-xs text-small text-paper"
              >
                {{ filter.label }}
                <button
                  type="button"
                  :aria-label="`Retirer le filtre ${filter.label}`"
                  class="text-paper/70 hover:text-paper"
                  @click="removeFilter(filter)"
                >
                  <IconClose :size="12" />
                </button>
              </span>
            </div>
            <button
              type="button"
              class="mt-sm text-small font-semibold text-primary underline"
              @click="resetFilters"
            >
              Réinitialiser
            </button>
          </div>

          <div class="mt-lg flex flex-wrap items-center justify-between gap-md">
            <h2 class="font-sans text-h4 font-bold text-ink">
              {{ resultCount }}
              {{ resultCount > 1 ? 'formations' : 'formation' }}
              <template v-if="hasActiveCriteria">correspondent</template>
            </h2>
            <div class="hidden items-center gap-sm lg:flex">
              <Label for="sort-desktop" class="text-small font-normal text-ink-body">
                Trier par
              </Label>
              <Select id="sort-desktop" v-model="sortBy">
                <SelectTrigger
                  class="h-auto w-auto gap-sm rounded-full border-outline bg-paper px-md py-sm text-small text-ink-body shadow-none"
                >
                  <span class="truncate">{{ sortLabel }}</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="option in sortOptions"
                    :key="option.value"
                    :value="option.value"
                    class="text-small"
                  >
                    {{ option.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <!-- Chargement : squelette de la liste -->
          <div v-if="catalog.pending.value" aria-label="Chargement des formations">
            <output class="sr-only">Chargement des formations</output>
            <div class="mt-lg flex flex-col gap-lg">
              <div class="h-sm w-2xl animate-pulse rounded-full bg-surface" aria-hidden="true" />
              <div class="grid grid-cols-1 gap-md sm:grid-cols-2">
                <div
                  v-for="i in perPage"
                  :key="i"
                  class="flex flex-col gap-sm rounded-md border border-rule p-lg"
                  aria-hidden="true"
                >
                  <div class="h-xs w-3xl animate-pulse rounded-full bg-accent/30" />
                  <div class="h-xs w-full animate-pulse rounded-full bg-surface" />
                  <div class="h-xs w-3/4 animate-pulse rounded-full bg-surface" />
                  <div class="h-xs w-1/2 animate-pulse rounded-full bg-surface" />
                </div>
              </div>
            </div>
          </div>

          <!-- État vide -->
          <div
            v-else-if="!catalog.error.value && formations.length === 0"
            class="mt-lg flex flex-col items-center rounded-md border border-dashed border-rule bg-surface-soft px-lg py-4xl text-center"
          >
            <IconSearchMinus :size="30" class="text-ink-muted" />
            <h3 class="mt-md font-sans text-h4 font-bold text-ink">
              Aucune formation ne correspond exactement à votre recherche.
            </h3>
            <p class="mt-sm max-w-prose text-small text-ink-body">
              Vous pouvez élargir vos critères, retirer un filtre, ou transmettre votre besoin : une
              réponse adaptée vous sera proposée.
            </p>
            <div class="mt-lg flex flex-wrap justify-center gap-md">
              <Button
                as-child
                class="h-control rounded-full bg-primary px-lg text-small font-semibold text-paper hover:bg-primary-dark"
              >
                <NuxtLink to="#">Être guidé dans mon choix</NuxtLink>
              </Button>
              <Button
                as-child
                variant="outline"
                class="h-control rounded-full border-outline px-lg text-small font-semibold text-ink-body hover:bg-surface"
              >
                <NuxtLink to="#">Parler à un conseiller</NuxtLink>
              </Button>
            </div>
            <div class="mt-lg flex gap-lg text-small font-semibold">
              <button type="button" class="text-primary hover:underline" @click="resetFilters">
                Réinitialiser les filtres
              </button>
              <NuxtLink to="/formations" class="text-primary hover:underline" @click="resetFilters">
                Voir le catalogue complet
              </NuxtLink>
            </div>
          </div>

          <!-- État erreur -->
          <LoadError
            v-else-if="catalog.error.value"
            class="mt-lg"
            title="Le catalogue n'a pas pu être chargé."
            link-to="/formations"
            link-label="Réessayer"
            @retry="catalog.refresh()"
          >
            Vérifiez votre connexion, puis réessayez. Si le problème persiste, le catalogue reste
            accessible.
          </LoadError>

          <!-- Grille résultats -->
          <ul v-else class="mt-lg grid grid-cols-1 gap-md sm:grid-cols-2 xl:grid-cols-3">
            <li v-for="formation in formations" :key="formation.slug">
              <CenterFormationCard
                :family="formation.family"
                :title="formation.title"
                :description="formation.description"
                :meta="formation.meta"
                :to="formation.to ?? undefined"
                class="h-full"
              />
            </li>
          </ul>

          <!-- Pagination desktop -->
          <Pagination
            v-if="!catalog.pending.value && formations.length && catalog.data.value"
            v-model:page="currentPage"
            :total="catalog.data.value.total"
            :items-per-page="perPage"
            :sibling-count="1"
            class="mt-2xl hidden items-center justify-center lg:flex"
            aria-label="Pagination du catalogue"
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

          <!-- Pagination mobile -->
          <button
            v-if="hasMoreMobile"
            type="button"
            class="mx-auto mt-lg block rounded-full border border-outline px-lg py-sm text-small font-semibold text-ink-body hover:bg-surface lg:hidden"
            @click="currentPage += 1"
          >
            Afficher plus de résultats
          </button>
        </div>
      </div>

      <!-- Bandeau CTA -->
      <CtaBanner
        class="mt-2xl"
        title="Vous ne savez pas quelle formation choisir ?"
        text="Décrivez votre besoin : LEARN UP identifie la formation, le format et le lieu adaptés à votre situation."
      >
        <Button
          as-child
          class="h-control w-full rounded-full bg-accent px-lg text-small font-semibold text-ink transition hover:bg-accent-text sm:w-auto"
        >
          <NuxtLink to="#">Être guidé dans mon choix</NuxtLink>
        </Button>
        <Button
          as-child
          variant="outline"
          class="h-control w-full rounded-full border-outline-inverse bg-transparent px-lg text-small font-semibold text-ink-inverse transition hover:bg-transparent hover:text-ink-inverse sm:w-auto"
        >
          <NuxtLink to="#">Parler à un conseiller</NuxtLink>
        </Button>
      </CtaBanner>
    </section>

    <!-- Panneau filtres mobile plein écran -->
    <dialog
      v-if="isFilterPanelOpen"
      id="mobile-filter-panel"
      ref="filterPanel"
      aria-labelledby="mobile-filter-panel-title"
      class="fixed inset-0 z-50 m-0 flex h-full max-h-none w-full max-w-none flex-col bg-paper p-0 lg:hidden"
      @close="isFilterPanelOpen = false"
    >
      <div
        class="flex shrink-0 items-center justify-between border-b border-rule px-gutter-mobile py-md"
      >
        <h2 id="mobile-filter-panel-title" class="font-display text-h3 font-extrabold text-ink">
          Filtres
          <span class="ml-xs align-middle text-small font-medium text-ink-muted">
            {{ activeFilters.length }} actif(s)
          </span>
        </h2>
        <button
          ref="closeFilterButton"
          type="button"
          class="flex h-control-sm w-control-sm items-center justify-center rounded-full border border-outline text-ink-muted hover:bg-surface"
          aria-label="Fermer le panneau de filtres"
          @click="closeFilterPanel"
        >
          <IconClose :size="16" />
        </button>
      </div>

      <div class="flex-1 overflow-y-auto px-gutter-mobile py-lg">
        <CatalogueFilters
          v-model:families="selectedFamilies"
          v-model:modalities="selectedModalities"
          v-model:location="location"
          v-model:durations="selectedDurations"
          v-model:cpf="cpf"
          v-model:certifying="certifying"
          :family-options="familyOptions"
          location-input-id="loc-mobile"
        />
      </div>

      <!-- Barre d'action fixe -->
      <div class="shrink-0 border-t border-rule bg-paper p-md">
        <div class="mx-auto flex w-full gap-md">
          <button
            type="button"
            class="rounded-full border border-outline px-lg py-sm text-small font-semibold text-ink-body hover:bg-surface"
            @click="resetFilters"
          >
            Tout effacer
          </button>
          <button
            type="button"
            class="h-control flex-1 rounded-full bg-primary px-lg text-small font-semibold text-paper hover:bg-primary-dark"
            @click="closeFilterPanel"
          >
            Afficher {{ resultCount }} formation(s)
          </button>
        </div>
      </div>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, watch } from 'vue'
import type { FamilyWithCount, FamilleFormation } from '@learnup/types'
import {
  mapCourse,
  useCatalog,
  type CatalogQuery,
  type FormationItem
} from '~/composables/useCatalog'
import { durationBucketToHours, DURATION_LABELS, MODALITY_LABELS } from '~/utils/catalog-filters'
import { useDirectusClient } from '~/composables/useDirectus'
import { readItems } from '@directus/sdk'

interface SortOption {
  value: 'pertinence' | 'editorial' | 'duree'
  label: string
}

interface ActiveFilter {
  group: 'families' | 'modalities' | 'location' | 'durations' | 'cpf' | 'certifying'
  key: string
  label: string
}

interface FilterOption {
  key: string
  label: string
  count?: number
}

definePageMeta({
  layout: 'with-breadcrumb',
  breadcrumb: [{ label: 'Accueil', to: '/' }, { label: 'Formations' }]
})

useContentSeo(
  {
    seo_title: 'Catalogue de formations — LEARN UP ACADEMY',
    seo_description:
      'Formations réglementaires et professionnelles, en centre partout en France ou dans votre entreprise.'
  },
  'Catalogue de formations — LEARN UP ACADEMY'
)

const route = useRoute()
const router = useRouter()

const searchQuery = ref(typeof route.query.q === 'string' ? route.query.q : '')
const selectedFamilies = ref<string[]>(
  typeof route.query.famille === 'string' ? [route.query.famille] : []
)
const selectedModalities = ref<string[]>([])
const location = ref('')
const selectedDurations = ref<string[]>([])
const cpf = ref(false)
const certifying = ref(false)
const sortBy = ref<SortOption['value']>('editorial')
const isFilterPanelOpen = ref(false)
const filterPanel = ref<HTMLDialogElement | null>(null)
const closeFilterButton = ref<HTMLButtonElement | null>(null)

const perPage = 9
const currentPage = ref(1)

const sortOptions: SortOption[] = [
  { value: 'pertinence', label: 'Pertinence' },
  { value: 'editorial', label: 'Ordre éditorial' },
  { value: 'duree', label: 'Durée' }
]
const sortLabel = computed(() => sortOptions.find((o) => o.value === sortBy.value)?.label ?? '')

// Sync from URL
function parseListParam(value: unknown): string[] {
  if (typeof value === 'string') return value.split(',').filter(Boolean)
  if (Array.isArray(value)) return value.map(String).filter(Boolean)
  return []
}

function parseStringParam(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

const VALID_SORTS: Set<SortOption['value']> = new Set(['pertinence', 'editorial', 'duree'])

function parseSortParam(value: unknown, hasSearch: boolean): SortOption['value'] {
  if (typeof value === 'string' && VALID_SORTS.has(value as SortOption['value'])) {
    return value as SortOption['value']
  }
  return hasSearch ? 'pertinence' : 'editorial'
}

function parsePageParam(value: unknown): number {
  const page = Number(value)
  return Number.isInteger(page) && page > 0 ? page : 1
}

function parseUrl() {
  searchQuery.value = parseStringParam(route.query.q)
  const famille = route.query.famille
  selectedFamilies.value = typeof famille === 'string' ? [famille] : []
  selectedModalities.value = parseListParam(route.query.modalites)
  location.value = parseStringParam(route.query.lieu)
  selectedDurations.value = parseListParam(route.query.duree)
  cpf.value = route.query.cpf === 'true'
  certifying.value = route.query.certifiant === 'true'
  sortBy.value = parseSortParam(route.query.tri, searchQuery.value)
  currentPage.value = parsePageParam(route.query.page)
}

parseUrl()

const catalogQuery = computed<CatalogQuery>(() => {
  const sortMap: Record<
    SortOption['value'],
    { sort?: CatalogQuery['sort']; order?: CatalogQuery['order'] }
  > = {
    pertinence: searchQuery.value ? { sort: 'relevance' } : { sort: 'updatedAt', order: 'desc' },
    editorial: { sort: 'updatedAt', order: 'desc' },
    duree: { sort: 'duration', order: 'asc' }
  }

  const buckets =
    selectedDurations.value.length > 0 ? durationBucketToHours(selectedDurations.value) : undefined

  return {
    search: searchQuery.value || undefined,
    family: selectedFamilies.value[0],
    page: currentPage.value,
    limit: perPage,
    ...sortMap[sortBy.value],
    cpf: cpf.value || undefined,
    certifying: certifying.value || undefined,
    durationMin: buckets?.min,
    durationMax: buckets?.max,
    modalities: selectedModalities.value.length ? selectedModalities.value : undefined,
    location: location.value.trim() || undefined
  }
})

const catalog = await useCatalog(catalogQuery)

const formations = computed<FormationItem[]>(
  () =>
    catalog.data.value?.items.map((course) =>
      mapCourse(course, course.familySlug ? familyNames.value.get(course.familySlug) : undefined)
    ) ?? []
)
const resultCount = computed(() => catalog.data.value?.total ?? 0)
const hasMoreMobile = computed(
  () =>
    !catalog.pending.value &&
    !!catalog.data.value &&
    currentPage.value * perPage < catalog.data.value.total
)

const directus = useDirectusClient()

const { data: directusFamilies } = await useAsyncData<FamilleFormation[]>(
  'catalog-families',
  async () => {
    try {
      return await directus.request(
        readItems('familles_formation', {
          fields: ['slug', 'name'],
          filter: { status: { _eq: 'published' } },
          limit: -1
        })
      )
    } catch (error) {
      if (import.meta.server) {
        logServerError('[formations/index] familles_formation fetch failed:', error)
      }
      return []
    }
  }
)

const { data: familyCounts } = await useAsyncData<FamilyWithCount[]>('family-counts', async () => {
  const config = useRuntimeConfig()
  try {
    return await $fetch<FamilyWithCount[]>(`${config.public.apiBase}/families`)
  } catch (error) {
    if (import.meta.server) {
      logServerError('[formations/index] family counts fetch failed:', error)
    }
    return []
  }
})

const familyNames = computed(() => {
  const map = new Map<string, string>()
  for (const family of directusFamilies.value ?? []) {
    map.set(family.slug, family.name)
  }
  return map
})

const familyOptions = computed<FilterOption[]>(() => {
  const counts = new Map<string, number>()
  for (const item of familyCounts.value ?? []) {
    counts.set(item.slug, item.count)
  }

  const slugs = new Set<string>([
    ...Array.from(familyNames.value.keys()),
    ...Array.from(counts.keys())
  ])

  return Array.from(slugs)
    .map((slug) => ({
      key: slug,
      label: familyNames.value.get(slug) ?? slug,
      count: counts.get(slug) ?? 0
    }))
    .sort((a, b) => b.count - a.count)
})

const familyShortcuts = computed(() => {
  const top = familyOptions.value.slice(0, 3).map((family) => ({
    slug: family.key,
    label: family.label,
    caption: `${family.count} formation${family.count > 1 ? 's' : ''}`,
    linkLabel: 'Voir la famille',
    to: `/formations/${family.key}`
  }))

  return [
    ...top,
    {
      slug: 'all',
      label: 'Toutes les familles',
      caption: 'Management, bureautique, qualité…',
      linkLabel: 'Parcourir',
      to: '/formations'
    }
  ]
})

const activeFilters = computed<ActiveFilter[]>(() => {
  const filters: ActiveFilter[] = []

  for (const key of selectedFamilies.value) {
    const option = familyOptions.value.find((f) => f.key === key)
    filters.push({ group: 'families', key, label: option?.label ?? key })
  }

  for (const key of selectedModalities.value) {
    filters.push({ group: 'modalities', key, label: MODALITY_LABELS[key] ?? key })
  }

  if (location.value.trim()) {
    filters.push({ group: 'location', key: location.value, label: location.value })
  }

  for (const key of selectedDurations.value) {
    filters.push({ group: 'durations', key, label: DURATION_LABELS[key] ?? key })
  }

  if (cpf.value) {
    filters.push({ group: 'cpf', key: 'cpf', label: 'Éligible CPF' })
  }

  if (certifying.value) {
    filters.push({ group: 'certifying', key: 'certifying', label: 'Formation certifiante' })
  }

  return filters
})

const hasActiveCriteria = computed(
  () => activeFilters.value.length > 0 || searchQuery.value.trim().length > 0
)

function removeFilter(filter: ActiveFilter) {
  if (filter.group === 'families') {
    selectedFamilies.value = selectedFamilies.value.filter((key) => key !== filter.key)
  } else if (filter.group === 'modalities') {
    selectedModalities.value = selectedModalities.value.filter((key) => key !== filter.key)
  } else if (filter.group === 'location') {
    location.value = ''
  } else if (filter.group === 'durations') {
    selectedDurations.value = selectedDurations.value.filter((key) => key !== filter.key)
  } else if (filter.group === 'cpf') {
    cpf.value = false
  } else if (filter.group === 'certifying') {
    certifying.value = false
  }
}

function resetFilters() {
  searchQuery.value = ''
  selectedFamilies.value = []
  selectedModalities.value = []
  location.value = ''
  selectedDurations.value = []
  cpf.value = false
  certifying.value = false
  sortBy.value = 'editorial'
  currentPage.value = 1
}

function openFilterPanel() {
  isFilterPanelOpen.value = true
  nextTick(() => {
    filterPanel.value?.showModal()
    closeFilterButton.value?.focus()
  })
}

function closeFilterPanel() {
  filterPanel.value?.close()
  isFilterPanelOpen.value = false
}

function triggerSearch() {
  searchQuery.value = searchQuery.value.trim()
  sortBy.value = searchQuery.value ? 'pertinence' : 'editorial'
  currentPage.value = 1
}

watch(
  [
    searchQuery,
    selectedFamilies,
    selectedModalities,
    location,
    selectedDurations,
    () => cpf.value,
    () => certifying.value,
    sortBy,
    currentPage
  ],
  () => {
    if (currentPage.value < 1) currentPage.value = 1

    const query: Record<string, unknown> = {}
    if (searchQuery.value) query.q = searchQuery.value
    if (selectedFamilies.value.length) query.famille = selectedFamilies.value[0]
    if (selectedModalities.value.length) query.modalites = selectedModalities.value.join(',')
    if (location.value.trim()) query.lieu = location.value.trim()
    if (selectedDurations.value.length) query.duree = selectedDurations.value.join(',')
    if (cpf.value) query.cpf = 'true'
    if (certifying.value) query.certifiant = 'true'
    if (sortBy.value !== 'editorial' || searchQuery.value) query.tri = sortBy.value
    if (currentPage.value > 1) query.page = String(currentPage.value)

    router.replace({ path: route.path, query })
  }
)

watch(isFilterPanelOpen, (open) => {
  if (!import.meta.client) return
  document.body.classList.toggle('overflow-hidden', open)
})

onBeforeUnmount(() => {
  if (import.meta.client) {
    document.body.classList.remove('overflow-hidden')
  }
})
</script>
