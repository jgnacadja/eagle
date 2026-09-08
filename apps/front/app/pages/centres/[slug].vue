<template>
  <div class="flex-1 bg-paper">
    <template v-if="centre">
      <!-- Hero -->
      <section
        class="border-b border-rule bg-linear-to-b from-paper to-surface"
        aria-labelledby="hero-title"
      >
        <div class="mx-auto max-w-container px-gutter-mobile md:px-gutter py-2xl">
          <div class="grid items-start gap-2xl lg:grid-cols-5">
            <div class="lg:col-span-3">
              <p class="text-overline text-accent-text uppercase">
                Réseau Learn Up Academy<template v-if="centre.department">
                  · {{ centre.department }}</template
                >
              </p>
              <h1
                id="hero-title"
                class="mt-sm font-display text-h2 font-extrabold text-ink lg:text-h1"
              >
                {{ centre.name }}
              </h1>
              <p class="mt-sm flex items-center gap-sm text-body text-ink-body">
                <IconMapPin :size="16" class="shrink-0 text-primary" />
                {{ heroAddress }}
              </p>

              <ul v-if="specialties.length" class="mt-md flex flex-wrap gap-sm">
                <Badge v-for="tag in specialties" :key="tag" as="li" variant="chip">
                  {{ tag }}
                </Badge>
              </ul>

              <div class="mt-2xl flex flex-wrap items-center gap-md">
                <Button
                  as-child
                  class="h-control w-full rounded-full bg-accent px-md py-sm text-button font-semibold text-ink transition hover:bg-accent-text sm:w-auto"
                >
                  <NuxtLink to="#formations">Trouver une formation dans ce centre</NuxtLink>
                </Button>
                <Button
                  as-child
                  variant="outline"
                  class="h-control w-full rounded-full border-outline bg-paper px-md py-sm text-button font-medium text-ink transition hover:border-primary hover:bg-paper hover:text-ink sm:w-auto"
                >
                  <NuxtLink to="#">Parler à un conseiller</NuxtLink>
                </Button>
                <NuxtLink
                  v-if="centre.phone"
                  :to="`tel:${centre.phone.replace(/\s/g, '')}`"
                  class="hidden items-center gap-2 font-medium text-ink sm:inline-flex"
                >
                  <IconPhone :size="16" class="text-primary" />
                  {{ centre.phone }}
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Contenu principal -->
      <div class="mx-auto max-w-container px-gutter-mobile md:px-gutter py-section">
        <div class="flex flex-col gap-2xl lg:flex-row">
          <!-- Barre latérale -->
          <aside
            class="order-1 flex w-full shrink-0 flex-col gap-2xl lg:order-2 lg:w-callout"
            aria-label="Informations complémentaires"
          >
            <!-- Informations pratiques -->
            <section aria-labelledby="infos-title">
              <Card class="h-fit bg-surface">
                <CardHeader class="p-lg pb-0">
                  <h2 id="infos-title" class="font-sans text-h4 font-semibold text-ink">
                    Informations pratiques
                  </h2>
                </CardHeader>
                <CardContent class="p-lg pt-md">
                  <ul class="space-y-md text-small">
                    <li class="flex gap-sm">
                      <IconMapPin :size="17" class="mt-xs shrink-0 text-primary" />
                      <span class="text-ink-body">
                        {{ centre.address }}<br />{{ centre.postal_code }} {{ centre.city
                        }}<template v-if="centre.department"> · {{ centre.department }}</template
                        ><template v-if="centre.region"> · {{ centre.region }}</template>
                      </span>
                    </li>
                    <li v-if="centre.phone" class="flex gap-sm">
                      <IconPhone :size="17" class="mt-xs shrink-0 text-primary" />
                      <NuxtLink
                        :to="`tel:${centre.phone.replace(/\s/g, '')}`"
                        class="font-medium text-ink hover:underline"
                      >
                        {{ centre.phone }}
                      </NuxtLink>
                    </li>
                    <li v-if="centre.email" class="flex gap-sm">
                      <IconMail :size="17" class="mt-xs shrink-0 text-primary" />
                      <NuxtLink :to="`mailto:${centre.email}`" class="text-ink hover:underline">
                        {{ centre.email }}
                      </NuxtLink>
                    </li>
                    <li v-if="centre.opening_hours" class="flex gap-sm">
                      <IconClock :size="17" class="mt-xs shrink-0 text-primary" />
                      <span class="text-ink-body">{{ centre.opening_hours }}</span>
                    </li>
                    <li v-if="centre.transport" class="flex gap-sm">
                      <IconTimetable :size="17" class="mt-xs shrink-0 text-primary" />
                      <span class="text-ink-body">{{ centre.transport }}</span>
                    </li>
                    <li v-if="centre.parking" class="flex gap-sm">
                      <IconParking :size="17" class="mt-xs shrink-0 text-primary" />
                      <span class="text-ink-body">{{ centre.parking }}</span>
                    </li>
                    <li v-if="centre.pmr_accessible" class="flex gap-sm">
                      <IconAccessibility :size="17" class="mt-xs shrink-0 text-primary" />
                      <span class="text-ink-body">Locaux accessibles PMR</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </section>

            <!-- Qualité -->
            <section v-if="centre.qualiopi_certified" aria-labelledby="qualite-title">
              <Card class="h-fit bg-paper">
                <CardHeader class="p-lg pb-0">
                  <h2 id="qualite-title" class="font-sans text-h4 font-semibold text-ink">
                    Qualité et certifications
                  </h2>
                </CardHeader>
                <CardContent class="p-lg pt-md pb-0">
                  <div class="flex gap-sm">
                    <span
                      class="flex h-control-sm w-control-sm shrink-0 items-center justify-center rounded-sm bg-surface-alt"
                      aria-hidden="true"
                    >
                      <IconAward :size="22" class="text-primary" />
                    </span>
                    <div class="text-small">
                      <p class="font-semibold text-ink">Certification Qualiopi</p>
                      <p class="text-ink-body">
                        Actions de formation<template v-if="centre.qualiopi_certificate_number">
                          · réf. {{ centre.qualiopi_certificate_number }}</template
                        >.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>
          </aside>

          <!-- Colonne principale -->
          <div class="order-2 flex flex-1 flex-col gap-2xl lg:order-1">
            <!-- Le centre -->
            <section v-if="centre.description" aria-labelledby="le-centre-title">
              <h2 id="le-centre-title" class="font-display text-h2 font-extrabold text-ink">
                Le centre
              </h2>
              <div
                class="mt-sm max-w-prose text-body leading-relaxed text-ink-body"
                v-html="sanitizeHtml(centre.description)"
              />
            </section>

            <!-- Formations disponibles -->
            <section id="formations" aria-labelledby="formations-title">
              <div class="flex flex-wrap items-baseline justify-between gap-sm">
                <h2 id="formations-title" class="font-display text-h2 font-extrabold text-ink">
                  Les formations disponibles dans ce centre
                </h2>
                <span v-if="centreCatalog.data.value" class="text-small text-ink-muted">
                  {{ centreCatalog.data.value.total }} formation{{
                    centreCatalog.data.value.total > 1 ? 's' : ''
                  }}
                </span>
              </div>
              <div v-if="formations.length" class="mt-md grid gap-grid sm:grid-cols-2">
                <CenterFormationCard
                  v-for="formation in formations"
                  :key="formation.slug"
                  :family="formation.family"
                  :title="formation.title"
                  :description="formation.description"
                  :meta="formation.meta"
                  :to="formation.to ?? undefined"
                />
              </div>
              <p v-else class="mt-md text-small text-ink-muted">
                Aucune session programmée dans ce centre pour le moment — les formations restent
                disponibles en intra ou dans un centre voisin.
              </p>
              <Button
                v-if="(centreCatalog.data.value?.total ?? 0) > formations.length"
                as-child
                variant="link"
                class="mt-md h-auto p-0 text-small font-bold text-primary hover:text-ink hover:no-underline"
              >
                <NuxtLink :to="`/formations?lieu=${centre.city ?? ''}`"
                  >Voir toutes les formations du centre →</NuxtLink
                >
              </Button>
            </section>

            <!-- Prochaines sessions dans ce centre -->
            <section v-if="sessions.length" aria-labelledby="sessions-title">
              <h2 id="sessions-title" class="font-display text-h2 font-extrabold text-ink">
                Prochaines sessions
              </h2>
              <p class="mt-sm text-small text-ink-muted">Disponibilités actualisées en continu.</p>
              <ul class="mt-md space-y-md">
                <li v-for="session in sessions" :key="session.key">
                  <SessionCard
                    :day="session.day"
                    :month="session.month"
                    :title="session.title"
                    :meta="session.meta"
                    :places="session.places"
                    :type="session.type"
                    :to="session.to"
                  />
                </li>
              </ul>
            </section>
          </div>
        </div>

        <!-- Bandeau CTA -->
        <CtaBanner
          class="mt-2xl"
          title="Un besoin de formation sur ce territoire ?"
          text="La demande transmet automatiquement le centre, la ville et la formation concernée — sans ressaisie."
        >
          <Button
            as-child
            class="h-control w-full rounded-full bg-paper px-lg py-sm text-center text-button font-bold text-ink transition hover:bg-surface sm:w-auto"
          >
            <NuxtLink :to="`/centres/demande-de-formation?centre=${slug}`"
              >Demander une formation</NuxtLink
            >
          </Button>
          <Button
            as-child
            variant="outline"
            class="h-control w-full rounded-full border-outline-inverse bg-transparent px-lg py-sm text-center text-button font-medium text-ink-inverse transition hover:border-ink-inverse hover:bg-ink-inverse/10 sm:w-auto"
          >
            <NuxtLink to="#">Parler à un conseiller</NuxtLink>
          </Button>
        </CtaBanner>

        <!-- Autres centres de la région -->
        <section v-if="nearbyCenters.length" class="mt-2xl" aria-labelledby="autres-title">
          <div class="flex flex-wrap items-baseline justify-between gap-sm">
            <h2 id="autres-title" class="font-display text-h2 font-extrabold text-ink">
              Autres centres<template v-if="centre.region"> en {{ centre.region }}</template>
            </h2>
            <Button
              as-child
              variant="link"
              class="hidden h-auto p-0 text-small font-bold text-primary hover:text-ink hover:no-underline sm:inline"
            >
              <NuxtLink to="/centres">Voir le réseau de centres →</NuxtLink>
            </Button>
          </div>
          <div class="mt-md grid gap-grid sm:grid-cols-3">
            <NuxtLink
              v-for="nearby in nearbyCenters"
              :key="nearby.slug"
              :to="`/centres/${nearby.slug}`"
              class="block"
            >
              <CenterCard
                :name="nearby.name"
                :distance="nearby.city ?? ''"
                :formations="nearby.specialties"
                :tags="[]"
                class="h-full transition hover:shadow-md"
              />
            </NuxtLink>
          </div>
          <Button
            as-child
            variant="link"
            class="mt-md h-auto p-0 text-small font-bold text-primary hover:text-ink hover:no-underline sm:hidden"
          >
            <NuxtLink to="/centres">Voir le réseau de centres →</NuxtLink>
          </Button>
        </section>
      </div>
    </template>

    <!-- État : erreur de chargement -->
    <LoadError
      v-else-if="loadError"
      title="Les informations du centre n'ont pas pu être chargées."
      link-to="/centres"
      link-label="Voir le réseau de centres"
      @retry="retry"
    >
      Le problème est temporaire. Vous pouvez réessayer, ou consulter le réseau de centres.
    </LoadError>

    <!-- État : centre introuvable -->
    <NotFound
      v-else
      title="Centre introuvable"
      primary-to="/centres"
      primary-label="Voir le réseau LEARN UP"
      secondary-to="/formations"
      secondary-label="Trouver ma formation"
      search-placeholder="Décrivez votre besoin — formation, ville, échéance"
      search-input-id="centre-search"
      @search="onErrorSearch"
    >
      <template #icon>
        <IconMapPinOff :size="28" class="text-ink" />
      </template>
      Cette page de centre n'existe pas ou n'est plus disponible. Consultez le réseau
      LEARN&nbsp;UP&nbsp;ACADEMY pour trouver un centre.
    </NotFound>
  </div>
