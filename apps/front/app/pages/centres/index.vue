<template>
  <div class="flex flex-1 flex-col">
    <!-- Top surface section: heading, description and filters -->
    <section class="bg-surface-soft">
      <div class="mx-auto max-w-container px-gutter-mobile md:px-gutter py-section">
        <p class="text-overline text-accent-text">LE RÉSEAU LEARN UP</p>
        <h1 class="mt-sm font-display text-h1 font-extrabold text-ink">Réseau de centres</h1>
        <p class="mt-sm max-w-prose text-body text-ink-body">
          Plus de 400 centres couvrent 96 départements. La sélection d'un département affiche les
          centres de ce territoire.
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
                    <SelectItem value="94" class="text-small">94 — Val-de-Marne</SelectItem>
                    <SelectItem value="48" class="text-small">48 — Lozère</SelectItem>
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

            <div class="flex items-center justify-between gap-sm">
              <p class="text-small text-ink">
                <span class="font-extrabold">{{
                  department.centers.length ? filteredCenters.length : 0
                }}</span>
                <span v-if="department.centers.length" class="text-ink">
                  {{ ' ' }}
                  <span class="font-extrabold">{{
                    filteredCenters.length > 1 ? 'centres' : 'centre'
                  }}</span>
                  {{ ' dans le ' + department.label }}
                </span>
                <span v-else class="text-ink">
                  {{ ' ' }}
                  <span class="font-extrabold">centre</span>
                  {{ ' en ' + department.label }}
                </span>
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
    <section class="bg-paper flex flex-1 flex-col">
      <!-- Mobile: map replaces list when open -->
      <div v-if="isMobileMapOpen" class="flex flex-col lg:hidden">
        <div class="relative h-[60vh] overflow-hidden">
          <CenterMap
            :centers="filteredCenters"
            :active-id="activeCenterId"
            :caption="department.caption"
            @select="selectCenter"
          />
        </div>

        <!-- Mobile bottom sheet -->
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
        class="grid h-full min-h-0 flex-1 lg:grid-cols-[2fr_3fr] lg:grid-rows-1"
        :class="{ 'hidden lg:grid': isMobileMapOpen }"
      >
        <!-- List -->
        <div
          v-if="filteredCenters.length"
          class="flex h-full min-h-0 flex-col gap-md px-gutter-mobile py-lg md:pl-gutter lg:pl-[max(48px,calc((100vw-var(--layout-container-max))/2+48px))]"
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
        <div
          v-else
          class="flex h-full min-h-0 flex-col justify-center px-gutter-mobile py-lg md:pl-gutter lg:col-span-2 lg:pl-[max(48px,calc((100vw-var(--layout-container-max))/2+48px))] lg:pr-[max(48px,calc((100vw-var(--layout-container-max))/2+48px))]"
        >
          <div class="rounded-md border border-dashed border-rule bg-paper p-xl text-center">
            <h2 class="font-sans text-h4 text-ink">
              Aucun centre n'est implanté dans ce département pour le moment.
            </h2>
            <p class="mx-auto mt-sm max-w-prose text-small text-ink-muted">
              Les demandes de formation sur ce territoire sont prises en charge : formations en
              intra sur site, ou dans un centre d'un département voisin selon le besoin.
            </p>
            <div class="mt-xl flex flex-wrap items-center justify-center gap-md">
              <Button
                as-child
                class="h-control rounded-full bg-primary px-md text-small font-bold text-paper hover:bg-primary-dark"
              >
                <NuxtLink to="/">Demander une formation</NuxtLink>
              </Button>
              <Button
                as-child
                variant="outline"
                class="h-control rounded-full border border-outline bg-paper px-md text-small font-bold text-primary transition hover:bg-surface"
              >
                <NuxtLink to="/">Choisir un autre département</NuxtLink>
              </Button>
            </div>
          </div>
          <p class="mt-md text-meta text-ink-subtle">
            Aucun centre voisin n'est injecté automatiquement dans les résultats (RG01) —
            l'élargissement reste un choix de l'utilisateur ou une prise en charge commerciale.
          </p>
        </div>

        <!-- Map -->
        <CenterMap
          v-if="filteredCenters.length"
          class="hidden h-full min-h-0 lg:block"
          :centers="filteredCenters"
          :active-id="activeCenterId"
          :caption="department.caption"
          @select="selectCenter"
        />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import type { CenterResult } from '~/types/center-result'

