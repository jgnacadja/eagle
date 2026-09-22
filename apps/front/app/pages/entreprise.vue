<!-- apps/front/app/pages/entreprise.vue -->
<template>
  <div class="bg-paper">
    <!-- Hero -->
    <section class="relative overflow-hidden bg-linear-to-b from-paper to-surface">
      <div
        aria-hidden="true"
        class="pointer-events-none absolute -bottom-64 -left-48 h-130 w-130 rounded-full bg-primary/5"
      />
      <div
        aria-hidden="true"
        class="pointer-events-none absolute -right-40 -top-36 h-140 w-140 rounded-full bg-paper-warm"
      />

      <div class="relative mx-auto px-gutter-mobile md:px-gutter pb-section pt-4xl text-center">
        <div class="text-center md:relative">
          <span
            class="inline-block rounded-full border border-primary bg-paper px-3 py-1 text-xs md:text-sm font-bold uppercase tracking-wider text-primary"
          >
            Entreprises
          </span>

          <h1
            class="mx-auto mt-lg max-w-prose font-display text-h2 font-extrabold text-ink md:text-hero"
          >
            Simplifiez la gestion de <span class="text-accent-text">vos</span><br />
            <span class="text-accent-text">formations.</span>
          </h1>

          <p class="mx-auto mt-md max-w-prose font-semibold text-ink text-base">
            Un interlocuteur unique<span class="hidden md:inline">
              pour vos besoins de formation</span
            >, partout en France.
          </p>
          <p class="mx-auto mt-sm text-ink-muted text-sm max-w-140">
            <span class="hidden md:inline">Learn Up Academy vous accompagne dans la r</span
            ><span class="md:hidden">R</span>echerche, l'organisation et le déploiement de vos
            formations réglementaires, au plus près de vos équipes.
          </p>

          <form class="mx-auto mt-xl w-full max-w-prose" @submit.prevent="onHeroSearch()">
            <SearchInput
              v-model="heroSearch"
              input-id="entreprises-hero-search"
              sr-label="Décrire mon besoin de formation"
              placeholder="Ex. : Organiser les CACES de 20 salariés répartis entre Lyon et Grenoble."
              @submit="onHeroSearch"
            >
              <template #icon>
                <IconSparkle :size="20" class="shrink-0 text-accent" />
              </template>
            </SearchInput>
          </form>

          <p class="mx-auto mt-lg max-w-200 text-meta text-ink-muted leading-relaxed">
            Vous pouvez écrire comme vous le feriez à un conseiller<span class="hidden md:inline">
              — ex. « Nous avons 12 agences en France et souhaitons centraliser nos formations
              réglementaires. »</span
            >
          </p>

          <NuxtLink
            to="/centres/demande-de-formation?sujet=conseiller"
            class="mt-sm inline-block text-small font-bold text-accent-text underline underline-offset-4 transition-colors hover:text-primary"
          >
            Vous préférez échanger ? Parler à un conseiller <span class="link-arrow">→</span>
          </NuxtLink>

          <!-- Carte citation flottante (desktop : absolue haut-droite, mobile : centrée sous le lien) -->
          <div
            class="mx-auto mt-lg max-w-57.5 -rotate-2 rounded-2xl border border-rule/80 bg-paper p-md text-left shadow-md transition-all hover:rotate-0 hover:shadow-lg md:absolute md:-top-4 md:right-0 lg:right-4 md:mt-0"
          >
            <p class="font-sans text-small font-bold italic leading-snug text-primary">
              La formation, un levier<br />de performance durable
            </p>
            <span class="mt-sm block h-1 w-12 rounded-full bg-accent" />
          </div>
        </div>
      </div>
    </section>

    <!-- Bénéfices -->
    <section class="border-y border-rule/60 bg-surface">
      <ul
        class="mx-auto flex flex-col gap-y-4 px-gutter-mobile py-6 md:grid md:grid-cols-5 md:gap-y-0 md:px-gutter md:py-6"
      >
        <li
          v-for="benefit in heroBenefits"
          :key="benefit.label"
          class="flex items-center gap-3 md:border-l md:border-rule/80 md:pl-5 md:pr-3 md:first:border-l-0 md:first:pl-0"
        >
          <component :is="benefit.icon" :size="24" class="shrink-0 text-primary" />
          <span class="text-small font-bold text-ink leading-snug">{{ benefit.label }}</span>
        </li>
      </ul>
    </section>

    <!-- Types d'entreprises -->
    <section
      class="mx-auto px-gutter-mobile md:px-gutter py-section"
      aria-labelledby="solutions-title"
    >
      <h2
        id="solutions-title"
        class="text-center font-display text-h3 font-extrabold text-ink md:text-h2 text-xl"
      >
        Des solutions pour tous les types d'entreprises
      </h2>
      <p class="hidden md:block mx-auto mt-sm text-center text-small text-ink-muted md:text-body">
        Une réponse adaptée à votre organisation, quelle que soit votre taille ou votre secteur
        d'activité.
      </p>

      <div class="mt-xl grid grid-cols-2 gap-3 sm:gap-4 md:gap-lg lg:grid-cols-3">
        <article
          v-for="(segment, i) in segments"
          :key="segment.title"
          class="group flex flex-col justify-between rounded-2xl border border-rule p-4 shadow-2xs transition-all hover:border-primary/40 hover:shadow-md"
          :class="i < 3 ? 'bg-surface' : 'bg-paper'"
        >
          <div>
            <div
              class="hidden md:flex h-12 w-12 items-center justify-center rounded-xl text-primary transition-transform group-hover:scale-105"
              :class="i < 3 ? 'bg-paper' : 'bg-primary-soft'"
            >
              <component :is="segment.icon" :size="22" />
            </div>
            <h3 class="mt-0 md:mt-2 font-display text-small md:text-h4 font-bold text-ink">
              {{ segment.title }}
            </h3>
            <p class="mt-1 md:mt-xs text-xs md:text-small text-ink-muted leading-relaxed">
              {{ segment.body }}
            </p>
          </div>
          <NuxtLink
            :to="segment.to"
            class="md:mt-2 inline-flex items-center gap-1.5 text-small font-bold text-primary transition-colors hover:text-accent-text"
          >
            <span class="hidden md:inline">{{ segment.cta }}</span>
            <span class="link-arrow">→</span>
          </NuxtLink>
        </article>
      </div>
    </section>

    <!-- Gestion multisites -->
    <section class="bg-primary-muted text-ink-inverse">
      <div class="mx-auto px-gutter-mobile md:px-gutter py-section">
        <p class="text-overline font-bold uppercase tracking-widest text-accent">
          Gestion multisites
        </p>
        <h2 class="mt-sm max-w-prose font-display text-h3 font-extrabold md:text-h2">
          Un seul partenaire pour coordonner vos formations partout en France
        </h2>
        <p class="hidden md:block mt-sm max-w-prose text-small text-ink-inverse-muted md:text-body">
          Vos demandes sont centralisées, qualifiées, puis déployées site par site avec les centres
          du territoire — vous gardez un interlocuteur et une vision d'ensemble.
        </p>

        <ol class="mt-xl flex flex-col gap-md lg:flex-row lg:items-stretch">
          <template v-for="(step, i) in multisiteSteps" :key="step.title">
            <li
              class="flex flex-1 flex-row items-center gap-sm rounded-xl border border-white/15 bg-white/8 p-3 transition-colors hover:bg-white/12 lg:flex-col lg:items-start"
            >
              <span class="shrink-0 font-display text-h4 font-extrabold text-accent">
                {{ i + 1 }}
              </span>

              <p class="text-small font-bold text-ink-inverse">
                {{ step.title }}
              </p>
            </li>
            <li
              v-if="i < multisiteSteps.length - 1"
              aria-hidden="true"
              class="hidden shrink-0 self-center px-1 text-ink-inverse-muted/60 lg:flex"
            >
              →
            </li>
          </template>
        </ol>
      </div>
    </section>

    <!-- Carte -->
    <section class="mx-auto px-gutter-mobile md:px-gutter py-section">
      <div class="grid gap-xl lg:grid-cols-2 lg:items-center">
        <div>
          <h2 class="font-display text-h3 font-extrabold text-ink md:text-h2">
            Un réseau de centres au plus près de vos équipes
          </h2>
          <p class="mt-sm text-body text-ink-muted hidden md:block">
            Accédez aux formations dont vous avez besoin, en centre, sur votre site ou en intra — la
            carte matérialise la couverture du réseau.
          </p>
          <Button
            as-child
            variant="outline"
            size="pill-lg"
            class="hidden lg:inline-flex mt-lg w-full sm:w-auto"
          >
            <NuxtLink to="/centres">
              Voir la carte des centres <span class="link-arrow pl-1">→</span>
            </NuxtLink>
          </Button>
        </div>

        <div class="h-72 overflow-hidden rounded-xl border border-rule bg-surface md:h-96">
          <CenterMap
            v-if="mapCenters.length"
            :centers="mapCenters"
            :active-id="null"
            :caption="''"
          />
          <div
            v-else
            class="flex h-full items-center justify-center px-lg text-center text-small text-ink-muted"
          >
            Carte de France interactive<br />départements + pins centres
          </div>
        </div>

        <Button as-child variant="outline" size="pill-lg" class="md:hidden w-full sm:w-auto">
          <NuxtLink to="/centres">
            Voir la carte des centres <span class="link-arrow">→</span>
          </NuxtLink>
        </Button>
      </div>
    </section>

    <!-- Formations réglementaires -->
    <section
      class="mx-auto px-gutter-mobile md:px-gutter py-section bg-surface"
      aria-labelledby="formations-title"
    >
      <h2
        id="formations-title"
        class="font-display text-xl sm:text-h3 font-extrabold text-ink md:text-h2"
      >
        Les formations réglementaires dont vos équipes ont besoin
      </h2>

      <div class="mt-xl grid grid-cols-2 gap-3 sm:gap-4 md:gap-md lg:grid-cols-4">
        <article
          v-for="formation in formations"
          :key="formation.title"
          class="flex flex-col justify-between rounded-2xl border border-rule bg-paper p-3.5 sm:p-4 shadow-2xs transition-all hover:border-primary/40 hover:shadow-md"
        >
          <div>
            <h3 class="font-display text-small sm:text-base md:text-h4 font-bold text-ink">
              {{ formation.title }}
            </h3>
            <p v-if="formation.body" class="hidden md:line-clamp-2 mt-xs text-small text-ink-muted">
              {{ formation.body }}
            </p>
          </div>
          <NuxtLink
            :to="formation.to"
            class="mt-2 inline-flex items-center gap-1.5 text-xs sm:text-small font-bold text-primary transition-colors hover:text-accent-text"
          >
            Voir le détail <span class="link-arrow">→</span>
          </NuxtLink>
        </article>
      </div>

      <div class="mt-lg flex flex-col gap-md sm:flex-row sm:items-center sm:justify-between">
        <div class="hidden md:flex flex-wrap gap-sm">
          <NuxtLink
            v-for="tag in formationTags"
            :key="tag"
            :to="`/formations?q=${encodeURIComponent(tag)}`"
            class="rounded-full border border-rule bg-paper p-3 text-meta font-medium text-ink transition-colors hover:border-primary hover:text-primary"
          >
            {{ tag }}
          </NuxtLink>
        </div>
        <Button as-child size="pill-lg" class="w-full sm:w-auto">
          <NuxtLink to="/formations">
            Voir tout le catalogue <span class="link-arrow">→</span>
          </NuxtLink>
        </Button>
      </div>
    </section>

    <!-- Comment ça marche -->
    <section aria-labelledby="comment-title">
      <div class="mx-auto px-gutter-mobile md:px-gutter py-section">
        <h2
          id="comment-title"
          class="text-center font-display text-h3 font-extrabold text-ink md:text-h2"
        >
          Comment ça marche ?
        </h2>

        <div class="mt-xl flex flex-col gap-md lg:flex-row lg:items-stretch">
          <template v-for="(step, idx) in howItWorksSteps" :key="step.title">
            <div
              class="flex flex-1 flex-row items-center gap-md rounded-xl border border-rule bg-paper p-3 shadow-2xs transition-shadow hover:shadow-sm lg:flex-col lg:items-start"
            >
              <span
                class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-small font-bold text-ink"
              >
                {{ step.number }}
              </span>

              <div>
                <h3 class="font-display text-small md:text-h4 font-bold text-ink">
                  {{ step.title }}
                </h3>
                <p class="hidden lg:block mt-xs text-small text-ink-muted">{{ step.body }}</p>
              </div>
            </div>

            <div
              v-if="idx < howItWorksSteps.length - 1"
              aria-hidden="true"
              class="hidden shrink-0 self-center px-1 text-ink-subtle lg:flex"
            >
              →
            </div>
          </template>
        </div>
      </div>
    </section>

    <!-- Confiance -->
    <section
      class="mx-auto px-gutter-mobile md:px-gutter py-section bg-surface"
      aria-labelledby="confiance-title"
    >
      <h2
        id="confiance-title"
        class="font-display text-xl sm:text-h3 font-extrabold text-ink md:text-h2"
      >
        Ils nous font confiance
      </h2>

      <!-- Logos avec scroll horizontal sur mobile -->
      <div
        class="mt-lg flex snap-x snap-mandatory gap-3 overflow-x-auto pb-sm md:grid md:grid-cols-6 md:gap-md md:overflow-visible"
      >
        <div
          v-for="company in techCompanyLogos"
          :key="company.name"
          class="flex h-16 w-32 shrink-0 snap-start items-center justify-center rounded-2xl border border-rule bg-paper p-3.5 shadow-2xs transition-all hover:border-primary/40 hover:shadow-xs md:h-20 md:w-auto"
        >
          <img
            :src="company.logoUrl"
            :alt="`Logo ${company.name}`"
            class="max-h-7 max-w-[80%] object-contain grayscale opacity-75 transition-[filter,opacity] hover:grayscale-0 hover:opacity-100 md:max-h-8"
            loading="lazy"
          />
        </div>
      </div>

      <div class="mt-lg grid gap-grid md:grid-cols-2">
        <TestimonialCard
          v-for="testimonial in testimonials"
          :key="testimonial.author"
          variant="white"
          :stars="testimonial.stars"
          :quote="testimonial.quote"
          :author="testimonial.author"
        />
      </div>

      <p class="mt-4 text-xs text-ink-subtle">
        <span class="hidden md:inline">
          Avis réels et références publiées avec l'accord écrit des entreprises concernées.
        </span>
        <span class="md:hidden"> Avis réels — références publiées avec accord écrit. </span>
      </p>
    </section>

    <!-- CTA final -->
    <section class="bg-primary-muted py-section text-ink-inverse">
      <div class="px-gutter-mobile text-center">
        <h2 class="font-display text-xl font-extrabold text-ink-inverse md:text-h2">
          Un projet de formation pour votre entreprise ?
        </h2>

        <form class="mx-auto mt-lg w-full max-w-prose" @submit.prevent="onFinalSearch()">
          <SearchInput
            v-model="finalSearch"
            input-id="entreprises-final-search"
            sr-label="Décrire mon projet de formation"
            placeholder="Ex. : Nous devons renouveler 12 habilitations sur deux sites avant décembre."
            @submit="onFinalSearch"
          >
            <template #icon>
              <IconSparkle :size="20" class="shrink-0 text-accent" />
            </template>
          </SearchInput>
        </form>

        <p class="mt-md text-meta text-ink-inverse-muted">
          Vous pouvez écrire comme vous le feriez à un conseiller.
        </p>

        <Button as-child variant="accent" size="pill-lg" class="mt-lg w-full sm:w-auto">
          <NuxtLink to="/centres/demande-de-formation?sujet=conseiller">
            Échanger avec un conseiller <span class="link-arrow">→</span>
          </NuxtLink>
        </Button>
      </div>
    </section>

    <!-- Pour aller plus loin -->
    <section class="mx-auto px-gutter-mobile md:px-gutter py-section bg-surface">
      <h2 class="text-center font-display text-h3 font-extrabold text-ink md:text-h2">
        Pour aller plus loin
      </h2>

      <div class="mt-xl grid gap-lg md:grid-cols-2">
        <NuxtLink
          v-for="link in furtherLinks"
          :key="link.title"
          :to="link.to"
          class="group flex items-center justify-between gap-md rounded-xl border border-rule bg-paper p-3 md:p-lg shadow-2xs transition-all hover:border-primary hover:shadow-md"
        >
          <div>
            <h3 class="font-display text-small font-bold uppercase tracking-wider text-ink">
              {{ link.title }}
            </h3>
            <p class="mt-xs text-xs text-ink-muted">{{ link.body }}</p>
          </div>
          <span
            class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full lg:border lg:border-rule text-primary transition-all group-hover:border-primary group-hover:bg-primary group-hover:text-ink-inverse"
            aria-hidden="true"
          >
            →
          </span>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Centre, SousFamilleFormation } from '@learnup/types'
