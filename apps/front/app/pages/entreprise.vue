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
            class="inline-block rounded-full border border-primary bg-paper px-4 py-2 text-h4 font-bold uppercase tracking-widest text-primary"
          >
            Entreprises
          </span>

          <h1
            class="mx-auto mt-lg max-w-prose font-display text-h2 font-extrabold text-ink md:text-hero"
          >
            Simplifiez la gestion de
            <span class="text-accent-text">vos</span><br class="hidden sm:inline" />
            <span class="text-accent-text">formations.</span>
          </h1>

          <p class="mx-auto mt-md max-w-prose font-semibold text-ink text-base">
            Un interlocuteur unique pour vos besoins de formation, partout en France.
          </p>
          <p class="mx-auto mt-sm max-w-prose text-ink-muted text-sm">
            Learn Up Academy vous accompagne dans la recherche, l'organisation et le déploiement de
            vos formations réglementaires, au plus près de vos équipes.
          </p>

          <!-- Carte citation flottante (desktop uniquement en position absolue) -->
          <div
            class="mx-auto mt-lg max-w-57.5 rounded-2xl border border-rule/80 bg-paper p-md text-left shadow-md transition-shadow hover:shadow-lg md:absolute md:-top-4 md:right-0 lg:right-4 md:mt-0"
          >
            <p class="font-sans text-small font-bold leading-snug text-ink">
              La formation, un levier<br />de performance durable
            </p>
            <span class="mt-sm block h-1 w-12 rounded-full bg-accent" />
          </div>

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

          <p class="mx-auto mt-lg max-w-200 text-meta text-ink-subtle">
            Vous pouvez écrire comme vous le feriez à un conseiller — ex. « Nous avons 12 agences en
            France et souhaitons centraliser nos formations réglementaires. »
          </p>

          <NuxtLink
            to="/centres/demande-de-formation?sujet=conseiller"
            class="mt-sm inline-block text-small font-bold text-accent-text underline underline-offset-4 transition-colors hover:text-primary"
          >
            Vous préférez échanger ? Parler à un conseiller <span class="link-arrow">→</span>
          </NuxtLink>
        </div>

        <!-- Bénéfices -->
        <ul
          class="mt-2xl flex flex-col gap-y-4 border-t border-rule/60 pt-xl md:flex-row md:flex-nowrap md:items-center md:justify-between md:gap-y-0"
        >
          <li
            v-for="benefit in heroBenefits"
            :key="benefit.label"
            class="flex items-center gap-sm text-small font-medium text-ink-muted"
          >
            <component :is="benefit.icon" :size="20" class="shrink-0 text-primary" />
            <span class="font-semibold">{{ benefit.label }}</span>
          </li>
        </ul>
      </div>
    </section>

    <!-- Types d'entreprises -->
    <section
      class="mx-auto px-gutter-mobile md:px-gutter py-section"
      aria-labelledby="solutions-title"
    >
      <h2
        id="solutions-title"
        class="text-center font-display text-h3 font-extrabold text-ink md:text-h2"
      >
        Des solutions pour tous les types d'entreprises
      </h2>
      <p class="mx-auto mt-sm text-center text-small text-ink-muted md:text-body">
        Une réponse adaptée à votre organisation, quelle que soit votre taille ou votre secteur
        d'activité.
      </p>

      <div class="mt-xl grid grid-cols-1 gap-lg sm:grid-cols-2 lg:grid-cols-3">
        <article
          v-for="(segment, i) in segments"
          :key="segment.title"
          class="group flex flex-col justify-between rounded-xl p-lg shadow-2xs transition-all hover:border-primary/40 hover:shadow-md"
          :class="i < 3 ? 'bg-surface' : 'bg-paper border border-rule'"
        >
          <div>
            <div
              class="hidden md:flex h-12 w-12 items-center justify-center rounded-xl text-primary transition-transform group-hover:scale-105"
              :class="i < 3 ? 'bg-paper' : 'bg-primary-soft'"
            >
              <component :is="segment.icon" :size="22" />
            </div>
            <h3 class="mt-md font-display text-h4 font-bold text-ink">{{ segment.title }}</h3>
            <p class="mt-xs text-small text-ink-muted">{{ segment.body }}</p>
          </div>
          <NuxtLink
            :to="segment.to"
            class="mt-md inline-flex items-center gap-1.5 text-small font-bold text-primary transition-colors hover:text-accent-text"
          >
            {{ segment.cta }} <span class="link-arrow">→</span>
          </NuxtLink>
        </article>
      </div>
    </section>

    <!-- Gestion multisites -->
    <section class="bg-primary-dark text-ink-inverse">
      <div class="mx-auto px-gutter-mobile md:px-gutter py-section">
        <p class="text-overline font-bold uppercase tracking-widest text-accent-text">
          Gestion multisites
        </p>
        <h2 class="mt-sm max-w-prose font-display text-h3 font-extrabold md:text-h2">
          Un seul partenaire pour coordonner vos formations partout en France
        </h2>
        <p class="mt-sm max-w-prose text-small text-ink-inverse-muted md:text-body">
          Vos demandes sont centralisées, qualifiées, puis déployées site par site avec les centres
          du territoire — vous gardez un interlocuteur et une vision d'ensemble.
        </p>

        <ol class="mt-xl flex flex-col gap-md lg:flex-row lg:items-stretch">
          <template v-for="(step, i) in multisiteSteps" :key="step.title">
            <li
              class="flex flex-1 flex-row items-center gap-sm rounded-xl border border-white/15 bg-white/[0.08] p-md transition-colors hover:bg-white/[0.12] lg:flex-col lg:items-start"
            >
              <span class="shrink-0 font-display text-h4 font-extrabold text-accent-text">
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
          <p class="mt-sm text-body text-ink-muted">
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
              Voir la carte des centres <span class="link-arrow">→</span>
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
      <h2 id="formations-title" class="font-display text-h3 font-extrabold text-ink md:text-h2">
        Les formations réglementaires dont vos équipes ont besoin
      </h2>

      <div class="mt-xl grid grid-cols-1 gap-md sm:grid-cols-2 lg:grid-cols-4">
        <article
          v-for="family in formationFamilies"
          :key="family.title"
          class="flex flex-col justify-between rounded-xl border border-rule bg-paper p-lg shadow-2xs transition-all hover:border-primary/40 hover:shadow-md"
        >
          <div>
            <h3 class="font-display text-h4 font-bold text-ink">{{ family.title }}</h3>
            <p class="mt-xs text-small text-ink-muted">{{ family.body }}</p>
          </div>
          <NuxtLink
            :to="family.to"
            class="mt-md inline-flex items-center gap-1.5 text-small font-bold text-primary transition-colors hover:text-accent-text-text"
          >
            Voir le détail <span class="link-arrow">→</span>
          </NuxtLink>
        </article>
      </div>

      <div class="mt-lg flex flex-col gap-md sm:flex-row sm:items-center sm:justify-between">
        <div class="flex flex-wrap gap-sm">
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
                <h3 class="font-display text-h4 font-bold text-ink">
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
      <h2 id="confiance-title" class="font-display text-h3 font-extrabold text-ink md:text-h2">
        Ils nous font confiance
      </h2>

      <div class="mt-lg grid grid-cols-2 gap-md sm:grid-cols-3 md:grid-cols-6">
        <div
          v-for="n in 6"
          :key="n"
          class="flex h-16 items-center justify-center rounded-xl border border-rule bg-paper shadow-2xs text-meta font-medium text-ink-subtle md:h-20"
        >
          Logo Client
        </div>
      </div>

      <div class="mt-xl grid gap-lg md:grid-cols-2">
        <blockquote
          v-for="testimonial in testimonials"
          :key="testimonial.author"
          class="rounded-xl border border-rule bg-paper p-lg shadow-2xs transition-shadow hover:shadow-sm"
        >
          <p class="text-small tracking-wider text-accent" aria-hidden="true">★★★★★</p>
          <p class="mt-sm text-body text-ink leading-relaxed">{{ testimonial.quote }}</p>
          <footer class="mt-md text-small font-medium text-ink-muted">
            {{ testimonial.author }}
          </footer>
        </blockquote>
      </div>

      <p class="mt-lg text-meta text-ink-subtle">
        Avis réels et références publiées avec l'accord écrit des entreprises concernées.
      </p>
    </section>

    <!-- CTA final -->
    <section class="bg-primary-dark py-section text-ink-inverse">
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
import type { Centre } from '@learnup/types'
import type { CenterResult } from '~/types/center-result'
import IconSparkle from '~/components/icons/IconSparkle.vue'
import IconUser from '~/components/icons/IconUser.vue'
import IconFileText from '~/components/icons/IconFileText.vue'
import IconMapPin from '~/components/icons/IconMapPin.vue'
import IconCalendar from '~/components/icons/IconCalendar.vue'
import IconAward from '~/components/icons/IconAward.vue'
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
  { icon: IconMapPin, label: 'Présent sur toute la France' },
  { icon: IconCalendar, label: 'Des sessions rapidement disponibles' },
  { icon: IconAward, label: 'Un suivi simplifié de vos formations' }
]

