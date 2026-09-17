<template>
  <div class="bg-paper">
    <section class="relative isolate overflow-hidden bg-primary-dark text-ink-inverse">
      <div
        aria-hidden="true"
        class="pointer-events-none absolute -right-24 -top-32 h-96 w-96 rounded-full bg-primary-muted/60"
      />
      <div
        aria-hidden="true"
        class="pointer-events-none absolute -bottom-48 -left-24 h-96 w-96 rounded-full bg-primary-muted/40"
      />

      <div class="relative mx-auto px-gutter-mobile py-4xl md:px-gutter">
        <div class="max-w-prose">
          <span
            class="inline-block rounded-full border border-outline-inverse px-lg py-sm text-overline font-bold uppercase text-ink-inverse-muted"
          >
            ORGANISME PARTENAIRE
          </span>
          <h1 class="mt-xl font-display text-h2 font-extrabold md:text-hero">
            Référencer vos centres,
            <span class="text-accent"> recevez des demandes qualifiées</span>.
          </h1>
          <p class="mt-lg max-w-prose text-lead text-ink-inverse-muted">
            Votre organisme de formation conserve son identité juridique et son fonctionnement. Le
            réseau LEARN UP ACADEMY qualifie les besoins des entreprises et transmet les demandes
            aux partenaires de leur territoire.
          </p>
          <div class="mt-xl flex flex-wrap gap-md">
            <Button as-child variant="accent" size="pill-lg" class="w-full sm:w-auto">
              <NuxtLink to="#candidater">Référencer mon organisme</NuxtLink>
            </Button>

            <Button as-child variant="outline-inverse" size="pill-lg" class="w-full sm:w-auto">
              <NuxtLink to="#modele">Comment fonctionne le réseau</NuxtLink>
            </Button>
          </div>
          <p class="mt-xl text-small text-ink-inverse-muted">
            La candidature se dépose sur la page Rejoindre le réseau — réponse sous 5 jours ouvrés.
          </p>
        </div>
      </div>
    </section>

    <div class="mx-auto px-gutter-mobile py-section md:px-gutter md:py-4xl">
      <section aria-labelledby="options-title">
        <h2 id="options-title" class="font-display text-h2 font-extrabold text-ink">
          Comment fonctionne le partenariat
        </h2>
        <ProcessSteps
          :steps="steps"
          last-step-variant="accent"
          title-size="h4"
          class="mt-2xl"
          max-width-class="md:max-w-3xs"
        />
      </section>

      <!-- Benefits -->
      <Benefits id="modele" title="Ce que le partenariat apporte" :benefits="benefits" />

      <section id="maillage" class="mt-4xl" aria-labelledby="maillage-title">
        <div class="flex flex-col md:flex-row gap-xl items-center">
          <!-- Colonne gauche -->
          <div class="w-80 md:w-96 shrink-0 pt-sm">
            <h2 id="maillage-title" class="text-h2 font-extrabold">
              Un maillage qui s'étend avec ses partenaires
            </h2>
            <p class="text-body text-ink-muted mt-md">
              Le référencement d'un organisme étend la couverture du réseau sur son territoire et
              ses domaines. Les demandes des entreprises sont transmises au plus près.
            </p>

            <div class="flex mt-lg">
              <div class="pr-lg">
                <div class="text-h2 font-extrabold">+400</div>
                <div class="text-meta mt-xs whitespace-nowrap">centres partenaires</div>
              </div>
              <div class="border-l px-md">
                <div class="text-h2 font-extrabold">96</div>
                <div class="text-meta mt-xs">départements couverts</div>
              </div>
              <div class="border-l pl-md">
                <div class="text-h2 font-extrabold">+250</div>
                <div class="text-meta mt-xs">formations au catalogue</div>
              </div>
            </div>
          </div>

          <!-- Carte -->
          <div class="flex-1 w-full h-96 rounded-2xl border border-rule overflow-hidden bg-surface">
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
              Carte de France interactive<br />départements couverts + centres du réseau
            </div>
          </div>
        </div>
      </section>
    </div>

    <div id="candidater" class="bg-primary text-ink-inverse p-2xl">
      <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-md">
        <div>
          <h3 class="text-h2 font-extrabold">Référencer votre organisme</h3>
          <p class="text-small text-ink-inverse-muted mt-xs">
            La candidature décrit vos centres, vos domaines et votre territoire. L'étude ne comporte
            aucun engagement.
          </p>
        </div>
        <Button as-child variant="accent" size="pill-lg" class="w-full shrink-0 md:w-auto">
          <NuxtLink to="/centres/demande-de-formation?sujet=organisme">
            Déposer une candidature</NuxtLink
          >
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Centre } from '@learnup/types'
import type { CenterResult } from '~/types/center-result'

useContentSeo(
  {
    seo_title: 'Référencer votre centre — LEARN UP ACADEMY',
    seo_description:
      'Référencer votre centre pour recevoir des demandes qualifiées sur le réseau LEARN UP ACADEMY.'
  },
  'Référencer votre centre — LEARN UP ACADEMY'
)

const benefits = [
  {
    label: 'Demandes',
    title: 'Des besoins qualifiés, sur votre périmètre',
    body: 'Le catalogue et la recherche assistée qualifient chaque besoin avant transmission, sur vos domaines et votre territoire.'
  },
  {
    label: 'Visibilité',
    title: 'Une présence dans le catalogue national',
    body: 'Pages centre référencées, familles de formations, actualités : vos centres bénéficient de la présence de la marque.'
  },
  {
    label: 'Indépendance',
    title: 'Votre structure reste la vôtre',
    body: 'Identité juridique, équipe et locaux conservés. Vous restez maître de vos plannings et de vos sessions.'
  },
  {
    label: 'Outils',
    title: 'La gestion des sessions et des demandes',
    body: 'Publication des sessions, disponibilités en temps réel, suivi des demandes : un outillage commun au réseau.'
  }
]

const steps = [
  {
    title: 'Référencement',
    body: 'Vos centres, vos domaines et votre territoire sont enregistrés dans le réseau.'
  },
  {
    title: 'Publication',
    body: 'Vos sessions rejoignent le catalogue commun et la carte des centres.'
  },
  {
    title: 'Demandes',
    body: 'Les besoins qualifiés (formation, effectif, lieu, échéance) vous sont transmis.'
  }
]

const centresData = await useDirectusList<Centre>('centres', 'organisme-map-centres', {
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
