<template>
  <div class="bg-paper">
    <!-- Intro + stats -->
    <section class="bg-surface">
      <div class="mx-auto px-gutter-mobile py-xl md:px-gutter md:py-4xl">
        <h1 class="font-display font-extrabold text-ink text-h2 sm:text-h1">
          <span class="sm:hidden" aria-hidden="true"
            >Les entreprises qui forment<br />avec le réseau</span
          >
          <span class="hidden sm:inline">Les entreprises qui forment avec<br />le réseau</span>
        </h1>

        <p class="mt-sm md:mt-md max-w-prose text-small md:text-lead text-ink-muted">
          Des PME aux groupes multi-sites, les entreprises confient au réseau
          <span class="hidden md:inline"
            >LEARN UP ACADEMY la formation réglementaire de leurs équipes — en centre, sur leur site
            ou en intra-entreprise,</span
          >
          <span class="md:hidden" aria-hidden="true"
            >la formation réglementaire de leurs équipes,</span
          >
          partout en France.
        </p>

        <!-- Stats mobile (pleine largeur 3 colonnes) -->
        <div class="mt-lg grid grid-cols-3 divide-x divide-rule md:hidden" aria-hidden="true">
          <StatItem
            value="+250"
            label="formations"
            size="sm"
            class="pr-sm [&_p:first-child]:text-h3 [&_p:last-child]:text-meta"
          />
          <StatItem
            value="France entière"
            label="couverte par le réseau"
            size="sm"
            class="px-sm [&_p:first-child]:text-small [&_p:last-child]:text-meta"
          />
          <StatItem
            value="312"
            label="sessions ouvertes"
            size="sm"
            class="pl-sm [&_p:first-child]:text-h3 [&_p:last-child]:text-meta"
          />
        </div>

        <!-- Stats desktop (inline non-full) -->
        <div class="mt-xl hidden md:flex flex-wrap gap-y-lg">
          <StatItem
            value="+250"
            label="formations au catalogue"
            size="sm"
            class="pr-lg whitespace-nowrap"
          />
          <StatItem
            value="France entière"
            label="couverte par le réseau national"
            size="sm"
            class="border-l border-rule px-lg"
          />
          <StatItem
            value="312"
            label="sessions ouvertes"
            size="sm"
            class="border-l border-rule pl-lg"
          />
        </div>
      </div>
    </section>

    <div class="mx-auto px-gutter-mobile md:px-gutter">
      <!-- Certificateurs -->
      <section class="py-xl md:py-section" aria-labelledby="certificateurs-title">
        <h2
          id="certificateurs-title"
          class="font-display text-h3 font-extrabold text-ink md:text-h2"
        >
          Ils confient leurs formations au réseau
        </h2>

        <ClientLogoWall variant="grid" />
        <p class="mt-md text-meta text-ink-subtle">
          Références publiées avec l'accord des entreprises concernées.
        </p>
      </section>

      <!-- Secteurs réglementaires -->
      <section class="pb-xl md:pb-section" aria-labelledby="secteurs-title">
        <h2 id="secteurs-title" class="font-display text-h3 font-extrabold text-ink md:text-h2">
          Des secteurs soumis à obligations réglementaires
        </h2>

        <div class="mt-lg md:mt-xl grid grid-cols-1 gap-grid md:grid-cols-2 lg:grid-cols-3">
          <article
            v-for="(sector, idx) in sectors"
            :key="sector.title"
            v-reveal="revealStagger(idx)"
            class="flex flex-col justify-center rounded-md border border-rule bg-surface p-md shadow-sm transition-all hover:border-primary/40 hover:shadow-md sm:p-lg"
            :class="idx >= 4 ? 'hidden md:flex' : 'flex'"
          >
            <h3 class="font-display text-small font-bold text-ink sm:text-h4">
              {{ sector.title }}
            </h3>
            <p class="mt-xs text-small text-ink-muted">
              {{ sector.body }}
            </p>
          </article>

          <article
            v-reveal="revealStagger(sectors.length)"
            class="hidden md:flex flex-col justify-between gap-md rounded-md bg-navy-deep p-lg text-ink-inverse shadow-sm sm:flex-row sm:items-center md:col-span-2 lg:col-span-2"
          >
            <div class="flex-1">
              <h3 class="font-display text-h4 font-bold text-ink-inverse">
                Votre secteur n'est pas listé ?
              </h3>
              <p class="mt-xs text-small text-ink-inverse-muted">
                Le catalogue complet couvre l'ensemble des formations réglementaires, tous secteurs
                confondus.
              </p>
            </div>
            <Button
              as-child
              variant="paper"
              size="pill"
              class="shrink-0 self-start font-bold sm:self-center"
            >
              <NuxtLink to="/formations">Voir le catalogue complet</NuxtLink>
            </Button>
          </article>
        </div>

        <NuxtLink
          to="/formations"
          class="mt-md inline-flex items-center gap-xs text-small font-bold text-ink transition-colors hover:text-primary md:hidden"
        >
          Voir le catalogue complet <span class="link-arrow">→</span>
        </NuxtLink>
      </section>

      <!-- De la PME au groupe multi-sites -->
      <section class="pb-xl md:pb-section" aria-labelledby="segments-title">
        <h2 id="segments-title" class="font-display text-h3 font-extrabold text-ink md:text-h2">
          De la PME au groupe multi-sites
        </h2>

        <div class="mt-lg md:mt-xl grid grid-cols-1 gap-grid md:grid-cols-3">
          <article
            v-for="(segment, idx) in segments"
            :key="segment.title"
            v-reveal="revealStagger(idx)"
            class="flex flex-col justify-between rounded-md border border-rule bg-surface p-md shadow-sm transition-all hover:border-primary/40 hover:shadow-md sm:p-lg"
          >
            <div>
              <p class="text-overline uppercase text-accent-text">
                {{ segment.tag }}
              </p>
              <h3 class="mt-xs font-display text-small font-bold text-ink sm:mt-sm sm:text-h4">
                {{ segment.title }}
              </h3>
              <p class="mt-xs text-small text-ink-muted">
                {{ segment.body }}
              </p>
            </div>
          </article>
        </div>
      </section>

      <!-- Ce que les entreprises trouvent dans le réseau -->
      <section class="pb-xl md:pb-section" aria-labelledby="benefices-title">
        <h2 id="benefices-title" class="font-display text-h3 font-extrabold text-ink md:text-h2">
          Ce que les entreprises <span class="hidden md:inline">trouvent dans le réseau</span
          ><span class="md:hidden" aria-hidden="true">y trouvent</span>
        </h2>

        <div class="mt-lg md:mt-xl grid grid-cols-1 gap-grid md:grid-cols-2">
          <div
            v-for="(benefit, idx) in networkBenefits"
            :key="benefit.title"
            v-reveal="revealStagger(idx)"
            class="flex items-center gap-md rounded-md border border-rule bg-surface p-md shadow-sm transition-all hover:border-primary/40 hover:shadow-md sm:p-lg"
          >
            <div
              aria-hidden="true"
              class="flex h-control-sm w-control-sm shrink-0 items-center justify-center rounded-full bg-success-soft text-success"
            >
              <IconCheck :size="16" class="sm:hidden" />
              <IconCheck :size="18" class="hidden sm:block" />
            </div>
            <div>
              <h3 class="font-display text-small font-bold text-ink sm:text-h4">
                <span>{{ benefit.title }}</span>
              </h3>
              <p class="hidden md:block mt-xs text-small text-ink-muted">{{ benefit.body }}</p>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- CTA -->
    <section class="bg-surface py-xl md:py-section">
      <div class="mx-auto px-gutter-mobile md:px-gutter">
        <div class="flex flex-col gap-lg text-left md:flex-row md:items-center md:justify-between">
          <div>
            <h2 class="font-display text-h3 font-extrabold text-ink md:text-h2">
              Un besoin de formation ?
            </h2>
            <p class="mt-xs text-small text-ink-muted">
              Le catalogue couvre les formations réglementaires ; un conseiller peut orienter votre
              recherche.
            </p>
          </div>
          <div class="flex shrink-0 flex-col gap-sm w-full sm:w-auto sm:flex-row sm:items-center">
            <Button as-child variant="dark" size="pill" class="w-full sm:w-auto">
              <NuxtLink to="/formations">Parcourir le catalogue</NuxtLink>
            </Button>
            <Button as-child variant="outline" size="pill" class="w-full sm:w-auto">
              <NuxtLink to="/parler-a-votre-conseiller"> Être guidé dans mon choix </NuxtLink>
            </Button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import IconCheck from '~/components/icons/IconCheck.vue'