definePageMeta({
  layout: 'with-breadcrumb',
  breadcrumb: [{ label: 'Accueil', to: '/' }, { label: 'Réseau de centres' }]
})

useContentSeo(
  {
    seo_title: 'Réseau de centres — LEARN UP ACADEMY',
    seo_description:
      'Plus de 400 centres couvrent 96 départements. Trouvez un centre Learn Up Academy près de vos équipes.'
  },
  'Réseau de centres — LEARN UP ACADEMY'
)

interface Department {
  label: string
  caption: string
  centers: CenterResult[]
}

const CENTERS: Record<string, Department> = {
  '94': {
    label: 'Val-de-Marne',
    caption: 'département 94 cadré',
    centers: [
      {
        id: 'creteil',
        name: 'Centre de Créteil',
        cp: '94000',
        address: '14 rue des Refuzniks, Créteil · Val-de-Marne',
        tags: 'CACES · Habilitations électriques · SST · Hauteur',
        tagsShort: 'CACES · Habilitations · SST',
        status: { type: 'success', label: 'Sessions cette semaine' },
        pos: { top: '30%', left: '73%' }
      },
      {
        id: 'vitry',
        name: 'Centre de Vitry-sur-Seine',
        cp: '94400',
        address: '22 quai Jules Guesde, Vitry-sur-Seine · Val-de-Marne',
        tags: 'CACES · AIPR · SST',
        tagsShort: 'CACES · AIPR · SST',
        status: { type: 'warning', label: 'Prochaine session le 14/09' },
        pos: { top: '52%', left: '55%' }
      },
      {
        id: 'champigny',
        name: 'Centre de Champigny-sur-Marne',
        cp: '94500',
        address: '5 rue Benoît Frachon, Champigny · Val-de-Marne',
        tags: 'Habilitations électriques · Incendie',
        tagsShort: 'Habilitations · Incendie',
        status: { type: 'success', label: 'Sessions ce mois-ci' },
        pos: { top: '58%', left: '35%' }
      },
      {
        id: 'rungis',
        name: 'Centre de Rungis',
        cp: '94150',
        address: '1 rue de la Tour, Rungis · Val-de-Marne',
        tags: 'CACES · Logistique · Hauteur',
        tagsShort: 'CACES · Logistique',
        status: { type: 'neutral', label: 'Sessions sur demande' },
        pos: { top: '69%', left: '68%' }
      },
      {
        id: 'nogent',
        name: 'Centre de Nogent-sur-Marne',
        cp: '94130',
        address: '3 boulevard de Strasbourg, Nogent · Val-de-Marne',
        tags: 'SST · Gestes & postures',
        tagsShort: 'SST · Gestes & postures',
        status: { type: 'success', label: 'Sessions ce mois-ci' },
        pos: { top: '43%', left: '20%' }
      }
    ]
  },
  '48': {
    label: 'Lozère',
    caption: 'département 48 cadré',
    centers: []
  }
}

const selectedDept = ref('94')
const searchQuery = ref('')
const activeCenterId = ref<string | null>(null)
const isMobileMapOpen = ref(false)

const department = computed(() => CENTERS[selectedDept.value])

const filteredCenters = computed(() => {
  const query = searchQuery.value.toLowerCase()
  if (!query) return department.value.centers
  return department.value.centers.filter(
    (c) =>
      c.name.toLowerCase().includes(query) ||
      c.cp.toLowerCase().includes(query) ||
      c.address.toLowerCase().includes(query) ||
      c.tags.toLowerCase().includes(query)
  )
})

const activeCenter = computed(() =>
  filteredCenters.value.find((c) => c.id === activeCenterId.value)
)

const selectedDeptLabel = computed(() => {
  const dept = CENTERS[selectedDept.value]
  return `${selectedDept.value} — ${dept?.label ?? ''}`
})

watch(
  department,
  (dept) => {
    activeCenterId.value = dept.centers[0]?.id ?? null
    searchQuery.value = ''
  },
  { immediate: true }
)

watch(filteredCenters, (list) => {
  if (activeCenterId.value && !list.some((c) => c.id === activeCenterId.value)) {
    activeCenterId.value = list[0]?.id ?? null
  }
})

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
  // The search is already reactive through v-model.
  // This handler keeps the submit button accessible.
}

function openMobileMap() {
  isMobileMapOpen.value = true
}

function closeMobileMap() {
  isMobileMapOpen.value = false
}
</script>
