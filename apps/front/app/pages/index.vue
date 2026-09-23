<template>
  <div class="bg-paper">
    <!-- Hero -->
    <section class="relative overflow-hidden bg-linear-to-b from-paper to-surface">
      <div
        class="pointer-events-none absolute -bottom-44 -left-32 h-96 w-96 rounded-full bg-primary/5"
      />
      <div
        class="pointer-events-none absolute -right-36 -top-32 h-96 w-96 rounded-full bg-accent/5"
      />

      <!-- Floating badge on desktop (placed at section level, top right of the screen) -->
      <div
        class="pointer-events-none absolute right-6 top-8 hidden lg:block xl:right-12 xl:top-10 -rotate-3 z-10"
      >
        <div class="rounded-2xl border border-rule/50 bg-paper px-6 py-4 shadow-md text-left">
          <p class="font-display text-lead font-bold italic leading-snug text-ink">
            Des compétences aujourd'hui<br />
            pour les défis de demain
          </p>
          <div class="mt-2 h-1 w-14 rounded-full bg-accent" />
        </div>
      </div>

      <div
        class="relative mx-auto max-w-container px-gutter-mobile md:px-gutter pb-section pt-3xl md:pt-4xl text-center"
      >
        <div class="mx-auto max-w-prose md:max-w-180">
          <!-- Pill category badge -->
          <span
            class="inline-block rounded-full border border-primary/25 bg-paper px-4 py-1.5 text-xs md:text-small font-bold uppercase tracking-wider text-primary shadow-xs"
          >
            Plateforme de conseil et d'orientation en formation professionnelle
          </span>

          <!-- Main H1 title -->
          <h1
            class="mt-4 md:mt-5 font-display text-h2 md:text-h1 font-extrabold leading-tight text-ink"
          >
            Vos besoins de formation,<br />
            <span class="text-accent-text">orchestrés</span> de bout en bout.
          </h1>

          <!-- Subtitle -->
          <p class="mt-3 md:mt-4 font-sans text-body md:text-lead font-bold text-ink">
            La bonne formation. Au bon endroit. Au bon moment. Partout en France.
          </p>

          <!-- Prompt section -->
          <div class="mt-6 md:mt-8">
            <h2 class="font-display text-h4 md:text-h3 font-extrabold text-ink">
              Besoin d'aide pour choisir votre formation&nbsp;?
            </h2>
            <p class="mx-auto mt-2 text-small md:text-sm text-ink-muted max-w-132.5">
              Décrivez votre besoin ou posez votre question. Nous vous guidons vers la solution
              adaptée.
            </p>
          </div>

          <!-- Search bar -->
          <form class="mx-auto mt-6 w-full max-w-prose md:max-w-170" @submit.prevent="onHeroSearch">
            <div
              class="flex h-14 md:h-16 items-center gap-3 rounded-full border-2 border-primary/75 bg-paper pl-4 md:pl-6 pr-2 shadow-sm transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20"
            >
              <IconSparkle :size="22" class="shrink-0 text-accent" />
              <label for="hero-search-input" class="sr-only"
                >Décrivez votre besoin de formation</label
              >
              <input
                id="hero-search-input"
                v-model="heroSearch"
                type="text"
                class="h-auto flex-1 border-0 bg-transparent px-0 text-small md:text-body text-ink placeholder:text-ink-subtle focus:outline-none"
                placeholder="Ex. : Je dois former 8 salariés au CACES près de Lyon avant septembre."
              />
              <button
                type="submit"
                aria-label="Lancer la recherche"
                class="flex h-10 w-10 md:h-12 md:w-12 shrink-0 items-center justify-center rounded-full bg-primary text-paper transition-colors hover:bg-primary-dark"
              >
                <IconSearch :size="18" class="text-paper" />
              </button>
            </div>
            <p
              class="mt-3 text-xs md:text-small text-ink-muted whitespace-normal md:whitespace-nowrap"
            >
              Vous pouvez écrire comme vous le feriez à un conseiller.
            </p>
          </form>

          <!-- 3 Value propositions -->
          <div
            class="mx-auto mt-6 flex w-fit flex-col items-start gap-3 text-small font-bold text-ink md:w-auto md:flex-row md:items-center md:justify-center md:gap-5"
          >
            <div class="inline-flex items-center gap-2">
              <IconMessageCircle :size="18" class="shrink-0 text-accent" />
              <span>Obtenez des conseils personnalisés</span>
            </div>
            <span class="hidden text-rule md:inline" aria-hidden="true">|</span>
            <div class="inline-flex items-center gap-2">
              <IconMapPin :size="18" class="shrink-0 text-accent" />
              <span>Trouvez la formation près de chez vous</span>
            </div>
            <span class="hidden text-rule md:inline" aria-hidden="true">|</span>
            <div class="inline-flex items-center gap-2">
              <IconCalendar :size="18" class="shrink-0 text-accent" />
              <span>Consultez les prochaines sessions</span>
            </div>
          </div>

          <!-- CTA Link -->
          <div class="mt-5">
            <NuxtLink
              to="/parler-a-un-conseiller"
              class="inline-block text-small md:text-body font-bold text-accent-text underline underline-offset-4 transition-colors hover:text-primary"
            >
              Besoin d'être accompagné&nbsp;? Parler à un conseiller
              <span class="link-arrow">→</span>
            </NuxtLink>
            <p class="mx-auto mt-1 max-w-callout text-xs text-ink-subtle md:hidden">
              Ouvre le formulaire « Demande conseiller » — identité, contact, SIRET, nature du
              besoin.
            </p>
          </div>
        </div>

        <!-- Floating badge on mobile (Image 2) -->
        <div class="my-6 flex justify-center lg:hidden">
          <div class="rounded-xl border border-rule/60 bg-paper px-5 py-3 shadow-md text-left">
            <p class="font-display text-sm font-extrabold italic leading-snug text-ink">
              Des compétences aujourd'hui<br />
              pour les défis de demain
            </p>
            <div class="mt-1.5 h-1 w-12 rounded-full bg-accent" />
          </div>
        </div>

        <!-- 4 Cards at bottom -->
        <div class="mt-8 md:mt-12">
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 md:gap-md">
            <!-- Card 1: Entreprises de toutes tailles -->
            <div
              class="flex items-center gap-3.5 rounded-xl border border-rule/60 bg-paper p-4 text-left shadow-xs transition-shadow hover:shadow-sm"
            >
              <div
                class="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-surface-alt text-primary"
              >
                <IconUsers :size="24" />
              </div>
              <div>
                <p class="text-small font-bold text-ink">Entreprises de toutes tailles</p>
                <p class="mt-0.5 text-xs text-ink-muted">TPE, PME, ETI, grands comptes</p>
              </div>
            </div>

            <!-- Card 2: Partout en France -->
            <div
              class="flex items-center gap-3.5 rounded-xl border border-rule/60 bg-paper p-4 text-left shadow-xs transition-shadow hover:shadow-sm"
            >
              <div
                class="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-surface-alt text-primary"
              >
                <IconMapPin :size="24" />
              </div>
              <div>
                <p class="text-small font-bold text-ink">Partout en France</p>
                <p class="mt-0.5 text-xs text-ink-muted">
                  Un réseau de centres proches de vos équipes
                </p>
              </div>
            </div>

            <!-- Card 3: Formations réglementaires -->
            <div
              class="flex items-center gap-3.5 rounded-xl border border-rule/60 bg-paper p-4 text-left shadow-xs transition-shadow hover:shadow-sm"
            >
              <div
                class="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-surface-alt text-primary"
              >
                <IconFileText :size="24" />
              </div>
              <div>
                <p class="text-small font-bold text-ink">Formations réglementaires</p>
                <p class="mt-0.5 text-xs text-ink-muted">Des solutions adaptées à vos métiers</p>
              </div>
            </div>

            <!-- Card 4: Certifié Qualiopi -->
            <div
              class="flex items-center gap-3.5 rounded-xl border border-warning/40 bg-paper p-4 text-left shadow-xs transition-shadow hover:shadow-sm"
            >
              <div
                class="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-warning-soft text-warning"
              >
                <IconRibbon :size="24" />
              </div>
              <div>
                <p class="text-small font-bold text-ink">Certifié Qualiopi</p>
                <a
                  href="/certificat-qualiopi.pdf"
                  target="_blank"
                  rel="noopener"
                  class="mt-0.5 inline-flex items-center gap-1 text-xs font-semibold text-ink underline underline-offset-2 transition-colors hover:text-accent-text"
                >
                  Télécharger le certificat (PDF)
                  <IconDownload :size="13" class="shrink-0" />
                </a>
              </div>
            </div>
          </div>

          <!-- Annotation mobile Qualiopi -->
          <p class="mx-auto mt-2 text-left text-xs text-ink-subtle md:hidden">
            Certificat Qualiopi téléchargeable (PDF) — périmètre et numéro à confirmer avant mise en
            ligne.
          </p>
        </div>
      </div>
    </section>

    <!-- Stats ticker -->
    <div class="overflow-hidden bg-primary-dark py-3">
      <div class="marquee flex whitespace-nowrap">
        <div class="flex items-center gap-14 px-lg text-small text-ink-inverse">
          <span v-for="item in tickerItems" :key="item.key" class="inline-flex items-center">
            <span v-if="item.key === 'live'" class="h-2.5 w-2.5 rounded-full bg-ink-inverse/60" />
            <strong v-if="item.key !== 'live'" class="text-button text-ink-inverse">{{
              item.value
            }}</strong>
            <span class="text-ink-inverse/60">&nbsp;{{ item.label }}</span>
          </span>
        </div>
        <div class="flex items-center gap-14 px-lg text-small text-ink-inverse" aria-hidden="true">
          <span
            v-for="item in tickerItems"
            :key="`${item.key}-dup`"
            class="inline-flex items-center"
          >
            <span v-if="item.key === 'live'" class="h-2.5 w-2.5 rounded-full bg-ink-inverse/60" />
            <strong v-if="item.key !== 'live'" class="text-button text-ink-inverse">{{
              item.value
            }}</strong>
            <span class="text-ink-inverse/60">&nbsp;{{ item.label }}</span>
          </span>
        </div>
      </div>
    </div>

    <!-- Network -->
    <section class="mx-auto px-gutter-mobile md:px-gutter py-section">
      <h2 class="text-center font-display text-h3 md:text-h2 font-extrabold text-ink">
        Construisons ensemble le réseau Learn Up Academy
      </h2>
      <p
        class="mx-auto mt-sm max-w-prose text-center font-sans text-sm md:text-lead text-ink-muted"
      >
        Rejoignez un réseau national dédié aux formations réglementaires et participez à son
        développement partout en France.
      </p>

      <div class="mt-2xl grid gap-grid text-left md:grid-cols-3">
        <NetworkCard
          v-for="(card, i) in networkCards"
          :key="card.title"
          v-reveal="revealStagger(i)"
          :title="card.title"
          :subtitle="card.subtitle"
          :body="card.body"
          :cta="card.cta"
          :to="card.to"
        />
      </div>

      <p class="mt-xl text-center text-meta md:text-small text-ink-muted leading-5">
        Vous êtes un particulier ? Certaines sessions sont ouvertes aux inscriptions individuelles —
        <NuxtLink
          to="/centres"
          class="font-bold text-primary transition-colors hover:text-accent-text"
          >contactez le centre le plus proche <span class="link-arrow">→</span></NuxtLink
        >
      </p>
    </section>

    <!-- How it works -->
    <section class="mx-auto px-gutter-mobile md:px-gutter pb-section">
      <p
        class="text-center text-badge font-bold uppercase leading-3 tracking-widest text-accent-text my-4"
      >
        Comment ça marche
      </p>

      <ProcessSteps :steps="steps" last-step-variant="success" title-size="body" class="mt-2xl" />
    </section>

    <!-- Formations -->
    <section id="formations" class="bg-surface py-section">
      <div class="mx-auto px-gutter-mobile md:px-gutter">
        <div class="flex items-end justify-between">
          <div>
            <h2 class="font-display text-h2 font-extrabold text-ink">Nos formations</h2>
            <p class="mt-sm font-sans text-body text-ink-muted">
              Nous vous accompagnons grâce à un catalogue varié.
            </p>
          </div>
          <NuxtLink
            to="/formations"
            class="hidden whitespace-nowrap text-body font-bold text-primary transition-colors hover:text-accent-text md:block"
          >
            Voir tout le catalogue <span class="link-arrow">→</span>
          </NuxtLink>
        </div>

        <div class="mt-2xl grid gap-grid sm:grid-cols-2 lg:grid-cols-4">
          <FormationCard
            v-for="(item, i) in dernieresFormations"
            :key="item.slug"
            v-reveal="revealStagger(i)"
            :title="item.title"
            :image-top="item.family"
            :image-bottom="item.meta"
            :image="item.image"
            :to="item.to"
          />
        </div>

        <div class="flex justify-center mt-lg">
          <NuxtLink
            to="/formations"
            class="inline-block text-body font-bold text-primary transition-colors hover:text-accent-text md:hidden"
          >
            Voir tout le catalogue <span class="link-arrow">→</span>
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Centres -->
    <section id="centres" class="mx-auto px-gutter-mobile md:px-gutter py-section">
      <div class="flex flex-col gap-md sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 class="font-display text-xl md:text-h2 font-extrabold text-ink">
            Le réseau Learn Up Academy
          </h2>
          <p class="mt-sm max-w-prose font-sans text-sm text-ink-muted">
            <span class="font-bold text-primary">+400 centres partenaires</span>
            dans
            <span class="font-bold text-primary">96 départements</span>
            — en centre, sur votre site ou en intra-entreprise.
          </p>
        </div>
        <NuxtLink
          to="/centres"
          class="hidden whitespace-nowrap text-body font-bold text-primary transition-colors hover:text-accent-text md:block"
        >
          Explorer la carte des centres <span class="link-arrow">→</span>
        </NuxtLink>
      </div>

      <div class="mt-xl grid gap-grid lg:grid-cols-3">
        <div
          class="h-80 overflow-hidden rounded-md border border-rule bg-surface md:h-112 lg:col-span-2"
        >
          <CenterMap
            v-if="homeMapCenters.length"
            :centers="homeMapCenters"
            :active-id="null"
            :caption="''"
            :user-position="userPosition"
          />
          <div
            v-else
            class="flex h-full items-center justify-center px-md text-center text-meta text-ink-muted"
          >
            Carte de France interactive<br />départements + pins centres — lisible, pas un outil SIG
          </div>
        </div>

        <div class="flex flex-col gap-md lg:col-span-1 h-fit">
          <SearchInput
            v-model="mapSearch"
            input-id="map-search"
            sr-label="Rechercher une ville, code postal ou département"
            placeholder="Ville, code postal ou département"
            :suggestions="mapSearchSuggestions"
            @input="onMapSearchInput"
            @submit="onMapSearch"
          >
            <template #icon>
              <IconSearch :size="20" class="shrink-0 text-primary" />
            </template>
            <template #action>
              <GeoNearMe />
            </template>
          </SearchInput>

          <CenterCard
            v-for="(centre, i) in derniersCentres"
            :key="centre.slug"
            v-reveal="revealStagger(i)"
            :name="centre.name"
            :distance="centreDistance(centre)"
            :formations="centreFormations(centre)"
            :status="centreStatus(centre)"
            :to="`/centres/${centre.slug}`"
          />

          <div class="flex justify-center mt-lg">
            <NuxtLink
              to="/centres"
              class="whitespace-nowrap text-body font-bold text-primary transition-colors hover:text-accent-text md:hidden"
            >
              Explorer la carte des centres <span class="link-arrow">→</span>
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <!-- Confier -->
    <section id="confier" class="bg-primary-muted py-section text-ink-inverse">
      <div class="mx-auto px-gutter-mobile md:px-gutter">
        <p class="text-overline font-bold uppercase text-accent">Confier mes formations</p>

        <div class="mt-sm flex flex-col gap-md lg:flex-row lg:items-baseline lg:justify-between">
          <h2 class="max-w-prose font-display text-xl md:text-h2 font-extrabold">
            Un interlocuteur unique orchestre votre plan de formation
          </h2>
          <p class="max-w-callout text-small md:text-body text-ink-inverse/65">
            Pensé pour les RH, responsables formation, QHSE et directions d'exploitation : vous
            gardez la maîtrise, nous portons l'exécution.
          </p>
        </div>

        <div class="mt-2xl hidden gap-grid md:grid md:grid-cols-3">
          <ConfierCard
            v-for="(card, i) in confierCards"
            :key="card.title"
            v-reveal="revealStagger(i)"
            :tag="card.tag"
            :title="card.title"
            :body="card.body"
            :image-label="card.imageLabel"
            :image-sub="card.imageSub"
            :image="card.image"
          />
        </div>

        <div
          class="mt-2xl flex snap-x snap-mandatory gap-grid overflow-x-auto overflow-y-hidden pb-sm md:hidden"
        >
          <ConfierCard
            v-for="(card, i) in confierCards"
            :key="`${card.title}-image`"
            v-reveal="revealStagger(i)"
            variant="image"
            :tag="card.tag"
            :title="card.title"
            :body="card.body"
            :image-label="card.imageLabel"
            :image-sub="card.imageSub"
            :image="card.image"
          />
        </div>

        <div class="mt-md flex flex-col gap-md md:hidden">
          <ConfierCard
            v-for="(card, i) in confierCards"
            :key="`${card.title}-detail`"
            v-reveal="revealStagger(i)"
            variant="detail"
            :tag="card.tag"
            :title="card.title"
            :body="card.body"
            :image-label="card.imageLabel"
            :image-sub="card.imageSub"
            :image="card.image"
          />
        </div>

        <div class="mt-lg flex flex-col gap-md md:flex-row md:flex-wrap">
          <Button as-child variant="accent" size="pill-lg" class="w-full md:w-auto">
            <NuxtLink to="/centres/demande-de-formation">Confier mes formations</NuxtLink>
          </Button>
          <Button as-child variant="outline-inverse" size="pill-lg" class="w-full md:w-auto">
            <NuxtLink to="/parler-a-votre-conseiller">Parler à votre conseiller</NuxtLink>
          </Button>
        </div>
      </div>
    </section>

    <!-- Stats -->
    <section class="border-b border-rule bg-surface">
      <div
        class="mx-auto grid grid-cols-2 gap-y-xl gap-x-0 px-gutter-mobile md:px-gutter py-section md:grid-cols-4 md:gap-xl"
      >
        <StatItem
          v-for="stat in stats"
          :key="stat.label"
          :value="stat.value"
          :unit="stat.unit"
          :label="stat.label"
          class="border-r border-rule even:border-r-0 md:even:border-r last:border-r-0! odd:pr-md even:pl-md md:px-0"
        />
      </div>
    </section>

    <!-- Testimonials -->
    <section class="mx-auto px-gutter-mobile md:px-gutter py-section">
      <div class="flex flex-wrap items-end justify-between gap-sm">
        <div class="flex flex-wrap items-baseline gap-x-sm">
          <h2 class="font-display text-xl md:text-h2 font-extrabold text-ink">
            Ce qu'en disent les entreprises
          </h2>
          <span class="text-small font-medium text-ink-muted">4,7/5 · 312 avis Google</span>
        </div>
        <NuxtLink
          to="/"
          class="hidden md:block text-small font-bold text-primary transition-colors hover:text-accent-text"
          >Voir tous les avis <span class="link-arrow">→</span></NuxtLink
        >
      </div>

      <div class="mt-lg grid gap-grid md:grid-cols-3">
        <TestimonialCard
          v-for="(t, i) in testimonials"
          :key="t.author"
          v-reveal="revealStagger(i)"
          :stars="t.stars"
          :quote="t.quote"
          :author="t.author"
        />
      </div>

      <div class="flex justify-center mt-lg">
        <NuxtLink
          to="/"
          class="md:hidden text-small font-bold text-primary transition-colors hover:text-accent-text"
          >Voir tous les avis <span class="link-arrow">→</span></NuxtLink
        >
      </div>
    </section>

    <!-- News -->
    <section v-if="articles.length" id="actualites" class="bg-surface py-section">
      <div class="mx-auto px-gutter-mobile md:px-gutter">
        <div class="flex items-end justify-between">
          <h2 class="font-display text-xl font-extrabold text-ink">Actualités</h2>
          <NuxtLink
            to="/actualites"
            class="hidden md:block whitespace-nowrap text-small font-bold text-primary transition-colors hover:text-accent-text"
            >Tout le blog <span class="link-arrow">→</span></NuxtLink
          >
        </div>

        <div class="mt-lg grid gap-grid md:grid-cols-3">
          <ArticleCard
            v-for="(article, i) in articles"
            :key="article.slug"
            v-reveal="revealStagger(i)"
            :category="article.category ?? 'Actualité'"
            :title="article.title"
            :date="formatArticleDate(article.publish_at)"
            :excerpt="article.excerpt ?? ''"
            :image-url="assetUrl(article.cover_image) ?? undefined"
            :to="`/actualites/${article.slug}`"
          />
        </div>

        <div class="flex justify-center">
          <NuxtLink
            to="/actualites"
            class="mt-lg inline-block text-small font-bold text-primary transition-colors hover:text-accent-text md:hidden"
          >
            Tout le blog <span class="link-arrow">→</span>
          </NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Article, Centre } from '@learnup/types'
