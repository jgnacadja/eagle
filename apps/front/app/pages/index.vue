<template>
  <div>
    <!-- Hero -->
    <section class="relative overflow-hidden bg-gradient-to-b from-paper to-surface">
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
          class="inline-block rounded-full border border-primary bg-paper px-4 py-2 text-h4 font-bold uppercase tracking-widest text-primary"
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

        <form class="mx-auto mt-xl w-full max-w-2xl">
          <div
            class="flex items-center gap-sm rounded-full border-2 border-primary bg-paper py-2.5 pl-6 pr-2.5 shadow-sm focus-within:ring-2 focus-within:ring-outline"
          >
            <svg class="h-5 w-5 shrink-0 text-accent" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 0l2.5 7.5L20 10l-7.5 2.5L10 20l-2.5-7.5L0 10l7.5-2.5L10 0z" />
            </svg>
            <label for="hero-search" class="sr-only">Rechercher une formation</label>
            <input
              id="hero-search"
              type="text"
              placeholder="« Je dois former 8 salariés au CACES près de Lyon avant septembre »"
              class="flex-1 bg-transparent font-sans text-lead leading-tight text-ink placeholder:text-ink-placeholder focus:outline-none"
            />
            <button
              type="submit"
              class="flex h-control w-control shrink-0 items-center justify-center rounded-full bg-primary text-paper transition hover:bg-primary-dark"
            >
              <svg
                class="h-5 w-5"
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
          class="absolute top-[calc(theme(spacing.control-sm)/2-0.5px)] left-0 right-0 z-0 mx-auto hidden h-px w-4/5 bg-rule-strong md:block"
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
  </div>
</template>

<script setup lang="ts">
useContentSeo({}, 'LEARN UP ACADEMY')

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
</script>
