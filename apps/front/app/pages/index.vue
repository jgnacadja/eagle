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

      <div
        class="relative mx-auto max-w-container px-gutter-mobile md:px-gutter pb-section pt-4xl text-center"
      >
        <span
          class="inline-block rounded-full border border-primary bg-paper px-4 py-2 text-h4 font-bold uppercase leading-3 tracking-widest text-primary"
        >
          Plateforme de conseil en formation professionnelle
        </span>

        <h1 class="mt-5 font-display text-h1 font-extrabold text-ink md:text-hero">
          Vos besoins de formation,<br />
          <span class="text-accent-text">orchestrés</span> de bout en bout.
        </h1>

        <p class="mt-md font-sans text-lead font-semibold text-ink">
          La bonne formation. Au bon endroit. Au bon moment.
        </p>

        <form class="mx-auto mt-xl w-full max-w-prose" @submit.prevent>
          <SearchInput
            input-id="hero-search"
            sr-label="Rechercher une formation"
            placeholder="« Je dois former 8 salariés au CACES près de Lyon avant septembre »"
          >
            <template #icon>
              <IconSparkle :size="20" class="shrink-0 text-accent" />
            </template>
          </SearchInput>
        </form>

        <p class="mx-auto mt-5 max-w-5xl text-body md:whitespace-nowrap">
          <span class="font-bold text-ink">LEARN UP</span
          ><span class="font-medium text-ink-body"
            >, organisme de formation et de recommandation, vous accompagne pour identifier et
            organiser la formation la plus adaptée à vos équipes.</span
          >
        </p>

        <NuxtLink
          to="/"
          class="mt-2.5 inline-block text-body font-bold text-accent-text underline underline-offset-4 decoration-accent-text/40 hover:opacity-80"
        >
          Confier ma formation →
        </NuxtLink>
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
        <NuxtLink to="/" class="font-bold text-primary hover:text-primary-muted"
          >contactez le centre le plus proche →</NuxtLink
        >
      </p>
    </section>

    <!-- How it works -->
    <section class="mx-auto max-w-container px-gutter-mobile md:px-gutter pb-section">
      <p class="text-center text-h4 font-bold uppercase leading-3 tracking-widest text-accent-text">
        Comment ça marche
      </p>

      <ol class="relative mt-2.5 grid gap-2xl md:grid-cols-4">
        <div
          class="absolute top-[calc(var(--spacing-control-sm)/2-0.5px)] left-0 right-0 z-0 mx-auto hidden h-px w-4/5 bg-rule-strong md:block"
          aria-hidden="true"
        />

        <li
          v-for="step in steps"
          :key="step.number"
          class="relative flex flex-col items-center text-center"
        >
          <span
            class="z-10 flex h-control-sm w-control-sm items-center justify-center rounded-full text-small font-bold text-paper"
            :class="step.number === 4 ? 'bg-success' : 'bg-primary'"
          >
            {{ step.number }}
          </span>
          <h3 class="mt-2.5 font-sans text-body font-bold text-ink">{{ step.title }}</h3>
          <p class="mx-auto mt-1 text-small text-ink-muted" :class="step.maxWidth">
            {{ step.body }}
          </p>
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
            class="hidden whitespace-nowrap text-body font-bold text-primary hover:text-ink md:block"
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
          class="mt-xl inline-block text-body font-bold text-primary hover:text-ink md:hidden"
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
            <span class="font-bold text-primary">+400 centres partenaires</span>
            dans
            <span class="font-bold text-primary">96 départements</span>
            — en centre, sur votre site ou en intra-entreprise.
          </p>
        </div>
        <NuxtLink
          to="/centres"
          class="whitespace-nowrap text-body font-bold text-primary hover:text-ink"
        >
          Explorer la carte des centres →
        </NuxtLink>
      </div>

      <div class="mt-xl grid gap-grid lg:grid-cols-3">
        <div
          class="lg:col-span-2 flex aspect-2/1 items-center justify-center rounded-md border border-dashed border-outline bg-surface text-center text-meta text-ink-muted px-md"
        >
          Carte de France interactive<br />départements + pins centres — lisible, pas un outil SIG
        </div>

        <div class="flex flex-col gap-md lg:col-span-1">
          <SearchInput
            v-model="mapSearch"
            input-id="map-search"
            sr-label="Rechercher une ville, code postal ou département"
            placeholder="Ville, code postal ou département"
          >
            <template #icon>
              <IconSearch :size="20" class="shrink-0 text-primary" />
            </template>
          </SearchInput>

          <CenterCard
            v-for="centre in centres"
            :key="centre.name"
            :name="centre.name"
            :distance="centre.distance"
            :formations="centre.formations"
            :tags="centre.tags"
          />
        </div>
      </div>
    </section>

    <!-- Confier -->
    <section id="confier" class="bg-primary-muted py-section text-ink-inverse">
      <div class="mx-auto max-w-container px-gutter-mobile md:px-gutter">
        <p class="text-h4 font-bold uppercase text-accent">Confier mes formations</p>

        <div class="mt-sm flex flex-col gap-md lg:flex-row lg:items-baseline lg:justify-between">
          <h2 class="max-w-prose font-display text-h2 font-extrabold">
            Un interlocuteur unique orchestre votre plan de formation
          </h2>
          <p class="max-w-(--layout-callout-max) text-body text-ink-inverse/65">
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
            :image-sub="card.imageSub"
          />
        </div>

        <div class="mt-2xl flex flex-wrap gap-md">
          <NuxtLink
            to="/"
            class="rounded-full bg-accent px-lg py-md text-button text-ink hover:bg-accent-text transition"
          >
            Confier mes formations
          </NuxtLink>
          <NuxtLink
            to="/"
            class="rounded-full border border-outline-inverse px-lg py-md text-button text-ink-inverse hover:bg-ink-inverse/10 transition"
          >
            Parler à un conseiller
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Stats -->
    <section class="border-b border-rule bg-surface">
      <div
        class="mx-auto grid max-w-container grid-cols-2 gap-xl px-gutter-mobile md:px-gutter py-section md:grid-cols-4"
      >
        <StatItem
          v-for="stat in stats"
          :key="stat.label"
          :value="stat.value"
          :unit="stat.unit"
          :label="stat.label"
          class="border-b border-rule md:border-b-0 md:border-r last:border-r-0 md:last:border-r-0"
        />
      </div>
    </section>

    <!-- Testimonials -->
    <section class="mx-auto max-w-container px-gutter-mobile md:px-gutter py-section">
      <div class="flex flex-wrap items-end justify-between gap-sm">
        <h2 class="font-display text-h2 font-extrabold text-ink">
          Ce qu'en disent les entreprises
          <span class="ml-sm text-small font-medium text-ink-muted">4,7/5 · 312 avis Google</span>
        </h2>
        <NuxtLink to="/" class="text-small font-bold text-primary hover:text-ink"
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
            class="whitespace-nowrap text-small font-bold text-primary hover:text-ink"
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
            :excerpt="article.excerpt"
            :image-label="article.imageLabel"
          />
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

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

