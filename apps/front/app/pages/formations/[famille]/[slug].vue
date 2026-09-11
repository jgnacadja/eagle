<template>
  <div class="bg-white">
    <template v-if="course">
      <!-- Hero -->
      <section
        class="border-b border-rule bg-linear-to-b from-paper to-surface"
        aria-labelledby="formation-title"
      >
        <div class="mx-auto max-w-container px-gutter-mobile py-2xl md:px-gutter">
          <div class="grid items-start gap-2xl lg:grid-cols-5">
            <div class="lg:col-span-3">
              <p class="text-overline text-accent-text">
                {{ familyName }}
                <template v-if="course.certification"> · Formation certifiante</template>
              </p>
              <h1
                id="formation-title"
                class="mt-sm font-display text-h2 font-bold text-ink lg:text-h1"
              >
                {{ course.title }}
              </h1>
              <p v-if="course.description" class="mt-md max-w-prose text-body text-ink-body">
                {{ course.description }}
              </p>

              <ul class="mt-md flex flex-wrap gap-sm">
                <Badge v-if="durationTag" as="li" variant="chip">{{ durationTag }}</Badge>
                <Badge v-if="course.cpf" as="li" variant="chip">Éligible CPF</Badge>
                <Badge v-if="certificationTag" as="li" variant="chip">{{ certificationTag }}</Badge>
                <Badge v-if="sessionBadge" as="li" variant="success">
                  <span class="h-sm w-sm rounded-full bg-current" aria-hidden="true" />
                  {{ sessionBadge }}
                </Badge>
              </ul>

              <!-- CTA desktop -->
              <div class="mt-2xl hidden flex-wrap items-center gap-md lg:flex">
                <Button
                  as-child
                  class="h-control rounded-full bg-accent px-md py-sm text-button font-semibold text-ink transition hover:bg-accent-text"
                >
                  <NuxtLink :to="demandeTo">Demander cette formation</NuxtLink>
                </Button>
                <Button
                  v-if="course.generatedProgramUrl"
                  as-child
                  variant="outline"
                  class="h-control rounded-full border-outline bg-paper px-md py-sm text-button font-semibold text-ink transition hover:border-primary hover:bg-paper"
                >
                  <NuxtLink href="#sessionsList"> Voir les sessions </NuxtLink>
                </Button>
                <Button
                  v-if="course.imageUrl"
                  as-child
                  variant="link"
                  class="h-auto gap-sm p-0 text-small font-medium text-ink-muted hover:text-ink hover:no-underline"
                >
                  <NuxtLink :to="course.imageUrl" target="_blank" rel="noopener noreferrer">
                    <IconDownload :size="16" class="inline" />
                    Programme (PDF)
                  </NuxtLink>
                </Button>
              </div>
            </div>

            <figure
              class="flex aspect-video items-center justify-center rounded-md border border-dashed border-outline bg-surface-alt text-center text-small text-ink-muted lg:col-span-2 lg:aspect-4/3"
            >
              <img
                v-if="course.imageUrl"
                :src="course.imageUrl"
                :alt="course.title"
                class="h-full w-full rounded-md object-cover"
              />
              <figcaption v-else>
                {{ course.title }}
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      <!-- Contenu principal -->
      <div class="mx-auto max-w-container px-gutter-mobile py-section md:px-gutter">
        <div class="flex flex-col gap-2xl lg:flex-row">
          <!-- Colonne principale -->
          <div class="min-w-0 flex-1 space-y-2xl">
            <!-- À propos -->
            <section v-if="course.description" aria-labelledby="apropos-title">
              <h2 id="apropos-title" class="font-display text-h2 font-extrabold text-ink">
                À propos de cette formation
              </h2>
              <div class="mt-md space-y-md text-body text-ink-body">
                <p>{{ course.description }}</p>
              </div>
            </section>

            <!-- Objectifs -->
            <section v-if="objectives.length" aria-labelledby="objectifs-title">
              <h2 id="objectifs-title" class="font-display text-h2 font-extrabold text-ink">
                Objectifs pédagogiques
              </h2>
              <ul class="mt-md space-y-sm">
                <li v-for="(objectif, idx) in objectives" :key="idx" class="flex gap-sm">
                  <IconCheck :size="20" class="mt-xs shrink-0 text-success" />
                  <span class="text-body text-ink-body" v-html="sanitizeHtml(objectif)" />
                </li>
              </ul>
            </section>

            <!-- Public & prérequis -->
            <section v-if="course.targets || course.prerequisites" aria-label="Public et prérequis">
              <div class="grid gap-md sm:grid-cols-2">
                <Card v-if="course.targets?.length" class="bg-surface">
                  <CardHeader class="p-lg pb-0">
                    <h3 class="font-sans text-h4 font-semibold text-ink">Public concerné</h3>
                  </CardHeader>
                  <CardContent class="p-lg pt-sm">
                    <ul class="space-y-sm text-small text-ink-body">
                      <li v-for="item in course.targets" :key="item">· {{ item }}</li>
                    </ul>
                  </CardContent>
                </Card>
                <Card class="bg-surface">
                  <CardHeader class="p-lg pb-0">
                    <h3 class="font-sans text-h4 font-semibold text-ink">Prérequis</h3>
                  </CardHeader>
                  <CardContent class="p-lg pt-sm">
                    <ul
                      v-if="course.prerequisites?.length"
                      class="space-y-sm text-small text-ink-body"
                    >
                      <li v-for="item in course.prerequisites" :key="item">· {{ item }}</li>
                    </ul>
                    <p v-else class="text-small text-ink-body">Aucun prérequis particulier.</p>
                  </CardContent>
                </Card>
              </div>
            </section>

            <!-- Programme -->
            <section v-if="programme.length" aria-labelledby="programme-title">
              <div class="flex flex-wrap items-baseline justify-between gap-md">
                <h2 id="programme-title" class="font-display text-h2 font-extrabold text-ink">
                  Programme
                </h2>
                <p v-if="durationLabel" class="text-small text-ink-subtle">{{ durationLabel }}</p>
              </div>

              <div
                class="mt-md divide-y divide-rule overflow-hidden rounded-md border border-rule bg-paper"
              >
                <div
                  v-for="(module, index) in programme"
                  :key="index"
                  class="flex items-center gap-md p-lg"
                >
                  <span
                    class="flex h-xl w-xl shrink-0 items-center justify-center rounded-full bg-primary-dark text-small font-semibold text-ink-inverse"
                    aria-hidden="true"
                  >
                    {{ index + 1 }}
                  </span>
                  <span class="min-w-0 flex-1">
                    <span class="block font-semibold text-ink">{{ module.title }}</span>
                    <span
                      v-if="module.description"
                      class="block text-small text-ink-muted"
                      v-html="sanitizeHtml(module.description)"
                    />
                  </span>
                  <span v-if="module.duration" class="shrink-0 text-small text-ink-subtle">
                    {{ module.duration }}
                  </span>
                </div>
              </div>
            </section>

            <!-- Prochaines sessions -->
            <section v-if="sessionsList.length" id="sessionsList" aria-labelledby="sessions-title">
              <div class="flex flex-wrap items-baseline justify-between gap-md">
                <h2 id="sessions-title" class="font-display text-h2 font-extrabold text-ink">
                  Prochaines sessions
                </h2>
                <p class="text-small text-ink-subtle">Disponibilités actualisées en continu.</p>
              </div>
              <ul class="mt-md space-y-md">
                <li v-for="session in sessionsList" :key="session.key">
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
              <div class="mt-1">
                <NuxtLink href="#" class="text-ink-muted font-bold text-h4"
                  >Voir toutes les sessions de cette formation →</NuxtLink
                >
              </div>
            </section>

            <!-- Où suivre cette formation -->
            <section v-if="lieux.length" aria-labelledby="lieux-title">
              <h2 id="lieux-title" class="font-display text-h2 font-extrabold text-ink">
                Où suivre cette formation
              </h2>
              <div class="mt-md space-y-md text-body text-ink-body">
                <p>
                  Centres du réseau proposant cette formation — rattachements actifs uniquement
                  (RG-CAT-04).
                </p>
              </div>
              <ul class="mt-md grid gap-md sm:grid-cols-2 xl:grid-cols-3">
                <li v-for="lieu in lieux" :key="lieu.key">
                  <CenterCard
                    :name="lieu.name"
                    :distance="lieu.department"
                    :formations="lieu.modalities"
                    :status="lieu.status"
                    :to="lieu.to"
                    class="h-full transition hover:shadow-md"
                  />
                </li>
              </ul>
            </section>

            <!-- Bandeau CTA -->
            <CtaBanner
              title="Vous ne savez pas quelle formation choisir ?"
              text="Décrivez votre besoin : LEARN UP identifie la formation, la catégorie et le format adaptés à votre situation."
            >
              <Button
                as-child
                class="h-control w-full rounded-md bg-paper px-md py-sm text-button font-semibold text-ink transition hover:bg-surface sm:w-auto"
              >
                <NuxtLink to="#">Être guidé dans mon choix</NuxtLink>
              </Button>
              <Button
                as-child
                variant="outline"
                class="h-control w-full rounded-md border-outline-inverse bg-transparent px-md py-sm text-button font-semibold text-ink-inverse transition hover:bg-transparent hover:text-ink-inverse sm:w-auto"
              >
                <NuxtLink to="#">Parler à un conseiller</NuxtLink>
              </Button>
            </CtaBanner>

            <!-- Formations similaires -->
            <section v-if="similaires.length" aria-labelledby="similaires-title">
              <div class="flex flex-wrap items-baseline justify-between gap-md">
                <h2 id="similaires-title" class="font-display text-h2 font-extrabold text-ink">
                  Formations similaires
                </h2>
                <Button
                  as-child
                  variant="link"
                  class="h-auto p-0 text-small font-bold text-primary hover:text-ink hover:no-underline"
                >
                  <NuxtLink :to="`/formations/${famille}`"
                    >Voir la famille {{ familyName }} →</NuxtLink
                  >
                </Button>
              </div>
              <div class="mt-md grid gap-md sm:grid-cols-3">
                <CenterFormationCard
                  v-for="similaire in similaires"
                  :key="similaire.slug"
                  :family="similaire.family"
                  :title="similaire.title"
                  :meta="similaire.meta"
                  :to="similaire.to ?? undefined"
                />
              </div>
            </section>
          </div>

          <!-- Barre latérale -->
          <aside
            class="w-full shrink-0 space-y-lg self-start lg:sticky lg:top-lg lg:w-callout"
            aria-label="Informations complémentaires"
          >
            <!-- L'essentiel -->
            <section id="demande" aria-labelledby="essentiel-title">
              <Card class="bg-surface">
                <CardHeader class="p-lg pb-0">
                  <h2 id="essentiel-title" class="font-sans text-h4 font-semibold text-ink">
                    L'essentiel
                  </h2>
                </CardHeader>
                <CardContent class="p-lg pt-md">
                  <dl class="space-y-sm text-small">
                    <div
                      v-for="item in essentiel"
                      :key="item.label"
                      class="flex justify-between gap-md"
                    >
                      <dt class="text-ink-muted">{{ item.label }}</dt>
                      <dd class="text-right font-medium text-ink">{{ item.value }}</dd>
                    </div>
                  </dl>
                  <div class="mt-lg space-y-sm">
                    <Button
                      as-child
                      class="h-control w-full rounded-md bg-primary-dark px-md py-sm text-button font-semibold text-ink-inverse transition hover:bg-primary"
                    >
                      <NuxtLink :to="demandeTo">Demander cette formation</NuxtLink>
                    </Button>
                    <Button
                      as-child
                      variant="outline"
                      class="h-control w-full rounded-md border-outline bg-paper px-md py-sm text-button font-semibold text-ink transition hover:border-primary hover:bg-paper"
                    >
                      <NuxtLink to="#">Parler à un conseiller</NuxtLink>
                    </Button>
                  </div>
                  <p class="mt-sm text-meta leading-relaxed text-ink-subtle">
                    Le contexte de la formation est transmis automatiquement avec la demande — sans
                    ressaisie (RG-CAT-05).
                  </p>
                </CardContent>
              </Card>
            </section>

            <!-- Certification -->
            <section v-if="course.certification" aria-labelledby="certification-title">
              <Card>
                <CardHeader class="p-lg pb-0">
                  <h2 id="certification-title" class="font-sans text-h4 font-semibold text-ink">
                    Certification
                  </h2>
                </CardHeader>
                <CardContent class="p-lg pt-md">
                  <div class="flex gap-sm">
                    <span
                      class="flex h-control-sm w-control-sm shrink-0 items-center justify-center rounded-full bg-accent-soft"
                      aria-hidden="true"
                    >
                      <IconAward :size="20" class="text-accent-text" />
                    </span>
                    <div>
                      <p class="text-small font-medium text-ink">{{ course.certification }}</p>
                      <p v-if="course.certifierName" class="mt-xs text-small text-ink-muted">
                        {{ course.certifierName }}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            <!-- Modalités & évaluation -->
            <section
              v-if="modaliteLabels.length || course.evaluation?.length"
              aria-labelledby="modalites-title"
            >
              <Card>
                <CardHeader class="p-lg pb-0">
                  <h2 id="modalites-title" class="font-sans text-h4 font-semibold text-ink">
                    Modalités & évaluation
                  </h2>
                </CardHeader>
                <CardContent class="space-y-md p-lg pt-md">
                  <div v-if="modaliteLabels.length">
                    <p class="text-meta font-semibold uppercase tracking-wide text-ink-muted">
                      Modalités
                    </p>
                    <ul class="mt-sm flex flex-wrap gap-sm">
                      <Badge v-for="m in modaliteLabels" :key="m" as="li" variant="chip">
                        {{ m }}
                      </Badge>
                    </ul>
                  </div>
                  <div v-if="course.evaluation?.length">
                    <p class="text-meta font-semibold uppercase tracking-wide text-ink-muted">
                      Évaluation
                    </p>
                    <ul class="mt-sm space-y-xs text-small text-ink-body">
                      <li v-for="item in course.evaluation" :key="item">· {{ item }}</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </section>

            <!-- Formation en intra -->
            <Card class="bg-primary-dark p-lg" aria-labelledby="intra-title">
              <h2 id="intra-title" class="font-sans text-h4 font-semibold text-ink-inverse">
                Formation en intra
              </h2>
              <p class="mt-sm text-small leading-relaxed text-ink-inverse/70">
                Cette formation peut être organisée dans votre entreprise, sur vos équipements. Le
                formulaire conserve la formation et le besoin — le centre n'est pas imposé.
              </p>
              <Button
                as-child
                class="mt-md h-control w-full rounded-md bg-paper px-md py-sm text-button font-semibold text-ink transition hover:bg-surface"
              >
                <NuxtLink :to="demandeTo">Organiser cette formation dans mon entreprise</NuxtLink>
              </Button>
            </Card>

            <!-- Programme PDF -->
            <Button
              v-if="course.generatedProgramUrl"
              as-child
              variant="outline"
              class="h-control w-full gap-sm rounded-md border-rule bg-paper px-md py-sm text-small font-medium text-ink transition hover:border-outline hover:bg-paper"
            >
              <NuxtLink :to="course.generatedProgramUrl" target="_blank" rel="noopener noreferrer">
                <IconDownload :size="16" />
                Télécharger le programme détaillé (PDF)
              </NuxtLink>
            </Button>
          </aside>
        </div>
      </div>

      <!-- Barre CTA fixe mobile -->
      <div
        ref="mobileCta"
        class="fixed inset-x-0 bottom-0 z-10 border-t border-rule bg-paper p-lg lg:hidden"
      >
        <div class="flex items-center justify-between gap-md">
          <div class="min-w-0">
            <p v-if="priceLabel" class="font-semibold text-ink">{{ priceLabel }}</p>
            <p class="text-small text-ink-muted">Demander un devis ou une session</p>
          </div>
          <Button
            as-child
            class="h-control shrink-0 rounded-full bg-accent px-md py-sm text-button font-semibold text-ink transition hover:bg-accent-text"
          >
            <NuxtLink :to="demandeTo">Demander cette formation</NuxtLink>
          </Button>
        </div>
      </div>
      <div class="h-4xl lg:hidden" aria-hidden="true" :style="spacerStyle" />
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

    <!-- État : formation indisponible -->
    <NotFound
      v-else
      title="Cette formation n'est pas disponible."
      primary-to="/formations"
      primary-label="Voir le catalogue"
      secondary-to="#"
      secondary-label="Être guidé dans mon choix"
      search-placeholder="Intitulé, compétence ou certification"
      search-label="Rechercher une formation"
      search-input-id="formation-search"
      @search="onErrorSearch"
    >
      <template #icon>
        <IconFileOff :size="32" class="text-ink" />
      </template>
      La page demandée n'existe pas ou n'est plus publiée. Le catalogue présente l'ensemble des
      formations actuellement proposées.
    </NotFound>
  </div>