const segments = [
  {
    icon: IconBuilding,
    title: 'TPE / PME',
    body: 'Des solutions souples, au plus près de votre organisation.',
    cta: 'Comment nous travaillons',
    to: '/entreprises/tpe-pme'
  },
  {
    icon: IconBuilding,
    title: 'ETI',
    body: 'Un accompagnement personnalisé, multi-territoires.',
    cta: 'Comment nous travaillons',
    to: '/entreprises/eti'
  },
  {
    icon: IconUsers,
    title: 'Grands comptes',
    body: 'Une gestion centralisée pour tous vos sites.',
    cta: 'Comment nous travaillons',
    to: '/entreprises/grands-comptes'
  },
  {
    icon: IconHardHat,
    title: 'BTP',
    body: 'CACES, hauteur, échafaudages pour vos chantiers.',
    cta: 'Voir les formations',
    to: '/formations?secteur=btp'
  },
  {
    icon: IconFactory,
    title: 'Industrie',
    body: 'Habilitations et sécurité des interventions.',
    cta: 'Voir les formations',
    to: '/formations?secteur=industrie'
  },
  {
    icon: IconBriefcase,
    title: 'Travail temporaire',
    body: 'Recyclages et CACES des intérimaires, multi-agences.',
    cta: 'Voir les formations',
    to: '/formations?secteur=interim'
  }
]