import { mapCourse, useCatalog } from '~/composables/useCatalog'
import { availabilityStatus, useCentreSessionDates } from '~/composables/useCentres'
import { useGeolocation } from '~/composables/useGeolocation'
import { useGeoSuggest } from '~/composables/useGeoSuggest'
import { distanceKm, formatDistance } from '~/utils/geo'
import { revealStagger } from '~/utils/reveal'
import type { CenterResult } from '~/types/center-result'
import { articleAssetUrl, formatArticleDate } from '~/utils/article'

const config = useRuntimeConfig()

function assetUrl(id: string | null): string | null {
  return articleAssetUrl(id, config.public.apiBase)
}

useContentSeo(
  {
    seo_title: 'LEARN UP ACADEMY — Plateforme de conseil en formation professionnelle',
    seo_description:
      'Trouvez et organisez la formation réglementaire adaptée à vos équipes. +400 centres partenaires, CACES, habilitations électriques, secours, incendie.'
  },
  'LEARN UP ACADEMY'
)

useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'WebSite',
            name: 'LEARN UP ACADEMY',
            url: 'https://learnup.fr',
            potentialAction: {
              '@type': 'SearchAction',
              target: 'https://learnup.fr/formations?search={search_term_string}',
              'query-input': 'required name=search_term_string'
            }
          },
          {
            '@type': 'Organization',
            name: 'LEARN UP ACADEMY',
            url: 'https://learnup.fr',
            description: 'Plateforme de conseil en formation professionnelle réglementaire.'
          }
        ]
      })
    }
  ]
})

