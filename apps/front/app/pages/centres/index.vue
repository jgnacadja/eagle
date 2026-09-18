<template>
  <div class="flex flex-1 flex-col">
    <!-- Top surface section: heading and description -->
    <section class="shrink-0 bg-surface-soft">
      <div class="mx-auto px-gutter-mobile md:px-gutter pb-lg pt-section">
        <p class="text-overline text-accent-text">LE RÉSEAU LEARN UP</p>
        <h1 class="mt-sm font-display text-h2 font-extrabold text-ink lg:text-h1">
          Réseau de centres
        </h1>
        <p class="mt-sm max-w-prose text-body text-ink-body">
          {{ centresCount }} centre{{ centresCount > 1 ? 's' : '' }}
          {{ centresCount > 1 ? 'couvrent' : 'couvre' }}
          {{ departmentsCount }} département{{ departmentsCount > 1 ? 's' : '' }}. La sélection d'un
          département affiche les centres de ce territoire.
        </p>
      </div>
    </section>

    <!-- Barre de recherche/filtres : épinglée en haut sur desktop -->
    <section class="shrink-0 bg-surface-soft lg:sticky lg:top-0 lg:z-30">
      <div class="mx-auto px-gutter-mobile md:px-gutter pb-lg">
        <div class="flex flex-col gap-md">
          <div class="flex flex-col gap-md sm:flex-row sm:items-center sm:justify-between">
            <div class="flex flex-col gap-md sm:flex-row sm:items-center">
              <Label for="dept-select" class="relative block">
                <span class="sr-only">Sélectionner un département</span>
                <Select v-model="selectedDept" @update:model-value="deptUserTouched = true">
                  <SelectTrigger id="dept-select" variant="field-lg" class="sm:w-64">
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
                class="w-full sm:w-96"
                @submit="onSearch"
              >
                <template #action>
                  <GeoNearMe ref="geoNearMe" />
                </template>
              </SearchInput>
            </div>

            <div class="flex items-center justify-between gap-sm">
              <p
                v-if="filteredCenters.length || selectedDept !== 'all'"
                class="text-small text-ink"
              >
                <span class="font-extrabold">{{ filteredCenters.length }}</span>
                {{ ' ' }}
                <span class="font-extrabold">{{
                  filteredCenters.length > 1 ? 'centres' : 'centre'
                }}</span>
                <template v-if="selectedDept !== 'all'">
                  en
                  <span class="font-extrabold">{{ selectedDept }}</span>
                </template>
                <template v-else-if="appliedSearch.trim()">
                  pour « {{ appliedSearch.trim() }} »
                </template>
                <template v-else> au total</template>
              </p>
              <Button
                type="button"
                :variant="isMobileMapOpen ? 'default' : 'outline'"
                size="pill-sm"
                class="shrink-0 gap-sm lg:hidden"
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
      <div v-if="isMobileMapOpen" class="relative flex h-[60vh] flex-col justify-end lg:hidden">
        <div class="absolute inset-0 overflow-hidden">
          <CenterMap
            :centers="filteredCenters"
            :active-id="hasUserSelection ? activeCenterId : null"
            :caption="selectedDeptLabel"
            :min-zoom="8"
            :popup="false"
            :user-position="userPosition"
            :focus-center="mapFocus"
            @select="selectCenter"
          />
        </div>

        <!-- Épinglée en bas du viewport tant que la carte est à l'écran ;
             sa position naturelle en bas du conteneur l'empêche de dépasser la map. -->
        <CenterResultCard
          v-if="activeCenter && hasUserSelection"
          :center="activeCenter"
          :active="true"
          class="sticky bottom-sm z-30 mx-sm mb-sm shadow-lg lg:hidden"
          @select="selectCenter(activeCenter.id)"
        />
      </div>

      <!-- Desktop grid + mobile list -->
      <div
        class="grid lg:mx-auto lg:h-[calc(80vh-5rem)] lg:w-full lg:grid-cols-[2fr_3fr] lg:grid-rows-1 lg:overflow-hidden lg:px-gutter"
        :class="{ 'hidden lg:grid': isMobileMapOpen }"
      >
        <!-- List -->
        <div
          v-if="filteredCenters.length"
          ref="listEl"
          data-testid="centres-scroll-list"
          class="thin-scrollbar flex flex-col gap-md px-gutter-mobile py-lg md:pl-gutter lg:h-full lg:min-h-0 lg:overflow-y-auto lg:pl-0 lg:pr-lg"
        >
          <CenterResultCard
            v-for="(center, i) in visibleCenters"
            :id="`center-${center.id}`"
            :key="center.id"
            v-reveal="revealStagger(i % 3)"
            :center="center"
            :active="activeCenterId === center.id"
            @select="onListCardSelect(center.id)"
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
          class="flex h-full min-h-0 flex-col justify-center px-gutter-mobile py-lg md:pl-gutter lg:col-span-2 lg:px-0"
        >
          <div class="rounded-md border border-dashed border-rule bg-paper p-xl text-center">
            <h2 class="font-sans text-h4 text-ink">
              {{
                isDepartmentScope
                  ? "Aucun centre n'est implanté dans ce département pour le moment."
                  : 'Aucun centre ne correspond à cette sélection pour le moment.'
              }}
            </h2>
            <p class="mx-auto mt-sm max-w-prose text-small text-ink-muted">
              Les demandes de formation sur ce territoire sont prises en charge : formations en
              intra sur site, ou dans un centre d'un département voisin selon le besoin.
            </p>
            <div class="mt-xl flex flex-wrap items-center justify-center gap-md">
              <Button as-child size="pill-sm" class="font-bold">
                <NuxtLink to="/centres/demande-de-formation">Demander une formation</NuxtLink>
              </Button>
              <Button variant="outline" size="pill-sm" class="font-bold" @click="resetFilters">
                {{
                  isDepartmentScope ? 'Choisir un autre département' : 'Réinitialiser les filtres'
                }}
              </Button>
            </div>
          </div>
          <p v-if="isDepartmentScope" class="mt-lg text-meta text-ink-muted md:text-small">
            Aucun centre voisin n'est injecté automatiquement dans les résultats (RG01) —
            l'élargissement reste un choix de l'utilisateur ou une prise en charge commerciale.
          </p>
        </div>

        <!-- Map -->
        <div v-if="filteredCenters.length" class="hidden lg:block lg:h-full lg:min-h-0">
          <CenterMap
            class="h-full"
            :centers="filteredCenters"
            :active-id="activeCenterId"
            :caption="selectedDeptLabel"
            :min-zoom="8"
            :user-position="userPosition"
            :focus-center="mapFocus"
            @select="selectCenter"
          />
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { DESKTOP_QUERY, useGeolocation, useReverseGeocode } from '~/composables/useGeolocation'
import { densestClusterCenter, distanceKm, normalizeDepartment } from '~/utils/geo'
import type { CentresQuery } from '~/composables/useCentres'
import { revealStagger } from '~/utils/reveal'
import type { CenterResult } from '~/types/center-result'
import { availabilityStatus, useCentreSessionDates } from '~/composables/useCentres'

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
// `region` (navigation menus) pré-remplit la recherche — le haystack API
// inclut `centre.region` — tout en restant distinct de `q` (recherche
// libre) dans le contrat d'URL.
function searchFromQuery(q: unknown, region: unknown): string {
  if (typeof q === 'string' && q) return q
  return typeof region === 'string' ? region : ''
}
const appliedSearch = ref(searchFromQuery(route.query.q, route.query.region))
const searchQuery = ref(appliedSearch.value)
const activeCenterId = ref<string | null>(null)
// Sélection explicite (clic sur une carte ou un marqueur) — distincte de
// l'auto-sélection du premier centre : sur mobile, la carte n'ouvre la
// popup d'un centre que si l'utilisateur l'a choisi, jamais d'office.
const hasUserSelection = ref(false)
const isMobileMapOpen = ref(false)