</template>

<script setup lang="ts">
import { readItems } from '@directus/sdk'
import type { Centre, CourseListItem, CourseSession } from '@learnup/types'
import {
  mapCourse,
  upcomingSessions,
  useCatalog,
  type FormationItem
} from '~/composables/useCatalog'
import { sanitizeHtml } from '~/utils/sanitizeHtml'
import { MODALITY_LABELS } from '~/utils/catalog-filters'
import { sessionSeatType } from '~/utils/placesLabel'

const route = useRoute()
const slug = route.params.slug as string

const directus = useDirectusClient()

const {
  data: centre,
  error: loadError,
  refresh
} = await useAsyncData<Centre | null>(`centre-${slug}`, async () => {
  // ?error=1 simule une erreur de chargement pour prévisualiser l'état erreur.
  if (route.query.error === '1') {
    throw new Error('Centre load failed')
  }
  try {
    const results = await directus.request<Centre[]>(
      readItems('centres', {
        filter: { slug: { _eq: slug }, status: { _eq: 'published' } },
        limit: 1
      })
    )
    return results[0] ?? null
  } catch (error) {
    if (import.meta.server) {
      logServerError(`[centres/slug] ${slug} load failed:`, error)
    }
    throw error
  }
})

type PageState = 'found' | 'not-found' | 'error'
const pageState = computed<PageState>(() => {
  if (loadError.value) return 'error'
  return centre.value ? 'found' : 'not-found'
})

