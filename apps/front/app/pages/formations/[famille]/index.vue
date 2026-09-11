<template>
  <div class="bg-white flex flex-1 flex-col">
    <template v-if="pageState === 'found'">
      <!-- Hero / intro famille -->
      <section class="border-b border-rule bg-linear-to-b from-paper to-surface">
        <div class="mx-auto max-w-container px-gutter-mobile py-section md:px-gutter">
          <div class="grid grid-cols-1 items-start gap-2xl lg:grid-cols-5">
            <div class="lg:col-span-3">
              <p class="text-overline text-accent-text">Famille de formations</p>
              <h1
                class="mt-sm font-display text-h2 font-extrabold leading-tight text-ink lg:text-h1"
              >
                {{ familleData?.name }}
              </h1>
              <div
                v-if="familleData?.intro"
                class="mt-md max-w-prose text-body text-ink-body"
                v-html="sanitizeHtml(familleData.intro)"
              />

              <ul class="mt-lg flex flex-wrap gap-sm">
                <Badge as="li" variant="chip">{{ resultCount }} formations</Badge>
                <Badge v-for="m in familyModalities" :key="m" as="li" variant="chip">
                  {{ m }}
                </Badge>
                <Badge v-if="familySessionBadge" as="li" variant="success">
                  <span class="h-sm w-sm rounded-full bg-current" aria-hidden="true" />
                  {{ familySessionBadge }}
                </Badge>
              </ul>
            </div>

            <figure
              class="aspect-video w-full rounded-md lg:col-span-2 lg:aspect-4/3"
              :class="
                heroImage
                  ? 'overflow-hidden'
                  : 'flex items-center justify-center border border-dashed border-outline bg-surface-alt'
              "
            >
              <img
                v-if="heroImage"
                :src="heroImage"
                :alt="familleData?.name ?? ''"
                class="h-full w-full object-cover"
              />
              <figcaption v-else class="px-lg text-center text-meta text-ink-muted">
                {{ familleData?.name }}
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      <!-- Liste des formations -->
      <section
        id="liste-formations"
        class="mx-auto w-full max-w-container scroll-mt-lg px-gutter-mobile py-section md:px-gutter"
        aria-labelledby="liste-title"
      >
        <div class="flex flex-col gap-md md:flex-row md:items-center md:justify-between">
          <h2 id="liste-title" class="font-sans text-h4 font-bold text-ink">
            {{ resultCount }}
            {{ resultCount > 1 ? 'formations' : 'formation' }} dans cette famille
          </h2>

          <div class="flex flex-wrap gap-sm">
            <Select v-model="selectedModality" aria-label="Filtrer par modalité">
              <SelectTrigger
                aria-label="Modalité"
                class="h-control w-auto gap-sm rounded-full border-outline bg-paper px-md text-small font-semibold text-ink-body shadow-none"
              >
                <span class="truncate">{{ modalityFilterLabel }}</span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="option in modalityOptions"
                  :key="option.value"
                  :value="option.value"
                  class="text-small"
                >
                  {{ option.label }}
                </SelectItem>
              </SelectContent>
            </Select>

            <Select v-model="selectedLocation" aria-label="Filtrer par localisation">
              <SelectTrigger
                aria-label="Localisation"
                class="h-control w-auto gap-sm rounded-full border-outline bg-paper px-md text-small font-semibold text-ink-body shadow-none"
              >
                <span class="truncate">{{ locationFilterLabel }}</span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="option in locationOptions"
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

        <!-- État vide -->
        <div
          v-if="!catalog.pending.value && formations.length === 0"
          class="mt-lg flex flex-col items-center rounded-md border border-dashed border-rule bg-surface-soft px-lg py-4xl text-center"
        >
          <IconSearchMinus :size="30" class="text-ink-muted" />
          <h3 class="mt-md font-sans text-h4 font-bold text-ink">
            Aucune formation ne correspond à ces critères.
          </h3>
          <p class="mt-sm max-w-prose text-small text-ink-body">
            Élargissez vos critères ou transmettez votre besoin : une réponse adaptée vous sera
            proposée.
          </p>
          <button
            type="button"
            class="mt-lg text-small font-semibold text-primary transition-colors hover:text-accent-text"
            @click="resetPage"
          >
            Réinitialiser
          </button>
        </div>

        <!-- État erreur -->
        <LoadError
          v-else-if="catalog.error.value"
          class="mt-lg"
          title="Le catalogue n'a pas pu être chargé."
          link-to="/formations"
          link-label="Voir le catalogue"
          @retry="catalog.refresh()"
        >
          Vérifiez votre connexion, puis réessayez. Si le problème persiste, le catalogue reste
          accessible.
        </LoadError>

        <!-- Grille résultats -->
        <ul
          v-else-if="!catalog.pending.value"
          class="mt-lg grid grid-cols-1 gap-md md:grid-cols-2 lg:grid-cols-3"
        >
          <li v-for="formation in formations" :key="formation.slug">
            <CenterFormationCard
              :family="formation.family"
              :title="formation.title"
              :description="formation.description"
              :meta="formation.meta"
              :status="formation.status"
              :to="formation.to ?? undefined"
              class="h-full"
            />
          </li>
        </ul>

        <!-- Skeleton -->
        <div v-else class="mt-lg grid grid-cols-1 gap-md md:grid-cols-2 lg:grid-cols-3">
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

        <Pagination
          v-if="!catalog.pending.value && catalog.data.value && catalog.data.value.total > perPage"
          v-model:page="currentPage"
          :total="catalog.data.value.total"
          :items-per-page="perPage"
          :sibling-count="1"
          class="mt-2xl flex items-center justify-center"
          aria-label="Pagination du catalogue"
        >
          <PaginationContent v-slot="{ items }" class="gap-sm">
            <PaginationPrevious
              class="h-control-sm w-control-sm rounded-full border border-primary/25 p-0 text-ink-subtle hover:bg-surface"
            />
            <template
              v-for="(item, index) in items"
              :key="item.type === 'page' ? item.value : `ellipsis-${index}`"
            >
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

      <!-- Bandeau CTA -->
      <section class="mx-auto w-full max-w-container px-gutter-mobile pb-section md:px-gutter">
        <CtaBanner
          title="Quelle catégorie pour vos équipes ?"
          text="Décrivez vos engins et votre site : LEARN UP identifie les recommandations et catégories applicables."
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
            <NuxtLink :to="`/centres/demande-de-formation?famille=${famille}`"
              >Faire une demande</NuxtLink
            >
          </Button>
        </CtaBanner>
      </section>
    </template>

    <!-- État : erreur de chargement -->
    <LoadError
      v-else-if="loadError"
      title="Le contenu n'a pas pu être chargé."
      link-to="/formations"
      link-label="Voir le catalogue"
      @retry="retry"
    >
      Vérifiez votre connexion, puis réessayez. Si le problème persiste, le catalogue reste
      accessible.
    </LoadError>

    <!-- État : famille introuvable -->
    <NotFound
      v-else
      title="Cette famille de formations n'est pas disponible."
      primary-to="/formations"
      primary-label="Voir le catalogue"
      secondary-to="#"
      secondary-label="Être guidé dans mon choix"
      search-placeholder="Intitulé, compétence ou certification"
      search-label="Rechercher une formation"
      search-input-id="famille-search"
      @search="onErrorSearch"
    >
      <template #icon>
        <IconFileOff :size="32" class="text-ink" />
      </template>
      La page demandée n'existe pas ou n'est plus publiée. Le catalogue présente l'ensemble des
      familles de formations actuellement proposées.
    </NotFound>
  </div>