import { mapCourse, useCatalog } from '~/composables/useCatalog'
import type { CenterResult } from '~/types/center-result'
import IconSparkle from '~/components/icons/IconSparkle.vue'
import IconUser from '~/components/icons/IconUser.vue'
import IconFileText from '~/components/icons/IconFileText.vue'
import IconGlobe from '~/components/icons/IconGlobe.vue'
import IconCalendar from '~/components/icons/IconCalendar.vue'
import IconLayoutGrid from '~/components/icons/IconLayoutGrid.vue'
import IconBuilding from '~/components/icons/IconBuilding.vue'
import IconUsers from '~/components/icons/IconUsers.vue'
import IconHardHat from '~/components/icons/IconHardHat.vue'
import IconFactory from '~/components/icons/IconFactory.vue'
import IconBriefcase from '~/components/icons/IconBriefcase.vue'

definePageMeta({
  layout: 'default'
})

useContentSeo(
  {
    seo_title: 'Solutions entreprises — LEARN UP ACADEMY',
    seo_description:
      'Un interlocuteur unique pour organiser vos formations réglementaires, partout en France. TPE/PME, ETI, grands comptes, BTP, industrie, travail temporaire.'
  },
  'Solutions entreprises — LEARN UP ACADEMY'
)

const heroSearch = ref('')
const finalSearch = ref('')