const heroSearch = ref('')

function onHeroSearch() {
  const q = heroSearch.value.trim()
  navigateTo({ path: '/formations', query: q ? { q } : {} })
}

const mapSearch = ref('')

// Autocomplétion de la recherche réseau : mêmes suggestions que le filtre
// « Localisation » du catalogue (ville, code postal ou département).
const geoSuggest = useGeoSuggest()
const mapSearchSuggestions = computed(() => geoSuggest.suggestions.value.map((s) => s.label))

function onMapSearchInput(value: string) {
  geoSuggest.request(value)
}

const tickerItems = [
  { key: 'sessions', value: '312', label: 'sessions ouvertes' },
  { key: 'places', value: '1 480', label: 'places disponibles' },
  { key: 'deps', value: '96', label: 'départements couverts' },
  { key: 'live', value: '', label: 'données actualisées en continu' }
]

const networkCards = [
  {
    title: 'Devenir franchisé',
    subtitle: 'Rejoignez un réseau en pleine croissance',
    body: "Ouvrez votre centre Learn Up Academy avec l'appui de la marque, des outils et du réseau national.",
    cta: 'Découvrir la franchise',
    to: '/centres/demande-de-formation?sujet=franchise'
  },
  {
    title: 'Organisme partenaire',
    subtitle: 'Référencez vos centres, développez votre activité',
    body: 'Rendez vos sessions visibles et recevez des demandes qualifiées de tout le territoire.',
    cta: 'Référencer mon organisme',
    to: '/referencer-mon-organisme'
  },
  {
    title: 'Formateur indépendant',
    subtitle: 'Intervenez sur les sessions du réseau',
    body: 'Missions en centre, sur site ou en intra, au plus près de chez vous.',
    cta: 'Devenir formateur partenaire',
    to: '/centres/demande-de-formation?sujet=formateur'
  }
]

