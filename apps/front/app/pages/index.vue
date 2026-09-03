<template>
  <div class="bg-paper">
    <!-- Hero -->
    <section class="relative overflow-hidden bg-surface">
      <div
        class="pointer-events-none absolute -top-24 -left-32 h-96 w-96 rounded-full bg-info-soft blur-3xl"
      />
      <div
        class="pointer-events-none absolute -top-10 -right-24 h-80 w-80 rounded-full bg-warning-soft blur-3xl"
      />

      <div
        class="relative mx-auto max-w-container px-gutter-mobile md:px-gutter pb-section pt-2xl text-center md:pt-2xl"
      >
        <span
          class="inline-block rounded-full border border-rule bg-paper px-lg py-sm text-overline text-ink-muted"
        >
          Plateforme de conseil en formation professionnelle
        </span>

        <h1 class="mt-xl font-display text-h1 font-extrabold leading-tight text-ink md:text-hero">
          Vos besoins de formation,<br />
          <span class="text-accent-text">orchestrés</span> de bout en bout.
        </h1>

        <p class="mt-md font-sans text-body text-ink-muted md:text-lead">
          La bonne formation. Au bon endroit. Au bon moment.
        </p>

        <form class="mx-auto mt-xl max-w-prose" @submit.prevent>
          <div
            class="flex items-center gap-sm rounded-full border border-rule bg-paper px-lg py-md shadow-sm focus-within:ring-2 focus-within:ring-outline"
          >
            <svg class="h-md w-md shrink-0 text-accent" fill="currentColor" viewBox="0 0 20 20">
              <path
                d="M9 2a1 1 0 0 1 1 1v.5a5.5 5.5 0 0 1 4.9 4.9H16a1 1 0 1 1 0 2h-.5a1 1 0 0 1-1-1A4.5 4.5 0 0 0 10 4.5a1 1 0 0 1-1-1V2z"
              />
            </svg>
            <label for="hero-search" class="sr-only">Rechercher une formation</label>
            <input
              id="hero-search"
              type="text"
              placeholder="« Je dois former 8 salariés au CACES près de Lyon avant septembre »"
              class="flex-1 bg-transparent font-sans text-small text-ink placeholder:text-ink-placeholder focus:outline-none"
            />
            <button
              type="submit"
              class="shrink-0 rounded-full bg-ink p-sm text-paper hover:bg-primary transition"
            >
              <svg
                class="h-md w-md"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                viewBox="0 0 24 24"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.35-4.35" stroke-linecap="round" />
              </svg>
            </button>
          </div>
        </form>

        <p class="mx-auto mt-xl max-w-prose text-small text-ink-muted">
          <span class="font-semibold text-ink">LEARN UP</span>, organisme de formation et de
          recommandation, vous accompagne pour identifier et organiser la formation la plus adaptée
          à vos équipes.
        </p>

        <NuxtLink
          to="/"
          class="mt-sm inline-block text-small font-semibold text-accent-text hover:text-accent"
        >
          Confier ma formation →
        </NuxtLink>
      </div>
    </section>

    <!-- Stats ticker -->
    <div class="overflow-hidden bg-primary-dark py-md">
      <div class="marquee flex whitespace-nowrap">
        <div class="flex items-center gap-2xl px-lg text-small font-medium text-ink-inverse-muted">
          <span v-for="item in tickerItems" :key="item.key" class="inline-flex items-center gap-sm">
            <span v-if="item.key === 'live'" class="h-xs w-xs rounded-full bg-success" />
            <strong v-if="item.key !== 'live'" class="text-ink-inverse">{{ item.value }}</strong>
            {{ item.label }}
          </span>
        </div>
        <div
          class="flex items-center gap-2xl px-lg text-small font-medium text-ink-inverse-muted"
          aria-hidden="true"
        >
          <span
            v-for="item in tickerItems"
            :key="`${item.key}-dup`"
            class="inline-flex items-center gap-sm"
          >
            <span v-if="item.key === 'live'" class="h-xs w-xs rounded-full bg-success" />
            <strong v-if="item.key !== 'live'" class="text-ink-inverse">{{ item.value }}</strong>
            {{ item.label }}
          </span>
        </div>
      </div>
    </div>

    <!-- Network -->
    <section class="mx-auto max-w-container px-gutter-mobile md:px-gutter py-section">
      <h2 class="text-center font-display text-h2 font-extrabold text-ink">
        Construisons ensemble le réseau Learn Up Academy
      </h2>
      <p class="mx-auto mt-sm max-w-prose text-center font-sans text-body text-ink-muted">
        Rejoignez un réseau national dédié aux formations réglementaires et participez à son
        développement partout en France.
      </p>

      <div class="mt-2xl grid gap-grid text-left md:grid-cols-3">
        <NetworkCard
          v-for="card in networkCards"
          :key="card.title"
          :title="card.title"
          :subtitle="card.subtitle"
          :body="card.body"
          :cta="card.cta"
        />
      </div>

      <p class="mt-xl text-center text-small text-ink-muted">
        Vous êtes un particulier ? Certaines sessions sont ouvertes aux inscriptions individuelles —
        <NuxtLink to="/" class="font-semibold text-accent-text hover:text-accent"
          >contactez le centre le plus proche →</NuxtLink
        >
      </p>
    </section>

    <!-- How it works -->
    <section class="mx-auto max-w-container px-gutter-mobile md:px-gutter pb-section">
      <p class="text-center text-overline text-accent-text">Comment ça marche</p>

      <ol class="relative mt-2xl grid gap-2xl md:grid-cols-4">
        <div
          class="absolute top-1/2 left-0 right-0 z-0 mx-auto hidden h-px w-3/4 -translate-y-1/2 bg-rule md:block"
          aria-hidden="true"
        />

        <li
          v-for="step in steps"
          :key="step.number"
          class="relative flex flex-col items-center text-center"
        >
          <span
            class="z-10 flex h-control w-control items-center justify-center rounded-full text-small font-bold text-paper"
            :class="step.number === 4 ? 'bg-success' : 'bg-ink'"
          >
            {{ step.number }}
          </span>
          <h3 class="mt-md font-sans text-h4 font-semibold text-ink">{{ step.title }}</h3>
          <p class="mt-xs text-small text-ink-muted">{{ step.body }}</p>
        </li>
      </ol>
    </section>

    <!-- Formations -->
    <section id="formations" class="bg-surface py-section">
      <div class="mx-auto max-w-container px-gutter-mobile md:px-gutter">
        <div class="flex items-end justify-between">
          <div>
            <h2 class="font-display text-h2 font-extrabold text-ink">Nos formations</h2>
            <p class="mt-sm font-sans text-body text-ink-muted">
              Nous vous accompagnons grâce à un catalogue varié.
            </p>
          </div>
          <NuxtLink
            to="/"
            class="hidden whitespace-nowrap text-small font-semibold text-ink hover:text-accent-text md:block"
          >
            Voir tout le catalogue →
          </NuxtLink>
        </div>

        <div class="mt-2xl grid gap-grid sm:grid-cols-2 lg:grid-cols-4">
          <FormationCard
            v-for="item in formations"
            :key="item.title"
            :title="item.title"
            :image-top="item.imageTop"
            :image-bottom="item.imageBottom"
          />
        </div>

        <NuxtLink
          to="/"
          class="mt-xl inline-block text-small font-semibold text-ink hover:text-accent-text md:hidden"
        >
          Voir tout le catalogue →
        </NuxtLink>
      </div>
    </section>

    <!-- Centres -->
    <section id="centres" class="mx-auto max-w-container px-gutter-mobile md:px-gutter py-section">
      <div class="flex flex-col gap-md sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 class="font-display text-h2 font-extrabold text-ink">Le réseau Learn Up Academy</h2>
          <p class="mt-sm font-sans text-body text-ink-muted">
            <strong class="text-ink">+400 centres partenaires</strong> dans
            <strong class="text-ink">96 départements</strong>
            — en centre, sur votre site ou en intra-entreprise.
          </p>
        </div>
        <NuxtLink
          to="/"
          class="whitespace-nowrap text-small font-semibold text-ink hover:text-accent-text"
        >
          Explorer la carte des centres →
        </NuxtLink>
      </div>

      <div class="mt-xl grid gap-grid lg:grid-cols-3">
        <div
          class="lg:col-span-2 flex aspect-square items-center justify-center rounded-md border border-rule bg-surface-alt text-center text-small text-ink-muted px-md"
        >
          Carte de France interactive<br />départements + pins centres — lisible, pas un outil SIG
        </div>

        <div class="flex flex-col gap-md lg:col-span-1">
          <label class="relative block">
            <span class="sr-only">Rechercher une ville, code postal ou département</span>
            <input
              type="text"
              placeholder="Ville, code postal ou département"
              class="w-full rounded-full border border-rule bg-paper px-lg py-md font-sans text-small text-ink placeholder:text-ink-placeholder focus:outline-none focus:ring-2 focus:ring-outline"
            />
          </label>

          <CentreCard
            v-for="centre in centres"
            :key="centre.name"
            :name="centre.name"
            :distance="centre.distance"
            :formations="centre.formations"
            :departments="centre.departments"
            :tags="centre.tags"
          />
        </div>
      </div>
    </section>

    <!-- Confier -->
    <section id="confier" class="bg-primary-dark py-section text-ink-inverse">
      <div class="mx-auto max-w-container px-gutter-mobile md:px-gutter">
        <p class="text-overline text-accent">Confier mes formations</p>

        <div class="mt-sm flex flex-col gap-md lg:flex-row lg:items-start lg:justify-between">
          <h2 class="max-w-prose font-display text-h2 font-extrabold leading-snug">
            Un interlocuteur unique orchestre votre plan de formation
          </h2>
          <p class="max-w-prose text-small text-ink-inverse-muted">
            Pensé pour les RH, responsables formation, QHSE et directions d'exploitation : vous
            gardez la maîtrise, nous portons l'exécution.
          </p>
        </div>

        <div class="mt-2xl grid gap-grid md:grid-cols-3">
          <ConfierCard
            v-for="card in confierCards"
            :key="card.title"
            :tag="card.tag"
            :title="card.title"
            :body="card.body"
            :image-label="card.imageLabel"
          />
        </div>

        <div class="mt-2xl flex flex-wrap gap-md">
          <NuxtLink
            to="/"
            class="rounded-full bg-accent px-lg py-md text-small font-semibold text-ink hover:bg-accent-text transition"
          >
            Confier mes formations
          </NuxtLink>
          <NuxtLink
            to="/"
            class="rounded-full border border-outline-inverse px-lg py-md text-small font-semibold text-ink-inverse hover:bg-ink-inverse/10 transition"
          >
            Parler à un conseiller
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Stats -->
    <section class="border-b border-rule">
      <div
        class="mx-auto grid max-w-container grid-cols-2 gap-xl px-gutter-mobile md:px-gutter py-section md:grid-cols-4"
      >
        <StatItem
          v-for="stat in stats"
          :key="stat.label"
          :value="stat.value"
          :unit="stat.unit"
          :label="stat.label"
        />
      </div>
    </section>

    <!-- Testimonials -->
    <section class="mx-auto max-w-container px-gutter-mobile md:px-gutter py-section">
      <div class="flex flex-wrap items-end justify-between gap-sm">
        <h2 class="font-display text-h2 font-extrabold text-ink">
          Ce qu'en disent les entreprises
          <span class="ml-sm text-meta font-medium text-ink-subtle">4,7/5 · 312 avis Google</span>
        </h2>
        <NuxtLink to="/" class="text-small font-semibold text-ink hover:text-accent-text"
          >Voir tous les avis →</NuxtLink
        >
      </div>

      <div class="mt-2xl grid gap-grid md:grid-cols-3">
        <TestimonialCard
          v-for="t in testimonials"
          :key="t.author"
          :stars="t.stars"
          :quote="t.quote"
          :author="t.author"
        />
      </div>
    </section>

    <!-- News -->
    <section id="actualites" class="bg-surface py-section">
      <div class="mx-auto max-w-container px-gutter-mobile md:px-gutter">
        <div class="flex items-end justify-between">
          <h2 class="font-display text-h2 font-extrabold text-ink">Actualités</h2>
          <NuxtLink
            to="/"
            class="whitespace-nowrap text-small font-semibold text-ink hover:text-accent-text"
            >Tout le blog →</NuxtLink
          >
        </div>

        <div class="mt-2xl grid gap-grid md:grid-cols-3">
          <ArticleCard
            v-for="article in articles"
            :key="article.title"
            :category="article.category"
            :title="article.title"
            :date="article.date"
          />
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
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
    cta: 'Découvrir la franchise →'
  },
  {
    title: 'Organisme partenaire',
    subtitle: 'Référencez vos centres, développez votre activité',
    body: 'Rendez vos sessions visibles et recevez des demandes qualifiées de tout le territoire.',
    cta: 'Référencer mon organisme →'
  },
  {
    title: 'Formateur indépendant',
    subtitle: 'Intervenez sur les sessions du réseau',
    body: 'Missions en centre, sur site ou en intra, au plus près de chez vous.',
    cta: 'Devenir formateur partenaire →'
  }
]

