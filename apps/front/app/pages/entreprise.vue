<template>
  <div class="bg-paper">
    <!-- Hero -->
    <section class="relative overflow-hidden bg-linear-to-b from-paper to-surface">
      <div
        aria-hidden="true"
        class="pointer-events-none absolute -bottom-64 -left-48 h-96 w-96 rounded-full bg-primary/5"
      />
      <div
        aria-hidden="true"
        class="pointer-events-none absolute -right-40 -top-36 h-96 w-96 rounded-full bg-paper-warm"
      />

      <div class="relative mx-auto px-gutter-mobile md:px-gutter pb-section pt-4xl text-center">
        <div class="text-center md:relative">
          <span
            class="inline-block rounded-full border border-primary/25 bg-paper px-md py-xs text-meta font-bold uppercase tracking-wider text-primary shadow-sm"
          >
            Entreprises
          </span>

          <h1
            class="mx-auto mt-lg max-w-prose font-display text-h2 font-extrabold text-ink md:text-hero"
          >
            Simplifiez la gestion de <span class="text-accent-text">vos</span><br />
            <span class="text-accent-text">formations.</span>
          </h1>

          <p class="mx-auto mt-md max-w-prose font-semibold text-ink text-body">
            <span class="hidden md:inline"
              >Un interlocuteur unique pour vos besoins de formation, partout en France.</span
            ><span class="md:hidden">Un interlocuteur unique, partout en France.</span>
          </p>
          <p class="mx-auto mt-sm text-ink-muted text-small max-w-prose">
            <span class="hidden md:inline"
              >Learn Up Academy vous accompagne dans la recherche, l'organisation et le déploiement
              de vos formations réglementaires, au plus près de vos équipes.</span
            ><span class="md:hidden"
              >Recherche, l'organisation et le déploiement de vos formations réglementaires, au plus
              près de vos équipes.</span
            >
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

          <p class="mx-auto mt-lg max-w-prose text-small text-ink-muted">
            <span class="hidden md:inline"
              >Vous pouvez écrire comme vous le feriez à un conseiller — ex. « Nous avons 12 agences
              en France et souhaitons centraliser nos formations réglementaires. »</span
            ><span class="md:hidden">Vous pouvez écrire comme vous le feriez à un conseiller.</span>
          </p>

          <NuxtLink
            to="/parler-a-votre-conseiller"
            class="mt-sm inline-block text-small font-bold text-accent-text underline underline-offset-4 transition-colors hover:text-primary"
          >
            Vous préférez échanger ? Parler à un conseiller <span class="link-arrow">→</span>
          </NuxtLink>

          <!-- Carte citation flottante (desktop : absolue haut-droite, mobile : centrée sous le lien) -->
          <div
            class="mx-auto mt-lg max-w-57.5 -rotate-2 rounded-md border border-rule/80 bg-paper p-md text-left shadow-md transition-all hover:rotate-0 hover:shadow-lg md:absolute md:-top-4 md:right-0 lg:right-4 md:mt-0"
          >
            <p class="font-sans text-small font-bold italic text-primary">
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
        class="mx-auto flex flex-col gap-y-md px-gutter-mobile py-xl md:grid md:grid-cols-5 md:gap-y-0 md:px-gutter md:py-xl"
      >
        <li
          v-for="(benefit, i) in heroBenefits"
          :key="benefit.label"
          v-reveal="revealStagger(i)"
          class="flex items-center gap-md md:border-l md:border-rule/80 md:pl-md md:pr-sm md:first:border-l-0 md:first:pl-0"
        >
          <component :is="benefit.icon" :size="24" class="shrink-0 text-primary" />
          <span class="text-small font-bold text-ink">{{ benefit.label }}</span>
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
        class="text-center font-display text-h3 font-extrabold text-ink md:text-h2"
      >
        Des solutions pour tous les types d'entreprises
      </h2>
      <p class="hidden md:block mx-auto mt-sm text-center text-small text-ink-muted md:text-body">
        Une réponse adaptée à votre organisation, quelle que soit votre taille ou votre secteur
        d'activité.
      </p>

      <div class="mt-xl grid grid-cols-2 gap-md md:gap-lg lg:grid-cols-3">
        <article
          v-for="(segment, i) in segments"
          :key="segment.title"
          v-reveal="revealStagger(i)"
          class="group flex flex-col justify-between rounded-md border border-rule p-md shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
          :class="i < 3 ? 'bg-surface' : 'bg-paper'"
        >
          <div>
            <div
              class="hidden md:flex h-12 w-12 items-center justify-center rounded-sm text-primary transition-transform group-hover:scale-105"
              :class="i < 3 ? 'bg-paper' : 'bg-primary-soft'"
            >
              <component :is="segment.icon" :size="22" />
            </div>
            <h3 class="font-display text-small font-bold text-ink md:mt-sm md:text-h4">
              {{ segment.title }}
            </h3>
            <p class="mt-xs text-small text-ink-muted">
              {{ segment.body }}
            </p>
          </div>
          <NuxtLink
            :to="segment.to"
            class="inline-flex items-center gap-sm text-small font-bold text-primary transition-colors hover:text-accent-text md:mt-sm"
          >
            <span class="hidden md:inline">{{ segment.cta }}</span>
            <span class="sr-only md:hidden">{{ segment.cta }} : {{ segment.title }}</span>
            <span class="link-arrow" aria-hidden="true">→</span>
          </NuxtLink>
        </article>
      </div>
    </section>

    <!-- Gestion multisites -->
    <section id="multisites" class="bg-primary-muted text-ink-inverse">
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
              v-reveal="revealStagger(i)"
              class="flex flex-1 flex-row items-center gap-sm rounded-sm border border-outline-inverse/20 bg-paper/10 p-md transition-colors hover:bg-paper/15 lg:flex-col lg:items-start"
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
              class="hidden shrink-0 self-center px-xs text-ink-inverse-muted/60 lg:flex"
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
            class="hidden lg:inline-flex gap-xs mt-lg w-full sm:w-auto"
          >
            <NuxtLink to="/centres">
              Voir la carte des centres <span class="link-arrow">→</span>
            </NuxtLink>
          </Button>
        </div>

        <div v-reveal class="h-72 overflow-hidden rounded-sm border border-rule bg-surface md:h-96">
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
            La carte des centres est temporairement indisponible.
          </div>
        </div>

        <Button
          as-child
          variant="outline"
          size="pill-lg"
          class="gap-xs mt-lg w-full sm:w-auto lg:hidden"
        >
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

      <div class="mt-xl grid grid-cols-2 gap-md lg:grid-cols-4">
        <article
          v-for="(formation, i) in formations"
          :key="formation.title"
          v-reveal="revealStagger(i)"
          class="flex flex-col justify-between rounded-md border border-rule bg-paper p-md shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
        >
          <div>
            <h3 class="font-display text-small md:text-h4 font-bold text-ink">
              {{ formation.title }}
            </h3>
            <p v-if="formation.body" class="hidden md:line-clamp-2 mt-xs text-small text-ink-muted">
              {{ formation.body }}
            </p>
          </div>
          <NuxtLink
            :to="formation.to"
            class="mt-sm inline-flex items-center gap-sm text-small font-bold text-primary transition-colors hover:text-accent-text"
          >
            Voir le détail <span class="link-arrow">→</span>
          </NuxtLink>
        </article>
      </div>

      <div class="mt-lg flex flex-col gap-md sm:flex-row sm:items-center sm:justify-between">
        <div class="hidden md:flex flex-wrap gap-sm">
          <Badge
            v-for="tag in formationTags"
            :key="tag"
            as-child
            variant="outline"
            class="font-medium transition-colors hover:border-primary hover:text-primary"
          >
            <NuxtLink :to="`/formations?q=${encodeURIComponent(tag)}`">
              {{ tag }}
            </NuxtLink>
          </Badge>
        </div>
        <Button as-child size="pill-lg" class="gap-xs w-full sm:w-auto">
          <NuxtLink to="/formations">
            Voir tout le catalogue <span class="link-arrow">→</span>
          </NuxtLink>
        </Button>
      </div>
    </section>

    <!-- Comment ça marche -->
    <section id="comment-marche" aria-labelledby="comment-title">
      <div class="mx-auto px-gutter-mobile md:px-gutter py-section">
        <h2
          id="comment-title"
          class="text-center font-display text-h3 font-extrabold text-ink md:text-h2"
        >
          Comment ça marche ?
        </h2>

        <ProcessSteps :steps="howItWorksSteps" last-step-variant="accent" class="mt-xl" />
      </div>
    </section>

    <!-- Confiance -->
    <section
      id="confiance"
      class="mx-auto px-gutter-mobile md:px-gutter py-section bg-surface"
      aria-labelledby="confiance-title"
    >
      <h2 id="confiance-title" class="font-display text-h3 font-extrabold text-ink md:text-h2">
        Ils nous font confiance
      </h2>

      <!-- Logos avec scroll horizontal sur mobile -->
      <ClientLogoWall />

      <div v-if="testimonials.length" class="mt-lg grid gap-grid md:grid-cols-2">
        <TestimonialCard
          v-for="(testimonial, i) in testimonials"
          :key="testimonial.author"
          v-reveal="revealStagger(i)"
          variant="paper"
          :stars="testimonial.stars"
          :quote="testimonial.quote"
          :author="testimonial.author"
        />
      </div>

      <p class="mt-md text-small text-ink-subtle">
        <span class="hidden md:inline">
          Avis réels et références publiées avec l'accord des entreprises concernées.
        </span>
        <span class="md:hidden"> Avis réels — références publiées avec accord. </span>
      </p>
    </section>

    <!-- CTA final -->
    <section class="bg-primary-muted py-section text-ink-inverse">
      <div class="px-gutter-mobile text-center">
        <h2 class="font-display text-h3 font-extrabold text-ink-inverse md:text-h2">
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

        <p class="mt-md text-small text-ink-inverse-muted">
          Vous pouvez écrire comme vous le feriez à un conseiller.
        </p>

        <Button as-child variant="accent" size="pill-lg" class="gap-xs mt-lg w-full sm:w-auto">
          <NuxtLink to="/parler-a-votre-conseiller">
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
          v-for="(link, i) in furtherLinks"
          :key="link.title"
          v-reveal="revealStagger(i)"
          :to="link.to"
          class="group flex items-center justify-between gap-md rounded-md border border-rule bg-paper p-md shadow-sm transition-all hover:border-primary hover:shadow-md md:p-lg"
        >
          <div>
            <h3 class="font-display text-small font-bold uppercase tracking-wider text-ink">
              {{ link.title }}
            </h3>
            <p class="mt-xs text-small text-ink-muted">{{ link.body }}</p>
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
import type { Avis, Centre } from '@learnup/types'
import { mapCourse, useCatalog } from '~/composables/useCatalog'
import { revealStagger } from '~/utils/reveal'
import type { CenterResult } from '~/types/center-result'
import { toCenterResults } from '~/utils/centre'
import { mapAvis } from '~/utils/avis'
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
    path: '/parler-a-votre-conseiller',
    query: q ? { q } : {}
  })
}