import { revealStagger } from '~/utils/reveal'

definePageMeta({
  layout: 'with-breadcrumb',
  layoutProps: {
    color: 'bg-surface'
  },
  breadcrumb: [
    { label: 'Accueil', to: '/' },
    { label: 'Entreprises', to: '/entreprise' },
    { label: "Le réseau d'entreprises clientes" }
  ]
})

useContentSeo(
  {
    seo_title: 'Les entreprises qui forment avec le réseau — LEARN UP ACADEMY',
    seo_description:
      'Des PME aux groupes multi-sites, les entreprises confient au réseau LEARN UP ACADEMY la formation réglementaire de leurs équipes — en centre, sur leur site ou en intra-entreprise, partout en France.'
  },
  'Les entreprises qui forment avec le réseau — LEARN UP ACADEMY'
)

const sectors = [
  {
    title: 'BTP & construction',
    body: 'CACES engins de chantier, travail en hauteur, échafaudages.'
  },
  {
    title: 'Travail temporaire',
    body: 'CACES, habilitations et recyclages des intérimaires — gestion multi-agences.'
  },
  {
    title: 'Industrie & énergie',
    body: 'Habilitations électriques, consignation, sécurité des interventions.'
  },
  {
    title: 'Collectivités & services techniques',
    body: "Conduite d'engins, habilitations, prévention des risques."
  },
  {
    title: 'Grande distribution',
    body: 'Manutention, chariots en entrepôt et surface de vente.'
  },
  {
    title: 'Tertiaire & immobilier',
    body: 'Sécurité incendie, habilitations pour la maintenance des bâtiments.'
  },
  {
    title: 'Transport & logistique',
    body: 'CACES chariots et engins de manutention, gerbeurs, ponts roulants.'
  }
]