// Statut HTTP côté SSR selon l'état affiché.
const requestEvent = useRequestEvent()
if (requestEvent) {
  if (pageState.value === 'error') {
    setResponseStatus(requestEvent, 500, 'Erreur de chargement du centre')
  } else if (pageState.value === 'not-found') {
    setResponseStatus(requestEvent, 404, 'Centre introuvable')
  }
}

const heroAddress = computed(() =>
  [centre.value?.address, centre.value?.postal_code, centre.value?.city, centre.value?.region]
    .filter(Boolean)
    .join(', ')
)

const specialties = computed(() => centre.value?.specialties ?? [])

// Breadcrumb adapté à l'état affiché. route.meta est partagé entre toutes
// les routes /centres/:slug : on réassigne la valeur à chaque changement
// d'état pour ne pas conserver le breadcrumb d'un slug précédent.
const defaultBreadcrumb = computed(() => [
  { label: 'Accueil', to: '/' },
  { label: 'Réseau de centres', to: '/centres' },
  ...(centre.value?.region ? [{ label: centre.value.region, to: '/centres' }] : []),
  { label: centre.value?.name ?? 'Centre' }
])
const stateLabels: Record<Exclude<PageState, 'found'>, string> = {
  'not-found': 'Centre introuvable',
  error: 'Erreur de chargement'
}
watchEffect(() => {
  const stateLabel = pageState.value === 'found' ? null : stateLabels[pageState.value]
  route.meta.breadcrumb = stateLabel
    ? [
        { label: 'Accueil', to: '/' },
        { label: 'Réseau de centres', to: '/centres' },
        { label: stateLabel }
      ]
    : defaultBreadcrumb.value
})

