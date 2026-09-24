<template>
  <div class="flex-1 bg-paper">
    <template v-if="centre">
      <!-- Hero -->
      <section
        class="border-b border-rule bg-linear-to-b from-paper to-surface"
        aria-labelledby="hero-title"
      >
        <div class="mx-auto px-gutter-mobile md:px-gutter py-control-sm">
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
            </div>

            <!-- La figure précède les boutons dans le DOM : sur mobile elle
                 s'affiche avant les CTA ; sur desktop elle occupe la colonne
                 droite sur les deux lignes (row-span-2). -->
            <figure
              v-if="imageSrc"
              class="relative mx-auto aspect-3/4 w-full max-w-callout overflow-hidden rounded-md bg-surface-alt shadow-lg lg:col-span-2 lg:row-span-2"
            >
              <img
                :src="imageSrc"
                :alt="centre.contact_name ?? centre.name"
                class="h-full w-full object-cover"
              />
              <span class="absolute inset-0 bg-ink/15" aria-hidden="true" />
              <!-- Le visuel du hero est le portrait du responsable : nom +
                   badge vérifié + ancienneté en franchise incrustés en bas. -->
              <figcaption
                v-if="centre.contact_name"
                class="absolute inset-x-md bottom-md flex items-center justify-between gap-md rounded-md bg-paper px-md py-sm shadow-md"
              >
                <div class="min-w-0">
                  <p class="truncate text-body font-bold text-ink">{{ centre.contact_name }}</p>
                  <p v-if="managerCaption" class="mt-xs text-small text-ink-muted">
                    {{ managerCaption }}
                  </p>
                </div>
                <IconBadgeCheck :size="22" class="shrink-0 text-accent-text" />
              </figcaption>
            </figure>

            <div class="flex flex-wrap items-center gap-md lg:col-span-3">
              <Button as-child variant="accent" size="pill" class="w-full sm:w-auto">
                <NuxtLink to="#formations">Trouver une formation dans ce centre</NuxtLink>
              </Button>
              <Button as-child variant="outline" size="pill" class="w-full sm:w-auto">
                <NuxtLink to="/parler-a-votre-conseiller">Parler à votre conseiller</NuxtLink>
              </Button>
              <NuxtLink
                v-if="centre.phone"
                :to="`tel:${centre.phone.replace(/\s/g, '')}`"
                class="inline-flex items-center gap-2 font-medium text-ink"
              >
                <IconPhone :size="16" class="text-primary" />
                {{ centre.phone }}
              </NuxtLink>
            </div>
          </div>
        </div>
      </section>

      <!-- Contenu principal -->
      <div class="mx-auto px-gutter-mobile md:px-gutter py-section">
        <!-- Grille 2 colonnes : contenu principal à gauche, barre
             latérale empilée (infos → carte → qualité) à droite. Sur
             mobile, `contents` aplatit les sections des deux colonnes
             dans l'ordre maquette via les classes order-*. -->
        <div
          class="grid grid-cols-1 items-start gap-2xl lg:grid-cols-[minmax(0,1fr)_var(--spacing-callout)]"
        >
          <!-- Barre latérale : `contents` sur mobile pour que ses
               sections s'ordonnent dans la grille parente (infos →
               carte → contenu → qualité) ; redevient une vraie
               colonne flex sur desktop pour que la qualité reste
               collée sous la carte (maquette). -->
          <aside
            class="contents w-full lg:col-start-2 lg:row-start-1 lg:flex lg:flex-col lg:gap-lg"
            aria-label="Informations complémentaires"
          >
            <!-- Informations pratiques -->
            <section aria-labelledby="infos-title" class="order-1 lg:order-0">
              <Card v-reveal variant="surface" class="h-fit">
                <CardHeader class="p-lg pb-0">
                  <h2 id="infos-title" class="font-sans text-h4 font-bold text-ink">
                    Informations pratiques
                  </h2>
                </CardHeader>
                <CardContent class="p-lg pt-md">
                  <ul class="space-y-md text-small">
                    <li class="flex gap-sm">
                      <IconMapPin :size="17" class="mt-xs shrink-0 text-primary" />
                      <span class="text-ink-body">
                        {{ streetAddress }}<br />{{ centre.postal_code }} {{ centre.city
                        }}<template v-if="centre.department"> · {{ centre.department }}</template
                        ><template v-if="centre.region"> · {{ centre.region }}</template>
                      </span>
                    </li>
                    <li v-if="centre.phone" class="flex gap-sm">
                      <IconPhone :size="17" class="mt-xs shrink-0 text-primary" />
                      <NuxtLink
                        :to="`tel:${centre.phone.replace(/\s/g, '')}`"
                        class="font-semibold text-ink transition-colors hover:text-accent-text"
                      >
                        {{ centre.phone }}
                      </NuxtLink>
                    </li>
                    <li v-if="centre.mobile" class="flex gap-sm">
                      <IconSmartphone :size="17" class="mt-xs shrink-0 text-primary" />
                      <NuxtLink
                        :to="`tel:${centre.mobile.replace(/\s/g, '')}`"
                        class="font-semibold text-ink transition-colors hover:text-accent-text"
                      >
                        {{ centre.mobile }}
                      </NuxtLink>
                    </li>
                    <li v-if="contactEmail" class="flex gap-sm">
                      <IconMail :size="17" class="mt-xs shrink-0 text-primary" />
                      <NuxtLink
                        :to="`mailto:${contactEmail}`"
                        class="text-ink transition-colors hover:text-accent-text"
                      >
                        {{ contactEmail }}
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

            <!-- Carte d'accès : mode « single » du CenterMap — pin unique
                 centré, carte bordée et pied adresse/itinéraire intégrés. -->
            <section
              v-if="centre.latitude != null && centre.longitude != null"
              aria-labelledby="carte-title"
              class="order-2 lg:order-0"
            >
              <h2 id="carte-title" class="sr-only">Carte d'accès</h2>
              <CenterMap
                mode="single"
                :centers="singleMapCenters"
                :active-id="activeMapCenterId"
                :caption="mapCaption"
                :popup="false"
                :user-position="userPosition"
                :focus-center="mapFocus"
                :focus-zoom="13"
                @select="onMapSelect"
              />
            </section>

            <!-- Qualité : 3e carte de la barre latérale — collée
                 sous la carte sur desktop ; `order-5` la place après
                 les prochaines sessions sur mobile (maquette). -->
            <section
              v-if="centre.qualiopi_certified"
              class="order-5 lg:order-0"
              aria-labelledby="qualite-title"
            >
              <Card v-reveal variant="paper" class="h-fit">
                <CardHeader class="p-lg pb-0">
                  <h2 id="qualite-title" class="font-sans text-h4 font-bold text-ink">
                    Qualité et certifications
                  </h2>
                </CardHeader>
                <CardContent class="p-lg pt-md">
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
                        Actions de formation<template v-if="centre.qualiopi_certifier">
                          · certificateur {{ centre.qualiopi_certifier }}</template
                        ><template v-else-if="centre.qualiopi_certificate_number">
                          · réf. {{ centre.qualiopi_certificate_number }}</template
                        >
                      </p>
                      <p v-if="qualiopiValidUntilLabel" class="text-ink-body">
                        Certification · valide jusqu'au {{ qualiopiValidUntilLabel }}.
                      </p>
                    </div>
                  </div>
                  <Button
                    v-if="centre.qualiopi_certificate"
                    as-child
                    variant="outline"
                    size="pill-sm"
                    class="mt-md w-full"
                  >
                    <a :href="qualiopiCertificateUrl" target="_blank" rel="noopener">
                      <IconDownload :size="14" class="mr-xs" aria-hidden="true" />
                      Télécharger le certificat Qualiopi
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </section>
          </aside>

          <!-- Colonne principale : `contents` sur mobile pour ordonner
               ses sections avec celles de la barre latérale (formations
               et sessions avant « Le centre », maquette mobile) ;
               redevient une colonne flex sur desktop. `md:px-16` est
               reporté sur chaque section puisque contents ne génère
               pas de boîte. -->
          <div
            class="order-2 contents min-w-0 flex-col gap-2xl lg:order-0 lg:col-start-1 lg:row-start-1 lg:flex"
          >
            <!-- Le centre -->
            <section
              v-if="centre.description"
              aria-labelledby="le-centre-title"
              class="order-6 md:px-16 lg:order-0 lg:px-0"
            >
              <h2 id="le-centre-title" class="font-display text-h2 font-extrabold text-ink">
                Le centre
              </h2>
              <div
                class="mt-sm max-w-prose text-body leading-relaxed text-ink-body"
                v-html="sanitizeHtml(centre.description)"
              />
            </section>

            <!-- Formations disponibles -->
            <section
              id="formations"
              aria-labelledby="formations-title"
              class="order-3 md:px-16 lg:order-0 lg:px-0"
            >
              <div class="flex flex-wrap items-baseline justify-between gap-sm">
                <h2 id="formations-title" class="font-display text-h2 font-extrabold text-ink">
                  Les formations disponibles dans ce centre
                </h2>
                <span v-if="centreCatalog.data.value" class="text-small text-ink-muted">
                  {{ centreCatalog.data.value.total }} formation{{
                    centreCatalog.data.value.total > 1 ? 's' : ''
                  }}<template v-if="formationsFamiliesCount">
                    · {{ formationsFamiliesCount }} famille{{
                      formationsFamiliesCount > 1 ? 's' : ''
                    }}</template
                  >
                </span>
              </div>
              <div v-if="formations.length" class="mt-md grid gap-grid sm:grid-cols-2">
                <CenterFormationCard
                  v-for="(formation, i) in formations"
                  :key="formation.slug"
                  v-reveal="revealStagger(i)"
                  :sub-family="formation.subFamily"
                  :title="formation.title"
                  :description="formation.description"
                  :meta="formation.meta"
                  :status="formation.status"
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
                size="inline"
                class="mt-md font-bold"
              >
                <NuxtLink :to="`/formations?lieu=${centre.city ?? ''}`"
                  >Voir les {{ centreCatalog.data.value?.total }} formations du centre
                  <span class="link-arrow">→</span></NuxtLink
                >
              </Button>
            </section>

            <!-- Prochaines sessions dans ce centre -->
            <section
              v-if="sessions.length"
              aria-labelledby="sessions-title"
              class="order-4 md:px-16 lg:order-0 lg:px-0"
            >
              <h2 id="sessions-title" class="font-display text-h2 font-extrabold text-ink">
                Prochaines sessions
              </h2>
              <p class="mt-sm text-small text-ink-muted">Disponibilités actualisées en continu.</p>
              <ul id="centre-sessions-list" class="mt-md space-y-md">
                <li
                  v-for="(session, i) in visibleSessions"
                  :key="session.key"
                  v-reveal="revealStagger(i)"
                >
                  <SessionCard
                    :day="session.day"
                    :month="session.month"
                    :title="session.title"
                    :meta="session.meta"
                    :places="session.places"
                    :type="session.type"
                    :to="session.to"
                    :cta-label="session.ctaLabel"
                  />
                </li>
              </ul>
              <div v-if="sessions.length > INITIAL_SESSIONS_COUNT" class="mt-md">
                <Button
                  type="button"
                  variant="link"
                  size="inline"
                  class="font-bold"
                  :aria-expanded="isAllSessionsVisible"
                  aria-controls="centre-sessions-list"
                  @click="toggleSessions"
                >
                  <template v-if="!isAllSessionsVisible">
                    Voir plus <span class="link-arrow">→</span>
                  </template>
                  <template v-else> Voir moins <span class="link-arrow">↑</span> </template>
                </Button>
              </div>
            </section>

            <!-- Avis — collection Directus `avis`, section masquée si vide -->
            <section
              v-if="centreAvis.length"
              aria-labelledby="avis-title"
              class="order-7 md:px-16 lg:order-0 lg:px-0"
            >
              <h2 id="avis-title" class="font-display text-h2 font-extrabold text-ink">Avis</h2>
              <p class="mt-xs flex flex-wrap items-baseline gap-x-sm">
                <span class="font-display text-h3 font-extrabold text-ink"
                  >4,7<span class="font-sans text-body font-medium text-ink-muted">/5</span></span
                >
                <span class="text-small font-semibold text-accent" aria-hidden="true">★★★★★</span>
                <span class="text-small text-ink-muted"
                  >214 avis Google — marque LEARN UP ACADEMY</span
                >
              </p>
              <p class="mt-sm text-small text-ink-muted">
                Ces avis portent sur la marque LEARN UP ACADEMY, toutes implantations confondues.
              </p>
              <div class="mt-md grid gap-grid sm:grid-cols-2">
                <TestimonialCard
                  v-for="(avis, i) in centreAvis"
                  :key="avis.slug"
                  v-reveal="revealStagger(i)"
                  :stars="avis.stars"
                  :quote="avis.quote"
                  :author="avis.author"
                />
              </div>
            </section>

            <!-- Actualités liées au centre (relation M2O `articles.centre`) -->
            <section
              v-if="centreArticles.length"
              aria-labelledby="actus-title"
              class="order-8 md:px-16 lg:order-0 lg:px-0"
            >
              <div class="flex flex-wrap items-baseline justify-between gap-sm">
                <h2 id="actus-title" class="font-display text-h2 font-extrabold text-ink">
                  Actualités de votre centre
                </h2>
                <Button as-child variant="link" size="inline" class="hidden font-bold sm:inline">
                  <NuxtLink to="/actualites"
                    >Toutes les actualités <span class="link-arrow">→</span></NuxtLink
                  >
                </Button>
              </div>
              <div class="mt-md grid gap-grid sm:grid-cols-2">
                <ArticleCard
                  v-for="(article, i) in centreArticles"
                  :key="article.slug"
                  v-reveal="revealStagger(i)"
                  :category="article.category ?? 'Actualité'"
                  :title="article.title"
                  :date="formatArticleDate(article.publish_at)"
                  :excerpt="article.excerpt ?? ''"
                  :image-url="directusAssetUrl(article.cover_image) ?? undefined"
                  :to="`/actualites/${article.slug}`"
                  class="h-full"
                />
              </div>
              <Button as-child variant="link" size="inline" class="mt-md font-bold sm:hidden">
                <NuxtLink to="/actualites"
                  >Toutes les actualités <span class="link-arrow">→</span></NuxtLink
                >
              </Button>
            </section>
          </div>
        </div>

        <!-- Autres centres de la région — avant le bandeau CTA (maquette) -->
        <section v-if="nearbyCenters.length" class="mt-2xl" aria-labelledby="autres-title">
          <div class="flex flex-wrap items-baseline justify-between gap-sm">
            <h2 id="autres-title" class="font-display text-h2 font-extrabold text-ink">
              Autres centres<template v-if="centre.region"> en {{ centre.region }}</template>
            </h2>
            <Button as-child variant="link" size="inline" class="hidden font-bold sm:inline">
              <NuxtLink to="/centres"
                >Voir le réseau de centres <span class="link-arrow">→</span></NuxtLink
              >
            </Button>
          </div>
          <div class="mt-md grid gap-grid sm:grid-cols-3">
            <CenterCard
              v-for="(nearby, i) in nearbyCenters"
              :key="nearby.slug"
              v-reveal="revealStagger(i)"
              :name="nearby.name"
              :distance="nearby.distance"
              :formations="nearby.specialties"
              :tags="[]"
              :to="`/centres/${nearby.slug}`"
              :title-to="`/centres/${nearby.slug}`"
              class="h-full transition hover:shadow-md"
            />
          </div>
          <Button as-child variant="link" size="inline" class="mt-md font-bold sm:hidden">
            <NuxtLink to="/centres"
              >Voir le réseau de centres <span class="link-arrow">→</span></NuxtLink
            >
          </Button>
        </section>

        <!-- Bandeau CTA — dernière section avant le footer -->
        <CtaBanner
          v-reveal
          class="mt-2xl"
          title="Besoin de formation ?"
          text="La demande transmet automatiquement le centre, la ville et la formation concernée — sans ressaisie."
        >
          <Button as-child variant="paper" size="pill-lg" class="w-full sm:w-auto">
            <NuxtLink :to="`/centres/demande-de-formation?centre=${slug}`"
              >Demander une formation</NuxtLink
            >
          </Button>
          <Button as-child variant="outline-inverse" size="pill-lg" class="w-full sm:w-auto">
            <NuxtLink to="/parler-a-votre-conseiller">Parler à votre conseiller</NuxtLink>
          </Button>
        </CtaBanner>
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
import type {
  Article,
  Avis,
  Centre,
  CourseListItem,
  CourseSession,
  FamilleFormation
} from '@learnup/types'
import {
  mapCourse,
  upcomingSessions,
  useCatalog,
  type FormationItem
} from '~/composables/useCatalog'
import { availabilityStatus } from '~/composables/useCentres'
import { useGeolocation } from '~/composables/useGeolocation'
import { sanitizeHtml } from '~/utils/sanitizeHtml'
import { directusAssetUrl } from '~/utils/directusAsset'
import { departmentCodeFromPostalCode, distanceKm, formatDistance } from '~/utils/geo'
import { formatArticleDate } from '~/utils/article'
import { formatMonthYearFr } from '~/utils/date'
import { MODALITY_LABELS } from '~/utils/catalog-filters'
import { sessionSeatType } from '~/utils/placesLabel'
import { revealStagger } from '~/utils/reveal'
import type { CenterResult } from '~/types/center-result'