const steps = [
  {
    number: 1,
    title: 'Décrivez votre besoin',
    body: 'en une phrase, avec vos mots'
  },
  {
    number: 2,
    title: 'Recevez la solution',
    body: 'formation, centre et dates identifiés près de vos équipes'
  },
  {
    number: 3,
    title: 'Validez la session',
    body: 'demande envoyée, prise en charge sécurisée'
  },
  {
    number: 4,
    title: 'Formez vos équipes',
    body: "accompagnement jusqu'aux attestations"
  }
]

// 4 dernières formations du catalogue (API) — la fiche n'est cliquable
// que si la formation a une famille (slug d'URL complet requis).
const { data: catalogue } = await useCatalog({ limit: 4, sort: 'updatedAt', order: 'desc' })
const dernieresFormations = computed(() =>
  (catalogue.value?.items ?? []).slice(0, 4).map((c) => mapCourse(c))
)

// 2 derniers centres publiés (Directus) — colonne droite de la section réseau.
const derniersCentresData = await useDirectusList<Centre>('centres', 'home-centres', {
  fields: [
    'slug',
    'name',
    'address',
    'postal_code',
    'city',
    'department',
    'region',
    'specialties',
    'latitude',
    'longitude'
  ],
  filter: { status: { _eq: 'published' } },
  sort: ['-id'],
  limit: -1
})
// Position partagée : activée via le badge « Près de moi » (ici ou sur
// /centres), jamais automatiquement.
const { position: userPosition } = useGeolocation()