useContentSeo(
  () => {
    const isFound = pageState.value === 'found'
    const stateLabel = isFound ? null : stateLabels[pageState.value]
    const name = centre.value?.name ?? 'Centre'
    return {
      seo_title: isFound
        ? (centre.value?.seo_title ?? `${name} — LEARN UP ACADEMY`)
        : (stateLabel ?? name),
      seo_description: isFound
        ? (centre.value?.seo_description ??
          `Centre de formation ${centre.value?.city ?? ''} — LEARN UP ACADEMY.`)
        : undefined,
      seo_noindex: !isFound
    }
  },
  () => {
    const isFound = pageState.value === 'found'
    const stateLabel = isFound ? null : stateLabels[pageState.value]
    return stateLabel ?? centre.value?.name ?? 'Centre — LEARN UP ACADEMY'
  }
)

// Formations dispensées dans ce centre : sessions de la source catalogue
// rattachées au slug du centre (filtre `center` de l'API).
const centreCatalog = await useCatalog({ center: slug, limit: 12, page: 1 })

const familyNames = await useMenuFamilles()
// computed : familyNames peut se résoudre après le premier rendu — un Map
// figé garderait des libellés de famille manquants.
const familyLabel = computed(() => new Map((familyNames.value ?? []).map((f) => [f.slug, f.label])))