definePageMeta({
  layout: 'with-breadcrumb'
})

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
  [streetAddress.value, centre.value?.postal_code, centre.value?.city, centre.value?.region]
    .filter(Boolean)
    .join(', ')
)

// Adresse de contact du centre : règle réseau « contact{dept}@learnup-academy.com »
// dérivée du code postal (94 → contact94@…). Repli sur le champ `email`
// Directus quand le code postal est absent ou invalide.
const contactEmail = computed(() => {
  const code = departmentCodeFromPostalCode(centre.value?.postal_code)
  return code ? `contact${code}@learnup-academy.com` : (centre.value?.email ?? null)
})

const { position: userPosition } = useGeolocation()

// Mode « single » : un seul pin — le centre affiché. L'`activeId`
// surligne le marqueur (même convention `id` = slug que l'explorateur).
const activeMapCenterId = ref<string | null>(slug)

const singleMapCenters = computed<CenterResult[]>(() => {
  const c = centre.value
  if (!c) return []
  return [
    {
      id: c.slug,
      name: c.name,
      cp: c.postal_code ?? '',
      address: mapAddress.value,
      tags: '',
      tagsShort: '',
      lat: c.latitude ?? undefined,
      lng: c.longitude ?? undefined
    }
  ]
})

const mapCaption = computed(() => centre.value?.region ?? 'Réseau national')

