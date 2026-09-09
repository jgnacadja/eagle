<template>
  <div class="flex flex-1 flex-col">
    <!-- Top surface section: heading and description -->
    <section class="shrink-0 bg-surface-soft">
      <div class="mx-auto max-w-container px-gutter-mobile md:px-gutter pb-lg pt-section">
        <p class="text-overline text-accent-text">LE RÉSEAU LEARN UP</p>
        <h1 class="mt-sm font-display text-h2 font-extrabold text-ink lg:text-h1">
          Réseau de centres
        </h1>
        <p class="mt-sm max-w-prose text-body text-ink-body">
          {{ centresCount }} centre{{ centresCount > 1 ? 's' : '' }} couvrent
          {{ departmentsCount }} département{{ departmentsCount > 1 ? 's' : '' }}. La sélection d'un
          département affiche les centres de ce territoire.
        </p>
      </div>
    </section>

    <!-- Barre de recherche/filtres : épinglée en haut sur desktop -->
    <section class="shrink-0 bg-surface-soft lg:sticky lg:top-0 lg:z-30">
      <div class="mx-auto max-w-container px-gutter-mobile md:px-gutter pb-lg">
        <div class="flex flex-col gap-md">
          <div class="flex flex-col gap-md sm:flex-row sm:items-center sm:justify-between">
            <div class="flex flex-col gap-md sm:flex-row sm:items-center">
              <Label for="dept-select" class="relative block">
                <span class="sr-only">Sélectionner un département</span>
                <Select v-model="selectedDept">
                  <SelectTrigger
                    id="dept-select"
                    class="h-control w-full rounded-full border border-outline bg-paper px-lg text-small font-medium text-ink focus:ring-outline sm:w-64"
                  >
                    <span class="truncate">{{ selectedDeptLabel }}</span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" class="text-small">Tous les départements</SelectItem>
                    <SelectItem
                      v-for="dept in departments"
                      :key="dept"
                      :value="dept"
                      class="text-small"
                    >
                      {{ dept }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </Label>

              <SearchInput
                v-model="searchQuery"
                input-id="city-search"
                sr-label="Rechercher par ville ou code postal"
                placeholder="Ville ou code postal"
                :loading="centresPending"
                class="w-full sm:w-72"
                @submit="onSearch"
              />
            </div>

            <div class="flex items-center justify-between gap-sm">
              <p class="text-small text-ink">
                <template v-if="filteredCenters.length === 0">
                  Aucun centre
                  <template v-if="selectedDept === 'all'">au total</template>
                  <template v-else>dans le département</template>
                  <span v-if="selectedDept !== 'all'" class="font-extrabold">{{
                    selectedDept
                  }}</span>
                </template>
                <template v-else>
                  <span class="font-extrabold">{{ filteredCenters.length }}</span>
                  {{ ' ' }}
                  <span class="font-extrabold">{{
                    filteredCenters.length > 1 ? 'centres' : 'centre'
                  }}</span>
                  <template v-if="selectedDept === 'all'"> au total</template>
                  <template v-else>
                    dans le département
                    <span class="font-extrabold">{{ selectedDept }}</span>
                  </template>
                </template>
              </p>
              <Button
                type="button"
                :variant="isMobileMapOpen ? 'default' : 'outline'"
                :class="
                  isMobileMapOpen
                    ? 'h-control shrink-0 rounded-full bg-primary px-md text-small font-semibold text-paper transition hover:bg-primary-dark lg:hidden'
                    : 'h-control shrink-0 rounded-full border border-outline bg-paper px-md text-small font-semibold text-ink transition hover:bg-surface lg:hidden'
                "
                @click="isMobileMapOpen ? closeMobileMap() : openMobileMap()"
              >
                <IconList v-if="isMobileMapOpen" :size="16" />
                <IconMap v-else :size="16" />
                {{ isMobileMapOpen ? 'Voir la liste' : 'Voir la carte' }}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Bottom paper section: list and map -->
    <section class="bg-paper flex flex-col">
      <!-- Mobile: map replaces list when open -->
      <div v-if="isMobileMapOpen" class="flex flex-col lg:hidden">
        <div class="relative h-[60vh] overflow-hidden">
          <CenterMap
            :centers="filteredCenters"
            :active-id="activeCenterId"
            :caption="selectedDeptLabel"
            :user-position="geolocation.position"
            @select="selectCenter"
          />
        </div>

        <CenterResultCard
          v-if="activeCenter"
          :center="activeCenter"
          :active="true"
          class="fixed inset-x-sm bottom-sm z-30 shadow-lg lg:hidden"
          @select="selectCenter(activeCenter.id)"
        />
      </div>

      <!-- Desktop grid + mobile list -->
      <div
        class="grid lg:h-[calc(80vh-5rem)] lg:grid-cols-[2fr_3fr] lg:grid-rows-1 lg:overflow-hidden"
        :class="{ 'hidden lg:grid': isMobileMapOpen }"
      >
        <!-- List -->
        <div
          v-if="filteredCenters.length"
          ref="listEl"
          data-testid="centres-scroll-list"
          class="flex flex-col gap-md px-gutter-mobile py-lg md:pl-gutter lg:h-full lg:min-h-0 lg:overflow-y-auto lg:pl-[max(48px,calc((100vw-var(--layout-container-max))/2+48px))] lg:pr-md"
        >
          <CenterResultCard
            v-for="center in visibleCenters"
            :id="`center-${center.id}`"
            :key="center.id"
            :center="center"
            :active="activeCenterId === center.id"
            @select="selectCenter(center.id)"
          />
          <div
            v-if="isLoadingMore"
            aria-label="Chargement de centres supplémentaires"
            class="flex flex-col gap-md"
          >
            <output class="sr-only">Chargement de centres supplémentaires</output>
            <div
              v-for="i in 3"
              :key="i"
              class="flex animate-pulse flex-col gap-sm rounded-md border border-rule p-md"
              aria-hidden="true"
            >
              <div class="flex justify-between gap-sm">
                <div class="h-xs w-2xl rounded-full bg-surface" />
                <div class="h-xs w-lg rounded-full bg-surface" />
              </div>
              <div class="h-xs w-3/4 rounded-full bg-surface" />
              <div class="h-xs w-1/2 rounded-full bg-surface" />
              <div class="ml-auto h-control w-2xl rounded-full bg-surface" />
            </div>
          </div>
          <div
            v-if="visibleCenters.length < filteredCenters.length && !isLoadingMore"
            ref="sentinelEl"
            aria-hidden="true"
            class="h-1"
          />
          <p
            v-if="
              visibleCenters.length >= filteredCenters.length && hasListOverflowed && !isLoadingMore
            "
            class="py-sm text-center text-small text-ink-muted"
          >
            Vous avez atteint la fin de la liste
          </p>
        </div>

        <!-- Empty state -->
        <div
          v-else
          class="flex h-full min-h-0 flex-col justify-center px-gutter-mobile py-lg md:pl-gutter lg:col-span-2 lg:pl-[max(48px,calc((100vw-var(--layout-container-max))/2+48px))] lg:pr-[max(48px,calc((100vw-var(--layout-container-max))/2+48px))]"
        >
          <div class="rounded-md border border-dashed border-rule bg-paper p-xl text-center">
            <h2 class="font-sans text-h4 text-ink">
              Aucun centre ne correspond à cette sélection pour le moment.
            </h2>
            <p class="mx-auto mt-sm max-w-prose text-small text-ink-muted">
              Les demandes de formation sur ce territoire sont prises en charge : formations en
              intra sur site, ou dans un centre voisin selon le besoin.
            </p>
            <div class="mt-xl flex flex-wrap items-center justify-center gap-md">
              <Button
                as-child
                class="h-control rounded-full bg-primary px-md text-small font-bold text-paper hover:bg-primary-dark"
              >
                <NuxtLink to="/centres/demande-de-formation">Demander une formation</NuxtLink>
              </Button>
              <Button
                variant="outline"
                class="h-control rounded-full border border-outline bg-paper px-md text-small font-bold text-primary transition hover:bg-surface"
                @click="resetFilters"
              >
                Réinitialiser les filtres
              </Button>
            </div>
          </div>
        </div>

        <!-- Map -->
        <div v-if="filteredCenters.length" class="hidden lg:block lg:h-full lg:min-h-0">
          <CenterMap
            class="h-full"
            :centers="filteredCenters"
            :active-id="activeCenterId"
            :caption="selectedDeptLabel"
            :user-position="geolocation.position"
            @select="selectCenter"
          />
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useGeolocation } from '~/composables/useGeolocation'
import { distanceKm } from '~/utils/geo'
import type { CentresQuery } from '~/composables/useCentres'
import type { CenterResult } from '~/types/center-result'

