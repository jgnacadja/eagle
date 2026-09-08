<template>
  <div class="flex flex-1 flex-col">
    <!-- Top surface section: heading, description and filters -->
    <section class="bg-surface-soft">
      <div class="mx-auto max-w-container px-gutter-mobile md:px-gutter py-section">
        <p class="text-overline text-accent-text">LE RÉSEAU LEARN UP</p>
        <h1 class="mt-sm font-display text-h2 font-extrabold text-ink lg:text-h1">
          Réseau de centres
        </h1>
        <p class="mt-sm max-w-prose text-body text-ink-body">
          {{ centres.length }} centre{{ centres.length > 1 ? 's' : '' }} couvrant
          {{ departments.length }} département{{ departments.length > 1 ? 's' : '' }}. La sélection
          d'un département affiche les centres de ce territoire.
        </p>

        <div class="mt-2xl flex flex-col gap-md">
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
                class="w-full sm:w-72"
                @submit="onSearch"
              />
            </div>

            <p class="text-small text-ink">
              <span class="font-extrabold">{{ filteredCenters.length }}</span>
              {{ ' ' }}
              <span class="font-extrabold">{{
                filteredCenters.length > 1 ? 'centres' : 'centre'
              }}</span>
              <template v-if="selectedDept !== 'all'">
                dans le département
                <span class="font-extrabold">{{ selectedDept }}</span>
              </template>
              <template v-else> au total</template>
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Liste des centres -->
    <section class="bg-paper flex flex-1 flex-col">
      <div class="mx-auto w-full px-gutter-mobile py-lg md:px-gutter">
        <div
          v-if="filteredCenters.length"
          class="grid h-full min-h-0 flex-1 gap-md sm:grid-cols-2 lg:grid-cols-3"
        >
          <CenterResultCard
            v-for="center in filteredCenters"
            :id="`center-${center.id}`"
            :key="center.id"
            :center="center"
            :active="activeCenterId === center.id"
            @select="selectCenter(center.id)"
          />
        </div>

        <!-- Empty state -->
        <div v-else class="flex h-full min-h-0 flex-col justify-center py-lg">
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
                as-child
                variant="outline"
                class="h-control rounded-full border border-outline bg-paper px-md text-small font-bold text-primary transition hover:bg-surface"
                @click="resetFilters"
              >
                Réinitialiser les filtres
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import type { Centre } from '@learnup/types'
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

const centres = await useDirectusList<Centre>('centres', 'centres-list', {
  fields: ['slug', 'name', 'address', 'city', 'postal_code', 'department', 'region', 'specialties'],
  filter: { status: { _eq: 'published' } },
  limit: -1,
  sort: ['sort', 'name']
})

const selectedDept = ref('all')
const searchQuery = ref(typeof route.query.q === 'string' ? route.query.q : '')
const activeCenterId = ref<string | null>(null)

// Options du filtre département : uniquement les départements réellement
// couverts par les centres publiés (champ `department` du centre lui-même,
// complété par `departments_covered`).
const departments = computed(() => {
  const set = new Set<string>()
  for (const centre of centres.value ?? []) {
    if (centre.department) set.add(centre.department)
    for (const dept of centre.departments_covered ?? []) {
      if (dept) set.add(dept)
    }
  }
  return [...set].sort((a, b) => a.localeCompare(b, 'fr'))
})

const centreCards = computed<CenterResult[]>(() =>
  (centres.value ?? []).map((centre) => {
    const location = [centre.address, centre.postal_code, centre.city, centre.department]
      .filter(Boolean)
      .join(', ')
    const tags = (centre.specialties ?? []).join(' · ')
    return {
      id: centre.slug,
      name: centre.name,
      cp: centre.postal_code ?? '',
      address: location,
      tags,
      tagsShort: tags
    }
  })
)

// Index slug → centre : évite un find() O(n) par carte dans le filtre
// département (O(n²) sinon).
const centresBySlug = computed(() => new Map((centres.value ?? []).map((c) => [c.slug, c])))

const filteredCenters = computed(() => {
  let list = centreCards.value

  if (selectedDept.value !== 'all') {
    const dept = selectedDept.value
    list = list.filter((card) => {
      const centre = centresBySlug.value.get(card.id)
      return centre?.department === dept || (centre?.departments_covered ?? []).includes(dept)
    })
  }

  const query = searchQuery.value.toLowerCase().trim()
  if (query) {
    list = list.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.cp.toLowerCase().includes(query) ||
        c.address.toLowerCase().includes(query) ||
        c.tags.toLowerCase().includes(query)
    )
  }

  return list
})

const selectedDeptLabel = computed(() =>
  selectedDept.value === 'all' ? 'Tous les départements' : selectedDept.value
)

// La page ne se remonte plus sur changement de query (page-key = path) :
// resynchroniser la recherche quand ?q= change (retour arrière, lien).
watch(
  () => route.query.q,
  (q) => {
    searchQuery.value = typeof q === 'string' ? q : ''
  }
)

watch(
  filteredCenters,
  (list) => {
    // Premier centre actif par défaut ; réinitialise si le centre actif
    // sort de la sélection filtrée.
    if (!activeCenterId.value || !list.some((c) => c.id === activeCenterId.value)) {
      activeCenterId.value = list[0]?.id ?? null
    }
  },
  { immediate: true }
)

function selectCenter(id: string) {
  if (!id) {
    activeCenterId.value = null
    return
  }
  activeCenterId.value = id === activeCenterId.value ? null : id
  nextTick(() => {
    const el = document.getElementById(`center-${id}`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  })
}

function onSearch() {
  // La recherche est déjà réactive via v-model.
  // Ce handler conserve le bouton de soumission accessible.
}

function resetFilters() {
  selectedDept.value = 'all'
  searchQuery.value = ''
}
</script>