function onFinalSearch(value?: string) {
  const q = (value ?? finalSearch.value).trim()
  navigateTo({
    path: '/parler-a-votre-conseiller',
    query: q ? { q } : {}
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
    to: '#multisites'
  },
  {
    icon: IconBuilding,
    title: 'ETI',
    body: 'Un accompagnement personnalisé.',
    cta: 'Comment nous travaillons',
    to: '#multisites'
  },
  {
    icon: IconUsers,
    title: 'Grands comptes',
    body: 'Une gestion centralisée multi-sites.',
    cta: 'Comment nous travaillons',
    to: '#multisites'
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

const REGULATORY_FAMILIES = [
  'caces-conduite-engins',
  'habilitation-electrique',
  'secourisme',
  'hauteur',
  'amiante',
  'securite-prevention'
]

const { data: catalogue } = await useCatalog({ limit: 12, sort: 'updatedAt', order: 'desc' })

const formations = computed(() => {
  const items = catalogue.value?.items ?? []
  const regulatoryItems = items.filter((c) =>
    REGULATORY_FAMILIES.some((f) => c.familySlug?.includes(f))
  )
  const listToUse = regulatoryItems.length >= 2 ? regulatoryItems : items
  if (listToUse.length) {
    return listToUse.slice(0, 4).map((c) => {
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

const avisData = await useDirectusList<Avis>('avis', 'entreprise-avis', {
  fields: ['slug', 'author', 'quote', 'stars', 'published_at'],
  filter: {
    status: { _eq: 'published' },
    centre: { _null: true }
  },
  sort: ['sort', '-published_at'],
  limit: 6
})

const testimonials = computed(() => (avisData.value ?? []).map(mapAvis))

const furtherLinks = [
  {
    title: "Le réseau d'entreprises clientes",
    body: 'Secteurs, typologies, références.',
    to: '/entreprise-reseau'
  },
  {
    title: 'Les partenaires du réseau',
    body: 'Centres et organismes du réseau.',
    to: '/rejoindre-le-reseau'
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
  limit: 100
})

const mapCenters = computed<CenterResult[]>(() => toCenterResults(centresData.value))
</script>