// Vue centrée sur le centre (contrairement à l'explorateur qui cadre le
// département) : la mini-carte de la fiche doit pointer l'adresse.
const mapFocus = computed(() =>
  centre.value?.latitude != null && centre.value?.longitude != null
    ? { lat: centre.value.latitude, lng: centre.value.longitude }
    : null
)

// Localité « cp ville » et rue seule : le champ `address` peut déjà
// contenir la localité (anciennes données) — on la retire pour recomposer
// proprement les affichages sans doublon.
const addressLocality = computed(() =>
  [centre.value?.postal_code, centre.value?.city].filter(Boolean).join(' ')
)

const streetAddress = computed(() => {
  const address = centre.value?.address ?? ''
  const locality = addressLocality.value
  if (locality && address.endsWith(locality)) {
    return address.slice(0, -locality.length).replace(/,\s*$/, '')
  }
  return address
})

// Adresse courte du pied de carte : rue + « code postal ville » (sans
// département/région — contrairement à `heroAddress`).
const mapAddress = computed(() =>
  [streetAddress.value, addressLocality.value].filter(Boolean).join(', ')
)

function onMapSelect(id: string) {
  // Mini-carte sans popup : le pin d'un autre centre mène à sa fiche.
  if (id && id !== slug) {
    navigateTo(`/centres/${id}`)
    return
  }
  activeMapCenterId.value = id || null
}