// Destructuration : `position` devient un binding top-level, donc auto-déplié
// dans le template (un Ref imbriqué dans un objet ne l'est pas — CenterMap
// recevrait le Ref lui-même et non { lat, lng }).
// La géolocalisation n'est jamais automatique : elle part d'un geste
// explicite — badge « Près de moi » de la barre de recherche (dialog de
// consentement maison puis popup native) ou lien `?geo=1` du menu mobile.
const { position: userPosition } = useGeolocation()
const geoNearMe = ref<{ activate: () => void } | null>(null)

// Reverse geocoding : la position GPS est convertie en département côté
// API (BAN) pour pré-remplir le filtre — sans rechargement de page.
const { department: geoDepartment } = useReverseGeocode(userPosition)

const centresFilters = computed<CentresQuery>(() => ({
  department: selectedDept.value === 'all' ? undefined : selectedDept.value,
  search: appliedSearch.value.trim() || undefined
}))

const centresResult = useCentres(centresFilters)
// Total réseau affiché dans le hero : compteur dédié, insensible aux
// filtres — il ne doit jamais bouger quand recherche/département
// réduisent `centres` à un sous-ensemble.
const centresTotalResult = useCentresTotal()
const departmentsResult = useCentreDepartments()
// Sessions du catalogue agrégées par centre → badge de disponibilité sur
// chaque carte (dégradation silencieuse si l'API catalogue échoue).
const centreSessionDates = await useCentreSessionDates()