</template>

<script setup lang="ts">
import { readItems } from '@directus/sdk'
import type { FamilleFormation } from '@learnup/types'
import {
  buildSessionBadge,
  mapCourse,
  useCatalog,
  type CatalogQuery,
  type FormationItem
} from '~/composables/useCatalog'
import { useDirectusClient } from '~/composables/useDirectus'
import { MODALITY_LABELS, MODALITY_OPTIONS } from '~/utils/catalog-filters'
import { sanitizeHtml } from '~/utils/sanitizeHtml'

definePageMeta({
  layout: 'with-breadcrumb'
})

const route = useRoute()
const famille = route.params.famille as string

const directus = useDirectusClient()

const {
  data: familleData,
  error: loadError,
  refresh
} = await useAsyncData<FamilleFormation | null>(`famille-${famille}`, async () => {
  try {
    const results = await directus.request<FamilleFormation[]>(
      readItems('familles_formation', {
        filter: { slug: { _eq: famille }, status: { _eq: 'published' } },
        limit: 1
      })
    )
    return results[0] ?? null
  } catch (error) {
    if (import.meta.server) {
      logServerError(`[formations/famille] ${famille} load failed:`, error)
    }
    throw error
  }
})

type PageState = 'found' | 'not-found' | 'error'
const pageState = computed<PageState>(() => {
  if (loadError.value) return 'error'
  return familleData.value ? 'found' : 'not-found'
})

const requestEvent = useRequestEvent()
if (requestEvent) {
  if (pageState.value === 'error') {
    setResponseStatus(requestEvent, 500, 'Erreur de chargement de la famille')
  } else if (pageState.value === 'not-found') {
    setResponseStatus(requestEvent, 404, 'Famille introuvable')
  }
}

const stateLabels: Record<Exclude<PageState, 'found'>, string> = {
  'not-found': 'Famille introuvable',
  error: 'Erreur de chargement'
}

const defaultBreadcrumb = computed(() => [
  { label: 'Accueil', to: '/' },
  { label: 'Formations', to: '/formations' },
  { label: familleData.value?.name ?? famille }
])

watchEffect(() => {
  const stateLabel = pageState.value === 'found' ? null : stateLabels[pageState.value]
  route.meta.breadcrumb = stateLabel
    ? [
        { label: 'Accueil', to: '/' },
        { label: 'Formations', to: '/formations' },
        { label: stateLabel }
      ]
    : defaultBreadcrumb.value
})