const specialties = computed(() => centre.value?.specialties ?? [])

const qualiopiCertificateUrl = computed(
  () => directusAssetUrl(centre.value?.qualiopi_certificate) ?? ''
)

// « valide jusqu'au 14 mars 2027 » — date de fin de validité Qualiopi
// éditée dans Directus, formatée en français.
const qualiopiValidUntilLabel = computed(() => {
  const raw = centre.value?.qualiopi_valid_until
  if (!raw) return null
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    // Fuseau épinglé comme formatDateFr : sans ça un timestamp proche de
    // minuit peut rendre un jour différent entre SSR (UTC) et client.
    timeZone: 'Europe/Paris'
  }).format(date)
})

const imageSrc = computed(() => directusAssetUrl(centre.value?.image))

// « Franchisé depuis 19 mai 2017 » sous le nom du responsable — repli
// sur le rôle du contact quand la date de franchise n'est pas renseignée.
const managerCaption = computed(() => {
  const raw = centre.value?.franchise_since
  const date = raw ? new Date(raw) : null
  if (date && !Number.isNaN(date.getTime())) {
    return `Franchisé depuis ${new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Europe/Paris'
    }).format(date)}`
  }
  return centre.value?.contact_role ?? null
})

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

const familyNames = await useDirectusList<FamilleFormation>(
  'familles_formation',
  `centre-${slug}-familles`,
  {
    fields: ['slug', 'name'],
    filter: { status: { _eq: 'published' } }
  }
)
// computed : familyNames peut se résoudre après le premier rendu — un Map
// figé garderait des libellés de famille manquants.
const familyLabel = computed(() => new Map((familyNames.value ?? []).map((f) => [f.slug, f.name])))