</template>

<script setup lang="ts">
import { useElementSize } from '@vueuse/core'
import { readItems } from '@directus/sdk'
import type { Course, CourseSession, FamilleFormation } from '@learnup/types'
import { useDirectusClient } from '~/composables/useDirectus'
import {
  buildSessionBadge,
  mapCourse,
  upcomingSessions,
  useCatalog,
  type FormationItem
} from '~/composables/useCatalog'
import { sanitizeHtml } from '~/utils/sanitizeHtml'
import { MODALITY_LABELS } from '~/utils/catalog-filters'
import { sessionSeatType } from '~/utils/placesLabel'

interface ProgrammeModule {
  title: string
  description?: string
  duration?: string
}

const route = useRoute()
const famille = route.params.famille as string
const slug = route.params.slug as string

const config = useRuntimeConfig()
const directus = useDirectusClient()

const {
  data: course,
  error: loadError,
  refresh
} = await useAsyncData<Course | null>(`course-${famille}-${slug}`, async () => {
  try {
    const result = await $fetch<Course>(
      `${import.meta.server ? config.apiBase : config.public.apiBase}/courses/${famille}/${slug}`
    )
    return result
  } catch (error: unknown) {
    if (
      error &&
      typeof error === 'object' &&
      'statusCode' in error &&
      (error as { statusCode: number }).statusCode === 404
    ) {
      return null
    }
    if (import.meta.server) {
      logServerError(`[formations/slug] ${famille}/${slug} load failed:`, error)
    }
    throw error
  }
})