// Centres « à proximité » : triés par distance quand la position est connue,
// sinon les deux plus récents (ordre Directus).
const derniersCentres = computed(() => {
  const list = [...(derniersCentresData.value ?? [])]
  const pos = userPosition.value
  if (!pos) return list.slice(0, 2)
  return list.sort((a, b) => distanceToUser(a, pos) - distanceToUser(b, pos)).slice(0, 2)
})

function distanceToUser(centre: Centre, pos: { lat: number; lng: number }): number {
  if (centre.latitude == null || centre.longitude == null) return Infinity
  return distanceKm(pos, { lat: centre.latitude, lng: centre.longitude })
}

const homeMapCenters = computed<CenterResult[]>(() =>
  (derniersCentresData.value ?? []).map((centre) => {
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
      tagsShort: tags,
      lat: centre.latitude ?? undefined,
      lng: centre.longitude ?? undefined
    }
  })
)

function centreDistance(centre: Centre): string {
  const pos = userPosition.value
  if (pos && centre.latitude != null && centre.longitude != null) {
    return `à ${formatDistance(distanceKm(pos, { lat: centre.latitude, lng: centre.longitude }))}`
  }
  return [centre.city, centre.department].filter(Boolean).join(' · ')
}

function centreFormations(centre: Centre): string {
  return centre.specialties?.length ? centre.specialties.join(' · ') : 'Catalogue complet'
}