// Statut de disponibilité d'une formation dans CE centre (sémantique
// partagée `availabilityStatus` — voir useCentres).
function centreFormationStatus(course: CourseListItem): FormationItem['status'] {
  const dates = upcomingSessions(course)
    .filter((s) => s.location?.centreSlug === slug)
    .map((s) => s.startDate)
    .filter((d): d is string => Boolean(d))
  return availabilityStatus(dates)
}

// Méta « durée · modalités · ville » conforme à la maquette de la carte
// formation en fiche centre.
function centreFormationMeta(course: CourseListItem): string {
  const parts: string[] = []
  if (course.durationDays) parts.push(`${course.durationDays} jours`)
  const modalities = (course.modalities ?? []).map((m) => MODALITY_LABELS[m] ?? m).join(' / ')
  if (modalities) parts.push(modalities)
  if (centre.value?.city) parts.push(centre.value.city)
  return parts.join(' · ')
}

const formations = computed<FormationItem[]>(
  () =>
    centreCatalog.data.value?.items.slice(0, 4).map((course) => ({
      ...mapCourse(
        course,
        course.familySlug ? familyLabel.value.get(course.familySlug) : undefined
      ),
      meta: centreFormationMeta(course),
      status: centreFormationStatus(course)
    })) ?? []
)