function onHeroSearch(value?: string) {
  const q = (value ?? heroSearch.value).trim()
  navigateTo({
    path: '/centres/demande-de-formation',
    query: q ? { q, sujet: 'conseiller' } : { sujet: 'conseiller' }
  })
}

function onFinalSearch(value?: string) {
  const q = (value ?? finalSearch.value).trim()
  navigateTo({
    path: '/centres/demande-de-formation',
    query: q ? { q, sujet: 'conseiller' } : { sujet: 'conseiller' }
  })
}

const heroBenefits = [
  { icon: IconUser, label: 'Un interlocuteur unique' },
  { icon: IconFileText, label: 'Des solutions adaptées à vos métiers' },
  { icon: IconGlobe, label: 'Une couverture nationale' },
  { icon: IconCalendar, label: 'Des sessions rapidement disponibles' },
  { icon: IconLayoutGrid, label: 'Un suivi simplifié de vos formations' }
]

const segments = [
  {
    icon: IconBuilding,
    title: 'TPE / PME',
    body: 'Des solutions souples et adaptées.',
    cta: 'Comment nous travaillons',
    to: '/entreprises/tpe-pme'
  },
  {
    icon: IconBuilding,
    title: 'ETI',
    body: 'Un accompagnement personnalisé.',
    cta: 'Comment nous travaillons',
    to: '/entreprises/eti'
  },
  {
    icon: IconUsers,
    title: 'Grands comptes',
    body: 'Une gestion centralisée multi-sites.',
    cta: 'Comment nous travaillons',
    to: '/entreprises/grands-comptes'
  },
  {
    icon: IconHardHat,
    title: 'BTP',
    body: 'Formations essentielles chantiers.',
    cta: 'Voir les formations',
    to: `/formations?q=${encodeURIComponent('BTP')}`
  },
  {
    icon: IconFactory,
    title: 'Industrie',
    body: 'Habilitations et interventions.',
    cta: 'Voir les formations',
    to: `/formations?q=${encodeURIComponent('Industrie')}`
  },
  {
    icon: IconBriefcase,
    title: 'Travail temporaire',
    body: 'Recyclages des intérimaires.',
    cta: 'Voir les formations',
    to: `/formations?q=${encodeURIComponent('Travail temporaire')}`
  }
]

