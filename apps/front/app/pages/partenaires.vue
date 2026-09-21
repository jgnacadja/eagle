<template>
  <div class="bg-paper">
    <!-- Intro + stats -->
    <section class="bg-surface">
      <div class="mx-auto px-gutter-mobile py-2xl md:px-gutter md:py-4xl">
        <h1 class="mt-lg font-display text-h1 font-extrabold text-ink">
          Le réseau et ses partenaires
        </h1>

        <p class="mt-md max-w-prose text-lead text-ink-muted">
          LEARN UP ACADEMY réunit des centres de formation et des organismes partenaires sous une
          marque commune. Les formations sont assurées par les centres du réseau, en centre, sur
          site ou en intra-entreprise.
        </p>

        <div class="mt-xl flex">
          <StatItem
            value="+400"
            label="centres partenaires"
            size="sm"
            class="pr-lg whitespace-nowrap"
          />
          <StatItem value="96" label="départements couverts" size="sm" class="border-l px-md" />
          <StatItem value="+250" label="formations au catalogue" size="sm" class="border-l pl-md" />
        </div>
      </div>
    </section>

    <div class="mx-auto px-gutter-mobile md:px-gutter">
      <!-- Qui compose le réseau -->
      <section class="py-section" aria-labelledby="composition-title">
        <h2 id="composition-title" class="font-display text-h2 font-extrabold text-ink">
          Qui compose le réseau
        </h2>

        <div class="mt-xl grid gap-grid md:grid-cols-2">
          <article
            v-for="option in networkMembers"
            :key="option.title"
            class="group flex flex-col rounded-md border border-rule bg-paper p-lg shadow-sm transition-shadow hover:border-primary hover:shadow-md"
          >
            <div
              class="hidden md:flex h-control w-control items-center justify-center rounded-sm bg-primary-soft text-primary transition-colors group-hover:bg-primary group-hover:text-accent-text"
            >
              <component :is="option.icon" :size="22" />
            </div>
            <h3 class="md:mt-lg font-display text-h3 font-extrabold text-ink">
              {{ option.title }}
            </h3>
            <p class="mt-sm flex-1 text-body text-ink-muted">{{ option.body }}</p>
            <NuxtLink
              v-if="option.to"
              :to="option.to"
              class="mt-lg text-small font-bold text-primary underline underline-offset-4 transition-colors hover:text-accent-text"
            >
              {{ option.cta }} <span class="link-arrow">→</span>
            </NuxtLink>
            <p v-else class="mt-lg text-small text-ink-subtle">{{ option.note }}</p>
          </article>
        </div>
      </section>

      <!-- Engagements qualité -->
      <section class="pb-section" aria-labelledby="engagements-title">
        <h2 id="engagements-title" class="font-display text-h2 font-extrabold text-ink">
          Les engagements qualité du réseau
        </h2>
        <p class="mt-sm max-w-prose text-body text-ink-muted">
          Tous les centres du réseau, quel que soit leur mode d'entrée, appliquent le même cadre.
        </p>

        <div class="mt-xl grid gap-grid md:grid-cols-2">
          <div
            v-for="item in commitments"
            :key="item.title"
            class="flex gap-md rounded-md bg-surface p-lg"
          >
            <div
              class="flex h-control w-control shrink-0 items-center justify-center rounded-full bg-success-soft text-success"
            >
              <IconCheck :size="18" />
            </div>
            <div>
              <h3 class="text-sm font-bold text-ink">{{ item.title }}</h3>
              <p class="mt-xs text-small text-ink-muted">{{ item.body }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Certificateurs -->
      <section class="pb-section" aria-labelledby="certificateurs-title">
        <h2 id="certificateurs-title" class="font-display text-h2 font-extrabold text-ink">
          Certificateurs et organismes de référence
        </h2>
        <p class="mt-sm max-w-prose text-body text-ink-muted">
          Les formations du catalogue s'appuient sur les référentiels des certificateurs et
          organismes de branche. Chaque certification est détaillée sur la page de la formation
          concernée.
        </p>

        <div class="mt-xl grid grid-cols-2 gap-grid sm:grid-cols-3 md:grid-cols-5">
          <div
            v-for="logo in certifiers"
            :key="logo"
            class="flex h-24 items-center justify-center rounded-md border border-dashed border-rule px-md text-center text-meta text-ink-subtle"
          >
            {{ logo }}
          </div>
        </div>
      </section>

      <!-- Carte -->
      <section class="pb-section" aria-labelledby="carte-title">
        <div class="flex items-end justify-between">
          <h2 id="carte-title" class="font-display text-h2 font-extrabold text-ink">
            Un réseau présent partout en France
          </h2>
          <NuxtLink
            to="/centres"
            class="hidden text-sm font-bold text-primary transition-colors hover:text-accent-text md:block"
          >
            Explorer la carte des centres <span class="link-arrow">→</span>
          </NuxtLink>
        </div>

        <div class="mt-lg h-96 overflow-hidden rounded-md border border-rule bg-surface">
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

        <div class="mt-lg flex justify-center md:hidden">
          <NuxtLink
            to="/centres"
            class="text-small font-bold text-primary transition-colors hover:text-accent-text"
          >
            Explorer la carte des centres <span class="link-arrow">→</span>
          </NuxtLink>
        </div>
      </section>
    </div>
    <!-- CTA -->
    <section class="bg-surface py-section">
      <div class="mx-auto px-gutter-mobile md:px-gutter">
        <div class="flex flex-col gap-lg md:flex-row md:items-center md:justify-between">
          <div>
            <h2 class="font-display text-h2 font-extrabold text-ink">Un besoin de formation ?</h2>
            <p class="mt-xs text-body text-ink-muted">
              Le catalogue couvre les formations réglementaires ; un conseiller peut orienter votre
              recherche.
            </p>
          </div>
          <div class="flex shrink-0 flex-col gap-md sm:flex-row">
            <Button as-child size="pill-lg" class="w-full sm:w-auto">
              <NuxtLink to="/formations">Parcourir le catalogue</NuxtLink>
            </Button>
            <Button as-child variant="outline" size="pill-lg" class="w-full sm:w-auto">
              <NuxtLink to="/centres/demande-de-formation?sujet=conseiller">
                Être guidé dans mon choix
              </NuxtLink>
            </Button>
          </div>
        </div>

        <div class="mt-lg border-t border-rule pt-lg">
          <p class="text-small text-ink-muted">
            Vous êtes un organisme de formation ?
            <NuxtLink
              to="/rejoindre-le-reseau"
              class="font-bold text-primary underline underline-offset-4 transition-colors hover:text-accent-text"
            >
              Rejoindre le réseau
            </NuxtLink>
          </p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Centre } from '@learnup/types'