const multisiteSteps = [
  { title: 'Centralisation des demandes' },
  { title: 'Identification des besoins' },
  { title: 'Recherche des solutions locales' },
  { title: 'Coordination des sessions' },
  { title: 'Suivi consolidé' }
]

const formationFamilies = [
  {
    title: "CACES® & conduite d'engins",
    body: 'Chariots, PEMP, engins de chantier, grues.',
    to: '/formations?famille=caces'
  },
  {
    title: 'Habilitations électriques',
    body: 'B0, H0, BS, BE, BR, B1, B2…',
    to: '/formations?famille=habilitations-electriques'
  },
  {
    title: 'Santé, secours & incendie',
    body: 'SST, gestes qui sauvent, EPI, évacuation.',
    to: '/formations?famille=secourisme'
  },
  {
    title: 'Travaux en hauteur & échafaudages',
    body: 'Harnais, montage, réception, vérification.',
    to: '/formations?famille=hauteur'
  }
]

const formationTags = ['AIPR', 'CATEC®', 'Amiante SS4', 'SECUFER', 'Gestes & postures']

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

const testimonials = [
  {
    quote:
      '« Douze habilitations à renouveler sur trois sites, une seule interlocutrice, tout était planifié en une semaine. »',
    author: 'Responsable QHSE — logistique, 240 salariés'
  },
  {
    quote:
      '« Nous avons centralisé les formations réglementaires de nos agences : un vrai gain de temps et une grande réactivité. »',
    author: 'Responsable formation — groupe national, BTP'
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