const mapSearch = ref('')

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
  {
    number: 1,
    title: 'Décrivez votre besoin',
    body: 'en une phrase, avec vos mots',
    maxWidth: 'max-w-44'
  },
  {
    number: 2,
    title: 'Recevez la solution',
    body: 'formation, centre et dates identifiés près de vos équipes',
    maxWidth: 'max-w-56'
  },
  {
    number: 3,
    title: 'Validez la session',
    body: 'demande envoyée, prise en charge sécurisée',
    maxWidth: 'max-w-48'
  },
  {
    number: 4,
    title: 'Formez vos équipes',
    body: "accompagnement jusqu'aux attestations",
    maxWidth: 'max-w-48'
  }
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
    tags: ['Sessions cette semaine', 'Intra sur site']
  },
  {
    name: 'Centre de Villeneuve-le-Roi',
    distance: 'à 14 km',
    formations: 'Travaux en hauteur · Échafaudages · PEMP',
    tags: ['▲ Prochaine session le 14/09']
  }
]

const confierCards = [
  {
    tag: 'Conseil',
    title: 'Qualifier le besoin réglementaire',
    body: "Diagnostic des obligations et des recyclages à échéance, même à partir d'une demande imprécise.",
    imageLabel: 'Photo terrain à fournir',
    imageSub: 'chantier BTP — casque & harnais'
  },
  {
    tag: 'Externalisation',
    title: "Déléguer l'exécution du plan",
    body: 'Sessions programmées, convocations envoyées, attestations suivies, budget consolidé.',
    imageLabel: 'Photo terrain à fournir',
    imageSub: 'entrepôt logistique — cariste en formation'
  },
  {
    tag: 'Multi-sites',
    title: 'Piloter la conformité partout',
    body: 'Reporting site par site, alertes avant expiration, un seul point de contact national.',
    imageLabel: 'Photo terrain à fournir',
    imageSub: 'formateur en situation avec équipe RH'
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
    date: '28 août 2026 · 4 min',
    excerpt:
      'Calendrier de recyclage et points de vigilance pour garder vos équipes en conformité.',
    imageLabel: 'Visuel article à fournir'
  },
  {
    category: 'Conformité',
    title: 'Habilitations électriques : quelles obligations pour vos sous-traitants ?',
    date: '21 août 2026 · 6 min',
    excerpt: 'Ce que dit la norme NF C18-510 et comment organiser le suivi des habilitations.',
    imageLabel: 'Visuel article à fournir'
  },
  {
    category: 'Financement',
    title: 'OPCO : optimiser la prise en charge de votre plan de formation',
    date: '12 août 2026 · 5 min',
    excerpt: 'Les leviers de financement mobilisables et les délais à respecter.',
    imageLabel: 'Visuel article à fournir'
  }
]
</script>