useContentSeo(
  () => {
    const isFound = pageState.value === 'found'
    const stateLabel = isFound ? null : stateLabels[pageState.value]
    const title = stateLabel ?? familleData.value?.name ?? famille

    return {
      seo_title: isFound
        ? (familleData.value?.seo_title ?? `${title} — Formations | LEARN UP ACADEMY`)
        : title,
      seo_description: isFound
        ? (familleData.value?.seo_description ??
          `Formations ${familleData.value?.name ?? famille} en centre ou sur site.`)
        : undefined,
      seo_canonical: isFound ? familleData.value?.seo_canonical : undefined,
      seo_noindex: !isFound
    }
  },
  () => {
    const isFound = pageState.value === 'found'
    const stateLabel = isFound ? null : stateLabels[pageState.value]
    return stateLabel ?? `${familleData.value?.name ?? famille} — Formations | LEARN UP ACADEMY`
  }
)

function retry() {
  if (route.query.error === '1') {
    const cleanQuery = Object.fromEntries(
      Object.entries(route.query).filter(([key]) => key !== 'error')
    )
    navigateTo({ path: route.path, query: cleanQuery })
    return
  }
  refresh()
}

function onErrorSearch(query: string) {
  navigateTo({ path: '/formations', query: query ? { q: query } : {} })
}

const perPage = 9
const currentPage = ref(1)

// Filtres inline au-dessus de la liste — modalité et localisation sont
// appliqués côté API (params `modalities` et `location`).
const selectedModality = ref('all')
const selectedLocation = ref('all')

const modalityOptions = [
  { value: 'all', label: 'Modalité' },
  ...MODALITY_OPTIONS.map((o) => ({ value: o.key, label: o.label }))
]

// Options de localisation dérivées de la requête facettes (toute la
// famille, pas seulement la page courante). La valeur active est conservée
// dans la liste pour permettre de revenir en arrière.
const locationOptions = computed(() => {
  const set = new Set<string>()
  for (const item of facets.data.value?.items ?? []) {
    for (const session of item.sessions ?? []) {
      const loc = session.location?.region ?? session.location?.city
      if (loc) set.add(loc)
    }
  }
  if (selectedLocation.value !== 'all') set.add(selectedLocation.value)

  return [
    { value: 'all', label: 'Localisation' },
    ...[...set].sort((a, b) => a.localeCompare(b)).map((loc) => ({ value: loc, label: loc }))
  ]
})

const modalityFilterLabel = computed(
  () => modalityOptions.find((o) => o.value === selectedModality.value)?.label ?? 'Modalité'
)
const locationFilterLabel = computed(
  () =>
    locationOptions.value.find((o) => o.value === selectedLocation.value)?.label ?? 'Localisation'
)

const catalogQuery = computed<CatalogQuery>(() => ({
  family: famille,
  page: currentPage.value,
  limit: perPage,
  sort: 'updatedAt',
  order: 'desc',
  modalities: selectedModality.value !== 'all' ? [selectedModality.value] : undefined,
  location: selectedLocation.value !== 'all' ? selectedLocation.value : undefined
}))

// Requête « facettes » : badges du hero et options de localisation doivent
// refléter toute la famille, pas seulement les 9 items de la page courante.
const facets = await useCatalog({ family: famille, page: 1, limit: 100 })

const catalog = await useCatalog(catalogQuery)

const familyName = computed(() => familleData.value?.name ?? famille)

const formations = computed<FormationItem[]>(
  () => catalog.data.value?.items.map((course) => mapCourse(course, familyName.value)) ?? []
)
const resultCount = computed(() => catalog.data.value?.total ?? 0)

// Visuel éditorial de la famille — champ `image` (fichier Directus)
// résolu via le proxy /directus/assets de l'API. Repli : placeholder avec le nom.
const config = useRuntimeConfig()
const heroImage = computed(() =>
  familleData.value?.image
    ? `${config.public.apiBase}/directus/assets/${familleData.value.image}`
    : null
)

// Tags du hero : modalités présentes dans la famille + badge sessions
// (« ce mois-ci » / « programmées ») dérivé des sessions API — calculés
// sur la requête facettes pour couvrir toute la famille.
const familyModalities = computed(() => {
  const set = new Set<string>()
  for (const item of facets.data.value?.items ?? []) {
    for (const m of item.modalities ?? []) set.add(m)
  }
  return [...set].map((m) => MODALITY_LABELS[m] ?? m)
})

const familySessionBadge = computed(() => {
  const items = facets.data.value?.items ?? []
  for (const course of items) {
    const badge = buildSessionBadge(course)
    if (badge === 'Sessions ce mois-ci') return badge
  }
  for (const course of items) {
    const badge = buildSessionBadge(course)
    if (badge) return badge
  }
  return null
})

function resetPage() {
  // Le watch de catalogQuery relance déjà la requête quand la page ou les
  // filtres changent : n'appeler refresh() que si rien n'a changé.
  const queryWillChange =
    currentPage.value !== 1 || selectedModality.value !== 'all' || selectedLocation.value !== 'all'
  selectedModality.value = 'all'
  selectedLocation.value = 'all'
  currentPage.value = 1
  if (!queryWillChange) catalog.refresh()
}
</script>