const segments = [
  {
    tag: 'PME & ARTISANS',
    title: 'Un centre à proximité',
    body: 'Quelques salariés à former : inscription sur les sessions planifiées du centre le plus proche.'
  },
  {
    tag: 'ENTREPRISES MULTI-SITES',
    title: 'Un interlocuteur, plusieurs territoires',
    body: 'Chaque site est servi par les centres de son territoire ; les inscriptions et échéances sont suivies de façon consolidée.'
  },
  {
    tag: 'GRANDS COMPTES',
    title: 'Des besoins récurrents planifiés',
    body: 'Campagnes de recyclage, sessions intra dédiées et planification annuelle des obligations réglementaires.'
  }
]

const networkBenefits = [
  {
    title: 'Une réponse locale partout en France',
    body: 'Les demandes sont prises en charge par les centres du territoire concerné.'
  },
  {
    title: 'Des sessions réelles, publiées en temps réel',
    body: 'Les dates et places affichées correspondent aux sessions effectivement programmées.'
  },
  {
    title: 'Un interlocuteur unique',
    body: 'De la demande aux attestations, la relation est assurée sous la marque LEARN UP ACADEMY.'
  },
  {
    title: 'Le suivi des échéances réglementaires',
    body: 'Recyclages et renouvellements suivis dans le temps, site par site.'
  }
]
</script>