const { data: familleData } = await useAsyncData<FamilleFormation | null>(
  `famille-name-${famille}`,
  async () => {
    try {
      const results = await directus.request<FamilleFormation[]>(
        readItems('familles_formation', {
          filter: { slug: { _eq: famille }, status: { _eq: 'published' } },
          limit: 1,
          fields: ['name']
        })
      )
      return results[0] ?? null
    } catch (error) {
      if (import.meta.server) {
        logServerError(`[formations/slug] family ${famille} name fetch failed:`, error)
      }
      return null
    }
  }
)

const familyName = computed(() => familleData.value?.name ?? famille)

type PageState = 'found' | 'not-found' | 'error'
const pageState = computed<PageState>(() => {
  if (loadError.value) return 'error'
  return course.value ? 'found' : 'not-found'
})

const requestEvent = useRequestEvent()
if (requestEvent) {
  if (pageState.value === 'error') {
    setResponseStatus(requestEvent, 500, 'Erreur de chargement de la formation')
  } else if (pageState.value === 'not-found') {
    setResponseStatus(requestEvent, 404, 'Formation introuvable')
  }
}

const defaultBreadcrumb = computed(() => [
  { label: 'Accueil', to: '/' },
  { label: 'Formations', to: '/formations' },
  { label: familyName.value, to: `/formations/${famille}` },
  { label: course.value?.title ?? 'Formation introuvable' }
])

