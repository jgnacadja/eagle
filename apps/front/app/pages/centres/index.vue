<template>
  <div class="bg-surface">
    <section class="mx-auto max-w-container px-gutter-mobile md:px-gutter py-section">
      <!-- Breadcrumb -->
      <nav aria-label="Fil d'ariane" class="text-small text-ink-muted">
        <ol class="flex items-center gap-sm">
          <li>
            <NuxtLink to="/" class="hover:text-ink">Accueil</NuxtLink>
          </li>
          <li aria-hidden="true">›</li>
          <li class="font-semibold text-ink" aria-current="page">Réseau de centres</li>
        </ol>
      </nav>

      <!-- Heading -->
      <div class="mt-2xl max-w-prose">
        <p class="text-overline text-accent-text">LE RÉSEAU LEARN UP</p>
        <h1 class="mt-sm font-display text-h1 font-extrabold text-ink">Réseau de centres</h1>
        <p class="mt-sm text-body text-ink-body">
          Plus de 400 centres couvrent 96 départements. La sélection d'un département affiche les
          centres de ce territoire.
        </p>
      </div>

      <!-- Filters -->
      <div class="mt-2xl flex flex-col gap-md">
        <div class="flex flex-col gap-md sm:flex-row sm:items-center sm:justify-between">
          <div class="flex flex-col gap-md sm:flex-row sm:items-center">
            <div class="relative">
              <label for="department-select" class="sr-only">Sélectionner un département</label>
              <select
                id="department-select"
                v-model="selectedDept"
                class="w-64 appearance-none rounded-full border border-outline bg-paper px-lg py-md pr-10 text-small font-medium text-ink focus:outline-none focus:ring-2 focus:ring-outline"
              >
                <option value="94">94 — Val-de-Marne</option>
                <option value="48">48 — Lozère</option>
              </select>
              <svg
                class="pointer-events-none absolute right-lg top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 9l6 6 6-6" />
              </svg>
            </div>

            <label class="relative block">
              <span class="sr-only">Rechercher par ville ou code postal</span>
              <input
                id="city-search"
                v-model.trim="searchQuery"
                type="text"
                placeholder="Ville ou code postal"
                class="w-72 rounded-full border border-outline bg-paper px-lg py-md pr-11 text-small text-ink placeholder:text-ink-placeholder focus:outline-none focus:ring-2 focus:ring-outline"
              />
              <svg
                class="pointer-events-none absolute right-lg top-1/2 h-4 w-4 -translate-y-1/2 text-ink"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                viewBox="0 0 24 24"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.35-4.35" stroke-linecap="round" />
              </svg>
            </label>
          </div>
          <div class="flex items-center gap-sm">
            <p class="text-small font-extrabold text-ink">{{ resultsText }}</p>
            <button
              type="button"
              class="inline-flex h-control shrink-0 items-center gap-sm rounded-full border border-outline bg-paper px-md text-small font-semibold text-ink transition hover:bg-surface lg:hidden"
              @click="openMobileMap"
            >
              <svg
                class="h-4 w-4"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                viewBox="0 0 24 24"
              >
                <path d="M9 3v15M15 6v15M4 5l5-2 6 2 5-2v15l-5 2-6-2-5 2V5z" />
              </svg>
              Voir la carte
            </button>
          </div>
        </div>
      </div>

      <!-- Content -->
      <div class="mt-xl grid lg:grid-cols-[5fr_7fr]">
        <!-- List -->
        <div v-if="filteredCenters.length" class="flex flex-col gap-md">
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
          class="rounded-md border border-outline-soft bg-surface p-xl text-center lg:col-span-2"
        >
          <h2 class="font-sans text-h4 text-ink">
            Aucun centre n'est implanté dans ce département pour le moment.
          </h2>
          <p class="mt-sm text-small text-ink-body max-w-prose mx-auto">
            Les demandes de formation sur ce territoire sont prises en charge : formations en intra
            sur site, ou dans un centre d'un département voisin selon le besoin.
          </p>
          <div class="mt-xl flex flex-wrap items-center justify-center gap-md">
            <NuxtLink
              to="/"
              class="rounded-full bg-primary px-md py-sm text-small font-bold text-paper transition hover:bg-primary-dark"
            >
              Demander une formation
            </NuxtLink>
            <NuxtLink
              to="/"
              class="rounded-full border border-outline bg-paper px-md py-sm text-small font-bold text-primary transition hover:bg-surface"
            >
              Choisir un autre département
            </NuxtLink>
          </div>
          <p class="mt-xl text-meta text-ink-subtle max-w-prose mx-auto">
            Aucun centre voisin n'est injecté automatiquement dans les résultats (RG01) —
            l'élargissement reste un choix de l'utilisateur ou une prise en charge commerciale.
          </p>
        </div>

        <!-- Map -->
        <CenterMap
          v-if="filteredCenters.length"
          class="hidden lg:block"
          :centers="filteredCenters"
          :active-id="activeCenterId"
          :caption="department.caption"
          @select="selectCenter"
        />
      </div>
    </section>

    <!-- Mobile map overlay -->
    <ClientOnly>
      <Teleport to="body">
        <div v-if="isMobileMapOpen" class="fixed inset-0 z-40 flex flex-col bg-paper">
          <div
            class="flex items-center justify-between gap-sm border-b border-rule px-gutter-mobile py-md"
          >
            <p class="text-small font-semibold text-ink">{{ mobileMapCount }}</p>
            <button
              type="button"
              class="inline-flex h-control shrink-0 items-center gap-sm rounded-full bg-ink px-md text-small font-semibold text-paper transition hover:bg-primary-dark"
              @click="closeMobileMap"
            >
              <svg
                class="h-4 w-4"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                viewBox="0 0 24 24"
              >
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              Voir la liste
            </button>
          </div>

          <div class="relative flex-1 overflow-hidden">
            <CenterMap
              :centers="filteredCenters"
              :active-id="activeCenterId"
              :caption="department.caption"
              @select="selectCenter"
            />
          </div>

          <!-- Mobile bottom sheet -->
          <div
            v-if="activeCenter && isMobileMapOpen"
            class="absolute inset-x-0 bottom-0 z-30 rounded-t-lg bg-paper p-md shadow-lg"
          >
            <div class="mx-auto mb-sm h-1 w-10 rounded-full bg-rule" />
            <div class="flex items-start justify-between gap-sm">
              <div>
                <h3 class="font-sans text-h4 font-semibold text-ink">{{ activeCenter.name }}</h3>
                <p class="mt-xs text-small text-ink-muted">{{ activeCenter.address }}</p>
                <p class="mt-sm text-small text-ink-body">{{ activeCenter.tagsShort }}</p>
              </div>
              <NuxtLink
                :to="`/centres/${activeCenter.id}`"
                class="shrink-0 rounded-full bg-ink px-md py-sm text-small font-semibold text-paper transition hover:bg-primary-dark"
              >
                Voir
              </NuxtLink>
            </div>
          </div>
        </div>
      </Teleport>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import type { CenterResult } from '~/types/center-result'

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

const resultsText = computed(() => {
  const count = filteredCenters.value.length
  const noun = count > 1 ? 'centres' : 'centre'
  return department.value.centers.length
    ? `${count} ${noun} dans le ${department.value.label}`
    : `0 centre en ${department.value.label}`
})

const mobileMapCount = computed(() => {
  const count = filteredCenters.value.length
  const noun = count > 1 ? 'centres' : 'centre'
  return `${count} ${noun} · ${department.value.label}`
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

function openMobileMap() {
  isMobileMapOpen.value = true
  if (process.client) {
    document.body.classList.add('overflow-hidden')
  }
}

function closeMobileMap() {
  isMobileMapOpen.value = false
  if (process.client) {
    document.body.classList.remove('overflow-hidden')
  }
}
</script>