const multisiteSteps = [
  { title: 'Centralisation des demandes' },
  { title: 'Identification des besoins' },
  { title: 'Recherche des solutions locales' },
  { title: 'Coordination des sessions' },
  { title: 'Suivi consolidé' }
]

const fallbackFormations = [
  {
    title: 'CACES® R489 Chariots élévateurs',
    body: 'Catégories 1A, 1B, 3 et 5 — Initiale et recyclage.',
    to: '/formations/caces-conduite-engins/caces-r489-chariots-elevateurs'
  },
  {
    title: 'Habilitation électrique B1V / B2V / BR / BC',
    body: 'Travaux électriques basse tension et interventions.',
    to: '/formations/habilitation-electrique/habilitation-electrique-b1v-b2v-br-bc'
  },
  {
    title: 'SST — Sauveteur Secouriste du Travail',
    body: 'Formation initiale aux premiers secours en entreprise.',
    to: '/formations/secourisme/sauveteur-secouriste-du-travail-sst'
  },
  {
    title: 'Travail en hauteur & port du harnais',
    body: 'Prévention des chutes et utilisation des EPI.',
    to: '/formations/hauteur/travail-en-hauteur-port-du-harnais'
  }
]

const { data: catalogue } = await useCatalog({ limit: 4, sort: 'updatedAt', order: 'desc' })