const steps = [
  { number: 1, title: 'Décrivez votre besoin', body: 'en une phrase, avec vos mots' },
  {
    number: 2,
    title: 'Recevez la solution',
    body: 'formation, centre et dates identifiés près de vos équipes'
  },
  { number: 3, title: 'Validez la session', body: 'demande envoyée, prise en charge sécurisée' },
  { number: 4, title: 'Formez vos équipes', body: "accompagnement jusqu'aux attestations" }
]

const formations = [
  {
    title: "CACES & conduite d'engins",
    imageTop: 'Photo à fournir',
    imageBottom: 'cariste en manœuvre'
  },
  {
    title: 'Habilitations électriques',
    imageTop: 'Photo à fournir',
    imageBottom: 'intervention armoire électrique'
  },
  {
    title: 'Santé, secours & incendie',
    imageTop: 'Photo à fournir',
    imageBottom: 'exercice SST / incendie'
  },
  {
    title: 'Travaux en hauteur',
    imageTop: 'Photo à fournir',
    imageBottom: 'harnais & travaux en hauteur'
  }
]

const centres = [
  {
    name: 'Centre de Créteil',
    distance: 'à 6 km',
    formations: 'CACES · Habilitations électriques · SST',
    departments: 'Départements : 94, 75, 77',
    tags: ['Sessions cette semaine', 'Intra sur site']
  },
  {
    name: 'Centre de Villeneuve-le-Roi',
    distance: 'à 14 km',
    formations: 'Travaux en hauteur · Échafaudages · PEMP',
    departments: 'Départements : 94, 78',
    tags: ['⚠ Prochaine session le 14/09']
  }
]

const confierCards = [
  {
    tag: 'Conseil',
    title: 'Qualifier le besoin réglementaire',
    body: "Diagnostic des obligations et des recyclages à échéance, même à partir d'une demande imprécise.",
    imageLabel: 'Photo terrain à fournir'
  },
  {
    tag: 'Externalisation',
    title: "Déléguer l'exécution du plan",
    body: 'Sessions programmées, convocations envoyées, attestations suivies, budget consolidé.',
    imageLabel: 'Photo terrain à fournir'
  },
  {
    tag: 'Multi-sites',
    title: 'Piloter la conformité partout',
    body: 'Reporting site par site, alertes avant expiration, un seul point de contact national.',
    imageLabel: 'Photo terrain à fournir'
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

const articles = [
  {
    category: 'Réglementation',
    title: 'Recyclage CACES : les échéances 2026 à anticiper',
    date: '28 août 2026 · 4 min'
  },
  {
    category: 'Conformité',
    title: 'Habilitations électriques : quelles obligations pour vos sous-traitants ?',
    date: '21 août 2026 · 6 min'
  },
  {
    category: 'Financement',
    title: 'OPCO : optimiser la prise en charge de votre plan de formation',
    date: '12 août 2026 · 5 min'
  }
]
</script>