// Sessions à venir du catalogue agrégées par centre → badge de
// disponibilité (même sémantique `availabilityStatus` que la page /centres).
const centreSessionDates = await useCentreSessionDates()

function centreStatus(centre: Centre) {
  return availabilityStatus(centreSessionDates.value.get(centre.slug) ?? [])
}

// Soumission de la recherche réseau : ville/code postal part en query `q`
// (champ de recherche de /centres) — son département de rattachement part
// en `dept` pour présélectionner le filtre territoire ; un département
// choisi dans l'autocomplétion part seul en query `dept`.
function onMapSearch(value: string) {
  const picked = geoSuggest.byLabel(value)
  if (picked?.kind === 'department') {
    navigateTo({ path: '/centres', query: { dept: picked.term } })
    return
  }
  const q = (picked?.term ?? value).trim()
  navigateTo({
    path: '/centres',
    query: {
      ...(q ? { q } : {}),
      ...(picked?.departmentName ? { dept: picked.departmentName } : {})
    }
  })
}

const confierCards = [
  {
    tag: 'Conseil',
    title: 'Qualifier le besoin réglementaire',
    body: "Diagnostic des obligations et des recyclages à échéance, même à partir d'une demande imprécise.",
    imageLabel: 'Photo terrain à fournir',
    imageSub: 'chantier BTP — casque & harnais',
    image: '/images/formation3.webp'
  },
  {
    tag: 'Externalisation',
    title: "Déléguer l'exécution du plan",
    body: 'Sessions programmées, convocations envoyées, attestations suivies, budget consolidé.',
    imageLabel: 'Photo terrain à fournir',
    imageSub: 'entrepôt logistique — cariste en formation',
    image: '/images/formation2.webp'
  },
  {
    tag: 'Multi-sites',
    title: 'Piloter la conformité partout',
    body: 'Reporting site par site, alertes avant expiration, un seul point de contact national.',
    imageLabel: 'Photo terrain à fournir',
    imageSub: 'formateur en situation avec équipe RH',
    image: '/images/formation1.webp'
  }
]