const stateLabels: Record<Exclude<PageState, 'found'>, string> = {
  'not-found': 'Formation indisponible',
  error: 'Erreur de chargement'
}

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
    const title = stateLabel ?? course.value?.title ?? 'Formation — LEARN UP ACADEMY'

    return {
      seo_title: isFound
        ? (course.value?.seoTitle ?? course.value?.title ?? 'Formation — LEARN UP ACADEMY')
        : title,
      seo_description: isFound
        ? (course.value?.seoDescription ?? course.value?.description)
        : undefined,
      seo_canonical: isFound ? course.value?.seoCanonical : undefined,
      seo_noindex: !isFound
    }
  },
  () => {
    const isFound = pageState.value === 'found'
    const stateLabel = isFound ? null : stateLabels[pageState.value]
    return stateLabel ?? course.value?.title ?? 'Formation — LEARN UP ACADEMY'
  }
)

useHead({
  script: computed(() => {
    if (!course.value || pageState.value !== 'found') return []
    return [
      {
        type: 'application/ld+json',
        innerHTML: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Course',
          name: course.value.title,
          description: course.value.description ?? '',
          provider: {
            '@type': 'Organization',
            name: 'LEARN UP ACADEMY',
            url: config.public.siteUrl
          },
          url: `${config.public.siteUrl}/formations/${famille}/${slug}`
        })
      }
    ]
  })
})

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