const formations = computed(() => {
  const items = catalogue.value?.items ?? []
  if (items.length) {
    return items.slice(0, 4).map((c) => {
      const mapped = mapCourse(c)
      return {
        title: mapped.title,
        body: mapped.description,
        to: mapped.to ?? '/formations'
      }
    })
  }
  return fallbackFormations
})

const fallbackFormationTags = ['AIPR', 'CATEC®', 'Amiante SS4', 'SECUFER', 'Gestes & postures']

const tagsData = await useDirectusList<SousFamilleFormation>(
  'sous_familles_formation',
  'entreprise-formation-tags',
  {
    fields: ['name', 'slug'],
    filter: { status: { _eq: 'published' } },
    sort: ['-id'],
    limit: 5
  }
)

const formationTags = computed(() => {
  const items = (tagsData.value ?? [])
    .map((s) => s.name?.trim())
    .filter((name): name is string => Boolean(name))
  if (items.length) {
    return items
  }
  return fallbackFormationTags
})

const howItWorksSteps = [
  { number: 1, title: 'Vous exprimez votre besoin', body: 'Avec vos mots, en une phrase.' },
  {
    number: 2,
    title: 'Nous identifions les solutions adaptées',
    body: 'Formations, centres, dates.'
  },
  {
    number: 3,
    title: 'Nous organisons vos formations',
    body: 'En centre, sur site ou en intra.'
  },
  {
    number: 4,
    title: "Vous bénéficiez d'un suivi centralisé",
    body: 'Attestations, échéances, recyclages.'
  }
]