const formations = computed<FormationItem[]>(
  () =>
    centreCatalog.data.value?.items
      .slice(0, 4)
      .map((course) =>
        mapCourse(course, course.familySlug ? familyLabel.value.get(course.familySlug) : undefined)
      ) ?? []
)

interface CentreSession {
  key: string
  day: string
  month: string
  title: string
  meta: string
  places?: number
  type?: 'success' | 'warning'
  to: string
}

function sessionDayMonth(startDate: string): { day: string; month: string } {
  const date = new Date(`${startDate}T00:00:00Z`)
  const day = String(date.getUTCDate()).padStart(2, '0')
  const month = new Intl.DateTimeFormat('fr-FR', { month: 'short', timeZone: 'UTC' })
    .format(date)
    .replace('.', '')
  return { day, month }
}

function sessionMeta(course: CourseListItem, session: CourseSession): string {
  const duration = course.durationDays ? `${course.durationDays} jours` : ''
  const modality = session.modality ? (MODALITY_LABELS[session.modality] ?? session.modality) : ''
  return [duration, modality].filter(Boolean).join(' · ')
}

function toCentreSession(
  course: CourseListItem,
  session: CourseSession
): (CentreSession & { startDate: string }) | null {
  if (session.location?.centreSlug !== slug || !session.startDate) return null

  const { day, month } = sessionDayMonth(session.startDate)
  const places = session.seatsRemaining ?? undefined

  return {
    key: session.id ?? `${course.slug}-${session.startDate}`,
    startDate: session.startDate,
    day,
    month,
    title: course.title,
    meta: sessionMeta(course, session),
    places,
    type: sessionSeatType(places),
    to: course.familySlug ? `/formations/${course.familySlug}/${course.slug}` : '/formations'
  }
}

const sessions = computed<CentreSession[]>(() =>
  (centreCatalog.data.value?.items ?? [])
    .flatMap((course) =>
      upcomingSessions(course).map((session) => toCentreSession(course, session))
    )
    .filter((s): s is CentreSession & { startDate: string } => s !== null)
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
    .slice(0, 4)
)

// Autres centres de la même région, chargés depuis Directus.
const allCentres = await useDirectusList<Centre>('centres', 'centres-siblings', {
  fields: ['slug', 'name', 'city', 'region', 'specialties'],
  filter: { status: { _eq: 'published' } },
  limit: -1
})

const nearbyCenters = computed(() =>
  (allCentres.value ?? [])
    .filter((c) => c.slug !== slug && (!centre.value?.region || c.region === centre.value.region))
    .slice(0, 3)
    .map((c) => ({
      slug: c.slug,
      name: c.name,
      city: c.city,
      specialties: (c.specialties ?? []).join(' · ')
    }))
)

function retry() {
  if (route.query.error === '1') {
    // Retire le paramètre de simulation pour permettre un vrai rechargement.
    const { error: _error, ...query } = route.query
    navigateTo({ path: route.path, query })
  } else {
    refresh()
  }
}

function onErrorSearch(query: string) {
  navigateTo({ path: '/formations', query: query ? { q: query } : {} })
}
</script>