// « N formations · X familles » — les facettes famille du catalogue sont
// déjà calculées sur le résultat filtré par centre.
const formationsFamiliesCount = computed(
  () => Object.keys(centreCatalog.data.value?.facets?.families ?? {}).length
)

interface CentreSession {
  key: string
  day: string
  month: string
  title: string
  meta: string
  places?: number
  type?: 'success' | 'warning' | 'neutral'
  ctaLabel: string
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
    ctaLabel: places === 0 ? "Être informé d'une place" : "S'inscrire",
    to: course.familySlug ? `/formations/${course.familySlug}/${course.slug}` : '/formations'
  }
}

const INITIAL_SESSIONS_COUNT = 2
const SESSIONS_STEP = 4

const visibleSessionsCount = ref(INITIAL_SESSIONS_COUNT)

const sessions = computed<CentreSession[]>(() =>
  (centreCatalog.data.value?.items ?? [])
    .flatMap((course) =>
      upcomingSessions(course).map((session) => toCentreSession(course, session))
    )
    .filter((s): s is CentreSession & { startDate: string } => s !== null)
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
)

const isAllSessionsVisible = computed(() => visibleSessionsCount.value >= sessions.value.length)

const visibleSessions = computed(() => sessions.value.slice(0, visibleSessionsCount.value))