import type { CenterResult } from '~/types/center-result'
import IconBuilding from '~/components/icons/IconBuilding.vue'
import IconCheck from '~/components/icons/IconCheck.vue'

definePageMeta({
  layout: 'with-breadcrumb',
  layoutProps: {
    color: 'bg-paper-warm'
  }
})

useContentSeo(
  {
    seo_title: 'Le réseau et ses partenaires — LEARN UP ACADEMY',
    seo_description:
      'LEARN UP ACADEMY réunit des centres de formation et des organismes partenaires sous une marque commune, avec un cadre qualité commun à tout le réseau.'
  },
  'Le réseau et ses partenaires — LEARN UP ACADEMY'
)

const networkMembers = [
  {
    icon: IconBuilding,
    title: 'Des centres de formation partout en France',
    body: "Chaque centre dispose d'une page avec ses sessions, ses équipements et ses moyens d'accès. Les formations ont lieu en centre, sur site ou en intra-entreprise.",
    cta: 'Explorer la carte des centres',
    to: '/centres'
  },
  {
    icon: IconCheck,
    title: 'Des organismes de formation référencés',
    body: "Des organismes existants rejoignent le réseau après étude de leur dossier : certifications à jour, formateurs habilités, capacité d'accueil vérifiée. Ils interviennent sous la marque LEARN UP ACADEMY.",
    note: 'La liste des centres est consultable sur la carte du réseau.'
  }
]

const commitments = [
  {
    title: 'Certifications et habilitations à jour',
    body: 'Vérifiées au référencement, puis périodiquement pendant toute la présence dans le réseau.'
  },
  {
    title: 'Des formateurs habilités',
    body: 'Chaque session est animée par un formateur habilité sur le domaine enseigné.'
  },
  {
    title: 'Des sessions réelles, publiées en temps réel',
    body: 'Les dates et disponibilités affichées correspondent aux sessions effectivement programmées.'
  },
  {
    title: 'Un interlocuteur unique',
    body: 'De la demande au suivi, la relation est assurée sous la marque LEARN UP ACADEMY.'
  }
]

const certifiers = [
  'Logo certificateur\nà fournir',
  'Logo certificateur\nà fournir',
  'Logo organisme\nde branche',
  'Logo organisme\nde branche',
  'Label qualité\nà fournir'
]

// Même pattern que organisme.vue : liste des centres publiés pour la carte,
// fallback texte si vide.
const centresData = await useDirectusList<Centre>('centres', 'reseau-map-centres', {
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