const route = useRoute()

definePageMeta({
  layout: 'with-breadcrumb',
  breadcrumb: [{ label: 'Accueil', to: '/' }, { label: 'Réseau de centres' }]
})

useContentSeo(
  {
    seo_title: 'Réseau de centres — LEARN UP ACADEMY',
    seo_description:
      'Trouvez un centre Learn Up Academy près de vos équipes : formations réglementaires et professionnelles partout en France.'
  },
  'Réseau de centres — LEARN UP ACADEMY'
)

const selectedDept = ref('all')
const appliedSearch = ref(typeof route.query.q === 'string' ? route.query.q : '')
const searchQuery = ref(appliedSearch.value)
const activeCenterId = ref<string | null>(null)
const isMobileMapOpen = ref(false)

const geolocation = useGeolocation()

const centresFilters = computed<CentresQuery>(() => ({
  department: selectedDept.value === 'all' ? undefined : selectedDept.value,
  search: appliedSearch.value.trim() || undefined
}))

const centresResult = useCentres(centresFilters)
const departmentsResult = useCentreDepartments()

// SSR : on attend le fetch pour embarquer les données dans le payload.
// En navigation client (ex. redirection /centres?q=… depuis l'accueil) la
// page monte immédiatement et `pending` affiche le chargement dans le champ.
if (import.meta.server) {
  await Promise.all([centresResult, departmentsResult])
}