const mobileCta = ref<HTMLElement | null>(null)
const { height: mobileCtaHeight } = useElementSize(mobileCta)
const spacerStyle = computed(() =>
  mobileCtaHeight.value > 0 ? { height: `${mobileCtaHeight.value}px` } : {}
)

const durationTag = computed(() => {
  if (!course.value) return ''
  const parts: string[] = []
  if (course.value.durationDays) parts.push(`${course.value.durationDays} jours`)
  if (course.value.durationHours) parts.push(`${course.value.durationHours} h`)
  if (parts.length === 0) return ''
  return parts.join(' · ')
})

const sessionBadge = computed(() => (course.value ? buildSessionBadge(course.value) : null))

const certificationTag = computed(() => {
  if (!course.value?.certification) return ''
  return [course.value.certification, course.value.certifierName]
    .filter((v): v is string => typeof v === 'string' && v.length > 0)
    .join(' · ')
})

const durationLabel = computed(() => {
  if (!course.value) return ''
  const parts: string[] = []
  if (course.value.durationDays) parts.push(`${course.value.durationDays} jours`)
  if (course.value.durationHours) parts.push(`${course.value.durationHours} h`)
  if (parts.length === 0) return ''
  return parts.join(' — ')
})

const priceLabel = computed(() => {
  if (!course.value?.price) return ''
  return `À partir de ${formatPrice(course.value.price)}`
})