const stats = [
  { value: '+250', unit: '', label: 'formations référencées' },
  { value: '+400', unit: '', label: 'centres partenaires' },
  { value: '+10 000', unit: '', label: 'apprenants par an' },
  { value: '4,7', unit: '/5', label: 'satisfaction stagiaires' }
]

const testimonials = [
  {
    stars: '★★★★★',
    quote:
      '« Douze habilitations à renouveler sur trois sites, une seule interlocutrice, tout était planifié en une semaine. »',
    author: 'Responsable QHSE — logistique, 240 salariés'
  },
  {
    stars: '★★★★★',
    quote: '« Je ne savais pas quel CACES demander. La description libre a suffi. »',
    author: "Directeur d'agence — intérim"
  },
  {
    stars: '★★★★☆',
    quote: '« Plan déployé sur nos quatre dépôts sans une seule relance de notre part. »',
    author: 'Responsable formation — BTP'
  }
]

const homeArticlesData = await useDirectusList<Article>('articles', 'home-actualites-list', {
  fields: ['id', 'status', 'slug', 'title', 'excerpt', 'category', 'publish_at', 'cover_image'],
  filter: { status: { _eq: 'published' } },
  sort: ['-publish_at'],
  limit: 3
})

const articles = computed(() => (homeArticlesData.value ?? []).slice(0, 3))
</script>