const { data: centres, pending: centresPending } = centresResult
const { data: departments } = departmentsResult
const centresCount = computed(() => centres.value?.length ?? 0)
const departmentsCount = computed(() => departments.value?.length ?? 0)

onMounted(() => {
  geolocation.request()
})

const LIST_CHUNK_SIZE = 12
const visibleCount = ref(LIST_CHUNK_SIZE)
const listEl = ref<HTMLElement | null>(null)
const sentinelEl = ref<HTMLElement | null>(null)
const isLoadingMore = ref(false)
const hasListOverflowed = ref(false)
let loadMoreObserver: IntersectionObserver | null = null

const filteredCenters = computed<CenterResult[]>(() => {
  const userPos = geolocation.position.value
  const mapped = (centres.value ?? []).map((centre) => {
    const location = [centre.address, centre.postal_code, centre.city, centre.department]
      .filter(Boolean)
      .join(', ')
    const tags = (centre.specialties ?? []).join(' · ')

    const distance =
      userPos && centre.latitude != null && centre.longitude != null
        ? distanceKm(userPos, { lat: centre.latitude, lng: centre.longitude })
        : undefined

    return {
      id: centre.slug,
      name: centre.name,
      cp: centre.postal_code ?? '',
      address: location,
      tags,
      tagsShort: tags,
      lat: centre.latitude ?? undefined,
      lng: centre.longitude ?? undefined,
      distanceKm: distance
    }
  })

  if (userPos) {
    mapped.sort((a, b) => {
      if (a.distanceKm == null) return 1
      if (b.distanceKm == null) return -1
      return a.distanceKm - b.distanceKm
    })
  }

  return mapped
})

const selectedDeptLabel = computed(() =>
  selectedDept.value === 'all' ? 'Tous les départements' : selectedDept.value
)

const activeCenter = computed(() =>
  filteredCenters.value.find((c) => c.id === activeCenterId.value)
)

const visibleCenters = computed(() => filteredCenters.value.slice(0, visibleCount.value))

function measureListOverflow() {
  const el = listEl.value
  if (!el) {
    hasListOverflowed.value = false
    return
  }
  const heightLimit =
    getComputedStyle(el).overflowY === 'auto' ? el.clientHeight : window.innerHeight
  hasListOverflowed.value = el.scrollHeight > heightLimit + 1
}

async function loadMoreCenters() {
  if (isLoadingMore.value || visibleCount.value >= filteredCenters.value.length) return
  isLoadingMore.value = true
  await nextTick()
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  visibleCount.value = Math.min(visibleCount.value + LIST_CHUNK_SIZE, filteredCenters.value.length)
  isLoadingMore.value = false
  await nextTick()
  measureListOverflow()
}

watch(
  () => route.query.q,
  (q) => {
    const value = typeof q === 'string' ? q : ''
    searchQuery.value = value
    appliedSearch.value = value
  }
)

watch(
  filteredCenters,
  (list) => {
    visibleCount.value = LIST_CHUNK_SIZE
    isLoadingMore.value = false
    if (!activeCenterId.value || !list.some((c) => c.id === activeCenterId.value)) {
      activeCenterId.value = list[0]?.id ?? null
    }
    nextTick(measureListOverflow)
  },
  { immediate: true }
)

onMounted(() => {
  loadMoreObserver = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) loadMoreCenters()
    },
    { rootMargin: '160px' }
  )
  if (sentinelEl.value) loadMoreObserver.observe(sentinelEl.value)
  window.addEventListener('resize', measureListOverflow)
  nextTick(measureListOverflow)
})

watch(sentinelEl, (el, prev) => {
  if (!loadMoreObserver) return
  if (prev) loadMoreObserver.unobserve(prev)
  if (el) loadMoreObserver.observe(el)
})

onBeforeUnmount(() => {
  loadMoreObserver?.disconnect()
  loadMoreObserver = null
  window.removeEventListener('resize', measureListOverflow)
})

function selectCenter(id: string) {
  if (!id) {
    activeCenterId.value = null
    return
  }
  activeCenterId.value = id === activeCenterId.value ? null : id
  const index = filteredCenters.value.findIndex((c) => c.id === id)
  if (index >= visibleCount.value) {
    visibleCount.value = Math.min(index + LIST_CHUNK_SIZE, filteredCenters.value.length)
  }
  nextTick(() => {
    const el = document.getElementById(`center-${id}`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  })
}

function onSearch(value: string) {
  // La recherche n'est appliquée qu'à la soumission (bouton ou touche Entrée).
  appliedSearch.value = value
}

function resetFilters() {
  selectedDept.value = 'all'
  searchQuery.value = ''
  appliedSearch.value = ''
}

function openMobileMap() {
  isMobileMapOpen.value = true
}

function closeMobileMap() {
  isMobileMapOpen.value = false
}
</script>