const essentiel = computed(() => {
  if (!course.value) return []
  const items: { label: string; value: string }[] = []
  if (course.value.durationDays || course.value.durationHours) {
    const parts: string[] = []
    if (course.value.durationDays) parts.push(`${course.value.durationDays} jours`)
    if (course.value.durationHours) parts.push(`${course.value.durationHours} h`)
    items.push({ label: 'Durée', value: parts.join(' — ') })
  }
  if (course.value.cpf) {
    items.push({ label: 'CPF', value: course.value.cpfCode ?? 'Éligible' })
  }
  if (course.value.certification) {
    items.push({ label: 'Certification', value: course.value.certification })
  }
  if (course.value.price) {
    items.push({ label: 'Tarif', value: formatPrice(course.value.price) })
  }
  return items
})

const objectives = computed<string[]>(() => {
  const list: string[] = []
  if (!course.value?.blocks || !Array.isArray(course.value.blocks)) return list

  for (const block of course.value.blocks) {
    if (
      block &&
      typeof block === 'object' &&
      'goals' in block &&
      Array.isArray((block as { goals?: unknown }).goals)
    ) {
      for (const goal of (block as { goals: { text?: string }[] }).goals) {
        if (goal?.text) list.push(goal.text)
      }
    }
  }

  return list
})

const programme = computed<ProgrammeModule[]>(() => {
  const list: ProgrammeModule[] = []
  if (!course.value?.blocks || !Array.isArray(course.value.blocks)) return list

  for (const block of course.value.blocks) {
    if (block && typeof block === 'object') {
      const typed = block as {
        name?: string
        description?: string
        durationInHours?: number
        durationInDays?: number
      }
      if (typed.name) {
        const durationParts: string[] = []
        if (typed.durationInHours) durationParts.push(`${typed.durationInHours} h`)
        else if (typed.durationInDays) durationParts.push(`${typed.durationInDays} jours`)

        list.push({
          title: typed.name,
          description: typed.description,
          duration: durationParts.join(' · ')
        })
      }
    }
  }

  return list
})

// Params encodés : famille/slug/id de session peuvent contenir des
// caractères spéciaux — ne jamais les interpoler bruts dans la query.
const demandeTo = `/centres/demande-de-formation?famille=${encodeURIComponent(famille)}&formation=${encodeURIComponent(slug)}`

// Titre de session par modalité (label déjà traduit via MODALITY_LABELS).
const SESSION_TITLES: Record<string, string> = {
  presentiel: 'Session en présentiel',
  distanciel: 'Session en distanciel',
  hybride: 'Session hybride',
  intra: 'Session intra',
  inter: 'Session inter'
}

