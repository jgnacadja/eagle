<template>
  <div class="bg-paper">
    <section class="relative isolate overflow-hidden bg-primary-dark text-ink-inverse">
      <div
        class="pointer-events-none absolute -right-24 -top-32 h-96 w-96 rounded-full bg-primary-muted/60"
      />
      <div
        class="pointer-events-none absolute -bottom-48 -left-24 h-96 w-96 rounded-full bg-primary-muted/40"
      />

      <div class="relative mx-auto px-gutter-mobile py-4xl md:px-gutter md:py-4xl">
        <div class="max-w-prose">
          <span
            class="inline-block rounded-full border border-outline-inverse px-lg py-sm text-overline font-bold uppercase text-ink-inverse-muted"
          >
            Réseau LEARN UP ACADEMY
          </span>
          <h1 class="mt-xl font-display text-h2 font-extrabold leading-tight md:text-hero">
            Un réseau national de centres de formation,
            <span class="text-accent"> porté par la demande</span>.
          </h1>
          <p class="mt-lg max-w-prose text-lead text-ink-inverse-muted">
            LEARN UP réunit des centres de formation sous une marque commune : un catalogue
            mutualisé, un moteur de recherche qui qualifie les besoins des entreprises, et des
            demandes transmises aux centres du réseau.
          </p>
          <div class="mt-xl flex flex-wrap gap-md">
            <Button as-child variant="accent" size="pill-lg" class="w-full sm:w-auto">
              <NuxtLink to="#candidater">Candidater</NuxtLink>
            </Button>

            <Button as-child variant="outline-inverse" size="pill-lg" class="w-full sm:w-auto">
              <NuxtLink to="#modele">Découvrir le modèle</NuxtLink>
            </Button>
          </div>
        </div>
      </div>
    </section>

    <div class="mx-auto px-gutter-mobile py-section md:px-gutter md:py-4xl">
      <section aria-labelledby="options-title">
        <h2 id="options-title" class="font-display text-h2 font-extrabold text-ink">
          Trois façons de rejoindre le réseau
        </h2>
        <div class="mt-xl grid gap-grid md:grid-cols-3">
          <article
            v-for="option in joinOptions"
            :key="option.title"
            class="group flex flex-col rounded-md border border-rule bg-paper p-lg shadow-sm transition-shadow hover:border-primary hover:shadow-md"
          >
            <div
              class="flex h-control w-control items-center justify-center rounded-sm bg-primary-soft text-primary transition-colors group-hover:bg-primary group-hover:text-accent-text"
            >
              <component :is="option.icon" :size="22" />
            </div>
            <h3 class="mt-lg font-display text-h3 font-extrabold text-ink">{{ option.title }}</h3>
            <p class="mt-sm flex-1 text-body text-ink-muted">{{ option.body }}</p>
            <NuxtLink
              :to="option.to"
              class="mt-lg text-small font-bold text-primary underline underline-offset-4 transition-colors hover:text-accent-text"
            >
              {{ option.cta }} <span class="link-arrow">→</span>
            </NuxtLink>
          </article>
        </div>
      </section>

      <!-- Benefits -->
      <Benefits id="modele" title="Ce que le réseau apporte" :benefits="benefits" />

      <section id="candidater" class="mt-4xl" aria-labelledby="process-title">
        <h2 id="process-title" class="md:text-center font-display text-h2 font-extrabold text-ink">
          De la candidature à l'ouverture
        </h2>

        <ProcessSteps :steps="steps" last-step-variant="accent" title-size="h4" class="mt-2xl" />

        <div
          class="mt-2xl flex flex-col items-center justify-between gap-lg border-t border-rule pt-xl text-center md:flex-row md:text-left md:px-20"
        >
          <p class="text-small text-ink-muted">
            Prérequis : expérience de la formation professionnelle ou de la direction
            d'établissement · démarche qualité · ancrage local.
          </p>
          <Button as-child variant="accent" size="pill-lg" class="w-full shrink-0 md:w-auto">
            <NuxtLink to="/centres/demande-de-formation?sujet=franchise">Candidater</NuxtLink>
          </Button>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import IconAward from '~/components/icons/IconAward.vue'
import IconBook from '~/components/icons/IconBook.vue'
import IconBuilding from '~/components/icons/IconBuilding.vue'

useContentSeo(
  {
    seo_title: 'Rejoindre le réseau — LEARN UP ACADEMY',
    seo_description:
      'Découvrez les différentes façons de rejoindre le réseau national de centres de formation LEARN UP ACADEMY.'
  },
  'Rejoindre le réseau — LEARN UP ACADEMY'
)

const joinOptions = [
  {
    icon: IconBuilding,
    title: 'Ouvrir un centre LEARN UP ACADEMY',
    body: "Je suis un candidat à la franchise dynamique et rigoureux, fort d'une expérience confirmée en gestion de centre de profit et en management d'équipe.",
    cta: 'Candidater pour un centre',
    to: '/centres/demande-de-formation?sujet=franchise'
  },
  {
    icon: IconBook,
    title: 'Référencer mon organisme',
    body: 'Votre organisme de formation conserve son identité juridique et reçoit des demandes du réseau sur son territoire et ses domaines.',
    cta: 'Référencer mon organisme',
    to: '/referencer-mon-organisme'
  },
  {
    icon: IconAward,
    title: 'Intervenir comme formateur',
    body: 'Formateurs indépendants certifiés : intervenez pour les centres du réseau, sur vos domaines et votre zone géographique.',
    cta: 'Proposer mes interventions',
    to: '/centres/demande-de-formation?sujet=formateur'
  }
]

const benefits = [
  {
    label: 'Demandes',
    title: 'Des besoins qualifiés, transmis aux centres',
    body: 'Le catalogue et la recherche assistée qualifient le besoin avant transmission : formation, effectif, lieu et échéance.'
  },
  {
    label: 'Marque',
    title: 'Une visibilité nationale mutualisée',
    body: 'Catalogue commun, pages centre référencées, actualités du réseau : chaque centre bénéficie de la présence de la marque.'
  },
  {
    label: 'Outils',
    title: 'La gestion des sessions et des demandes',
    body: 'Publication des sessions, disponibilités en temps réel et suivi des demandes : un outillage commun au réseau.'
  },
  {
    label: 'Accompagnement',
    title: "De la candidature à l'ouverture, puis au quotidien",
    body: 'Étude du territoire, démarche qualité (Qualiopi), animation du réseau et support continu.'
  }
]

const steps = [
  { title: 'Candidature', body: 'Vous décrivez votre projet et votre territoire.' },
  { title: 'Échange et étude', body: 'Entretien, étude du territoire et du potentiel local.' },
  { title: 'Convention', body: "Cadre contractuel et plan d'ouverture partagé." },
  { title: 'Ouverture', body: 'Formation aux outils, lancement, accompagnement continu.' }
]
</script>