// SSR : on attend le fetch pour embarquer les données dans le payload.
// En navigation client (ex. redirection /centres?q=… depuis l'accueil) la
// page monte immédiatement et `pending` affiche le chargement dans le champ.
if (import.meta.server) {
  await Promise.all([centresResult, centresTotalResult, departmentsResult])
}

const { data: centres, pending: centresPending } = centresResult
const { data: centresTotal } = centresTotalResult
const { data: departments } = departmentsResult
const centresCount = computed(() => centresTotal.value ?? 0)
const departmentsCount = computed(() => departments.value?.length ?? 0)

// La page déjà affichée ne remonte pas : seul le changement de query
// rouvre le parcours de consentement (mobile : « Près de moi » du menu).
watch(
  () => route.query.geo,
  (value) => {
    if (value === '1') geoNearMe.value?.activate()
  }
)

// Le filtre département se remplit dès que le département est détecté.
// Jamais après un choix explicite : `deptUserTouched` (sélection dans le
// select ou reset des filtres) désactive l'auto-remplissage pour le reste
// du montage — sinon une liste `departments` rafraîchie réécrirait un
// « Tous les départements » choisi à la main. Tant qu'il n'y a pas eu de
// geste, on n'écrit que sur 'all' ou sur la valeur posée par
// l'auto-remplissage — dont on corrige alors la graphie quand la liste
// canonique arrive (« Val-de-Marne » géocodé vs tag libre « Val de Marne »).
// `departments` dans les sources du watch couvre le cas où la liste
// arrive après la position.
const deptUserTouched = ref(false)
watch([geoDepartment, departments], ([dept, list]) => {
  if (!dept) {
    // Géoloc désactivée (ou reverse en échec) : le filtre ne revient à
    // 'all' que si la valeur affichée vient de l'auto-remplissage —
    // `deptUserTouched` garantit qu'un choix manuel est conservé.
    if (!deptUserTouched.value) selectedDept.value = 'all'
    return
  }
  if (deptUserTouched.value) return
  const detected = normalizeDepartment(dept)
  const current = selectedDept.value
  if (current !== 'all' && normalizeDepartment(current) !== detected) return
  selectedDept.value = list?.find((d) => normalizeDepartment(d) === detected) ?? dept
})

const LIST_CHUNK_SIZE = 12
const visibleCount = ref(LIST_CHUNK_SIZE)
const listEl = ref<HTMLElement | null>(null)
const sentinelEl = ref<HTMLElement | null>(null)
const isLoadingMore = ref(false)
const hasListOverflowed = ref(false)
let loadMoreObserver: IntersectionObserver | null = null