const sessionsList = computed(() => {
  const raw = (course.value ? upcomingSessions(course.value) : [])
    .slice()
    .sort((a, b) => (a.startDate ?? '').localeCompare(b.startDate ?? ''))

  return raw.map((s, index) => {
    const date = s.startDate ? new Date(`${s.startDate}T00:00:00Z`) : null
    const day = date ? String(date.getUTCDate()).padStart(2, '0') : ''
    const month = date
      ? new Intl.DateTimeFormat('fr-FR', { month: 'short', timeZone: 'UTC' })
          .format(date)
          .replace('.', '')
      : ''
    const modality = s.modality ? (MODALITY_LABELS[s.modality] ?? s.modality) : ''
    const meta = [
      course.value?.durationDays ? `${course.value.durationDays} jours` : '',
      modality,
      s.location?.city ?? ''
    ]
      .filter(Boolean)
      .join(' · ')
    const places = s.seatsRemaining ?? undefined
    const type = sessionSeatType(places)

    return {
      key: s.id ?? `${s.startDate}-${index}`,
      day,
      month,
      title:
        (s.modality && SESSION_TITLES[s.modality]) ||
        (modality ? `Session ${modality.toLowerCase()}` : 'Session planifiée'),
      meta,
      places,
      type,
      to: s.id ? `${demandeTo}&session=${encodeURIComponent(s.id)}` : demandeTo
    }
  })
})

interface LieuAggregat {
  key: string
  name: string
  department: string
  modalities: Set<string>
  sessions: CourseSession[]
  to: string | null
}

// Une carte par centre : statut calculé sur les sessions à venir du centre
// (≥2 → compteur vert, 1 → date en warning, 0 → « Sur demande »).
const lieux = computed(() => {
  const grouped = new Map<string, LieuAggregat>()

  for (const session of course.value?.sessions ?? []) {
    const loc = session.location
    if (!loc) continue
    const key = loc.centreSlug ?? loc.name ?? loc.city ?? ''
    if (!key) continue

    let lieu = grouped.get(key)
    if (!lieu) {
      lieu = {
        key,
        name: loc.name ?? loc.city ?? 'Lieu de formation',
        department: loc.department ?? loc.region ?? '',
        modalities: new Set(),
        sessions: [],
        to: loc.centreSlug ? `/centres/${loc.centreSlug}` : null
      }
      grouped.set(key, lieu)
    }
    if (session.modality) lieu.modalities.add(session.modality)
    lieu.sessions.push(session)
  }

  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  const dateFmt = new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    timeZone: 'UTC'
  })

  return [...grouped.values()].map((lieu) => {
    const upcoming = lieu.sessions
      .filter((s) => s.startDate && new Date(`${s.startDate}T00:00:00Z`) >= today)
      .sort((a, b) => (a.startDate ?? '').localeCompare(b.startDate ?? ''))

    let status: { type: 'success' | 'warning' | 'neutral'; label: string }
    if (upcoming.length >= 2) {
      status = { type: 'success', label: `${upcoming.length} sessions à venir` }
    } else if (upcoming.length === 1) {
      const date = new Date(`${upcoming[0]!.startDate}T00:00:00Z`)
      status = { type: 'warning', label: `Prochaine session le ${dateFmt.format(date)}` }
    } else {
      status = { type: 'neutral', label: 'Sur demande' }
    }

    const modalities = lieu.modalities.size
      ? [...lieu.modalities]
      : (course.value?.modalities ?? [])

    return {
      key: lieu.key,
      name: lieu.name,
      department: lieu.department,
      modalities: modalities.map((m) => MODALITY_LABELS[m] ?? m).join(' · '),
      status,
      to: lieu.to
    }
  })
})

const modaliteLabels = computed(() =>
  (course.value?.modalities ?? []).map((m) => MODALITY_LABELS[m] ?? m)
)

const similarQuery = computed(() => ({
  family: course.value?.familySlug ?? undefined,
  limit: 3,
  page: 1,
  sort: 'updatedAt' as const,
  order: 'desc' as const
}))

const similarCatalog = await useCatalog(similarQuery)

const similaires = computed<FormationItem[]>(
  () =>
    similarCatalog.data.value?.items
      .map((course) => mapCourse(course, familyName.value))
      .filter((f) => f.slug !== slug) ?? []
)

function formatPrice(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0
  }).format(value)
}
</script>