const techCompanyLogos = [
  {
    name: 'Capgemini',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/9/9d/Capgemini_201x_logo.svg'
  },
  {
    name: 'Microsoft',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/9/96/Microsoft_logo_%282012%29.svg'
  },
  {
    name: 'Google Cloud',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/51/Google_Cloud_logo.svg'
  },
  {
    name: 'Amazon',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg'
  },
  {
    name: 'IBM',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/51/IBM_logo.svg'
  },
  {
    name: 'Oracle',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/50/Oracle_logo.svg'
  }
]

const testimonials = [
  {
    stars: '★★★★★',
    quote:
      '« Nous avons centralisé les formations réglementaires de nos agences : un vrai gain de temps et une grande réactivité. »',
    author: 'Responsable formation — groupe national, BTP'
  },
  {
    stars: '★★★★★',
    quote:
      '« Douze habilitations à renouveler sur trois sites, une seule interlocutrice, tout était planifié en une semaine. »',
    author: 'Responsable QHSE — logistique, 240 salariés'
  }
]

const furtherLinks = [
  {
    title: "Le réseau d'entreprises clientes",
    body: 'Secteurs, typologies, références.',
    to: '/entreprises/references'
  },
  {
    title: 'Les partenaires du réseau',
    body: 'Centres et organismes du réseau.',
    to: '/a-propos/reseau'
  }
]

// Même pattern que reseau.vue : centres publiés pour la carte, fallback si vide.
const centresData = await useDirectusList<Centre>('centres', 'entreprises-map-centres', {
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

const mapCenters = computed<CenterResult[]>(() =>
  (centresData.value ?? []).map((centre) => {
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
</script>