const filteredCenters = computed<CenterResult[]>(() => {
  const userPos = userPosition.value
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
      status: availabilityStatus(centreSessionDates.value.get(centre.slug) ?? []),
      lat: centre.latitude ?? undefined,
      lng: centre.longitude ?? undefined,
      distanceKm: distance
    }
  })

  if (userPos) {
    mapped.sort((a, b) => {
      if (a.distanceKm == null && b.distanceKm == null) return 0
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

// Vue de la carte : sans département ni recherche → Paris (cœur du réseau),
// ou la position de l'utilisateur s'il est géolocalisé ; département choisi
// → centroïde du groupe le plus dense de ses centres (les centres
// « couvrant » un département peuvent être implantés chez les voisins, un
// fit global cadrerait trop large) ; recherche seule → `fitBounds` cadre
// les résultats.
const PARIS_CENTER = { lat: 48.8566, lng: 2.3522 }
const mapFocus = computed(() => {
  if (selectedDept.value !== 'all') {
    const points = filteredCenters.value.flatMap((c) =>
      c.lat != null && c.lng != null ? [{ lat: c.lat, lng: c.lng }] : []
    )
    return densestClusterCenter(points)
  }
  if (!appliedSearch.value.trim()) return userPosition.value ?? PARIS_CENTER
  return null
})

// « Département sans centre » (RG01) : le périmètre reste strict — l'état
// vide territorial ne s'affiche que pour un filtre département seul ; une
// recherche infructueuse garde le message générique de sélection.
const isDepartmentScope = computed(
  () => selectedDept.value !== 'all' && !appliedSearch.value.trim()
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
  () => [route.query.q, route.query.region],
  ([q, region]) => {
    const value = searchFromQuery(q, region)
    searchQuery.value = value
    appliedSearch.value = value
  }
)

watch(
  filteredCenters,
  (list, prev) => {
    // Un refetch renvoyant les mêmes centres (mêmes ids, même ordre) ne
    // doit rien réinitialiser : ni la sélection explicite de
    // l'utilisateur, ni la pagination déjà déroulée.
    const unchanged =
      prev !== undefined &&
      list.length === prev.length &&
      list.every((c, i) => c.id === prev[i]?.id)
    if (!unchanged) {
      visibleCount.value = LIST_CHUNK_SIZE
      isLoadingMore.value = false
      hasUserSelection.value = false
      if (!activeCenterId.value || !list.some((c) => c.id === activeCenterId.value)) {
        activeCenterId.value = list[0]?.id ?? null
      }
    }
    nextTick(measureListOverflow)
  },
  { immediate: true }
)

function onResize() {
  measureListOverflow()
}

onMounted(() => {
  loadMoreObserver = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) loadMoreCenters()
    },
    { rootMargin: '160px' }
  )
  if (sentinelEl.value) loadMoreObserver.observe(sentinelEl.value)
  window.addEventListener('resize', onResize)
  nextTick(onResize)
  // Arrivée directe sur /centres?geo=1 (« Près de moi » du menu) : le
  // dialog de consentement s'ouvre une fois le badge monté — le watch sur
  // la query, non immédiat, ne couvre que les changements ultérieurs.
  if (route.query.geo === '1') geoNearMe.value?.activate()
})

watch(sentinelEl, (el, prev) => {
  if (!loadMoreObserver) return
  if (prev) loadMoreObserver.unobserve(prev)
  if (el) loadMoreObserver.observe(el)
})

onBeforeUnmount(() => {
  loadMoreObserver?.disconnect()
  loadMoreObserver = null
  window.removeEventListener('resize', onResize)
})

// Mobile (liste plein écran) : le clic sur une carte ouvre la fiche,
// comme « Voir le centre » — la sélection/popup sticky n'existe qu'en
// mode carte (mobile) et sur desktop où liste et carte sont visibles.
function onListCardSelect(id: string) {
  // Même garde que useAutoGeolocation : matchMedia absent → desktop.
  const isDesktop =
    typeof window.matchMedia !== 'function' || window.matchMedia(DESKTOP_QUERY).matches
  if (!isDesktop) {
    void navigateTo(`/centres/${id}`)
    return
  }
  selectCenter(id)
}

function selectCenter(id: string) {
  if (!id) {
    activeCenterId.value = null
    return
  }
  hasUserSelection.value = true
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
  deptUserTouched.value = true
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