function toggleSessions() {
  if (isAllSessionsVisible.value) {
    visibleSessionsCount.value = INITIAL_SESSIONS_COUNT
  } else {
    visibleSessionsCount.value += SESSIONS_STEP
  }
}

// Autres centres de la même région, chargés depuis Directus.
const allCentres = await useDirectusList<Centre>('centres', 'centres-siblings', {
  fields: [
    'slug',
    'name',
    'city',
    'region',
    'specialties',
    'address',
    'postal_code',
    'department',
    'latitude',
    'longitude'
  ],
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
      distance: nearbyDistance(c),
      specialties: (c.specialties ?? []).join(' · ')
    }))
)

// « à 9,0 km » à vol d'oiseau depuis la position de l'utilisateur — même
// règle que les cartes de /centres et de l'accueil ; repli sur la ville
// quand la géolocalisation ou les coordonnées manquent.
function nearbyDistance(c: Centre): string {
  const pos = userPosition.value
  if (!pos || c.latitude == null || c.longitude == null) return c.city ?? ''
  return `à ${formatDistance(distanceKm(pos, { lat: c.latitude, lng: c.longitude }))}`
}

// Avis — collection Directus `avis` : items rattachés au centre (M2O) ou
// avis marque (`centre` vide, affichés sur toutes les fiches). La section
// se masque quand aucun avis publié n'est retourné.
const centreAvisData = await useDirectusList<Avis>('avis', `centre-${slug}-avis`, () =>
  centre.value
    ? {
        fields: ['slug', 'author', 'quote', 'stars', 'published_at', 'centre'],
        filter: {
          status: { _eq: 'published' },
          _or: [{ centre: { _eq: centre.value.id } }, { centre: { _null: true } }]
        },
        sort: ['sort', '-published_at'],
        limit: 4
      }
    : null
)

const centreAvis = computed(() =>
  (centreAvisData.value ?? []).map((avis) => {
    const stars = Math.min(5, Math.max(0, avis.stars ?? 0))
    const date = formatMonthYearFr(avis.published_at)
    return {
      slug: avis.slug,
      stars: '★'.repeat(stars) + '☆'.repeat(5 - stars),
      quote: avis.quote,
      author: date ? `${avis.author} · ${date}` : avis.author
    }
  })
)

// Actualités rattachées au centre via la relation M2O `articles.centre` —
// la section se masque si aucune n'est publiée.
const centreArticlesData = await useDirectusList<Article>(
  'articles',
  `centre-${slug}-articles`,
  () =>
    centre.value
      ? {
          fields: ['slug', 'title', 'excerpt', 'category', 'publish_at', 'cover_image'],
          filter: { centre: { _eq: centre.value.id }, status: { _eq: 'published' } },
          sort: ['-publish_at'],
          limit: 3
        }
      : null
)
const centreArticles = computed(() => centreArticlesData.value ?? [])

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
