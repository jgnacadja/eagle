<template>
  <div class="bg-paper">
    <!-- Intro + stats -->
    <section class="bg-surface">
      <div class="mx-auto px-gutter-mobile py-xl md:px-gutter md:py-4xl">
        <h1 class="font-display text-2xl font-extrabold text-ink leading-tight sm:text-h1">
          <span class="sm:hidden">Les entreprises qui forment<br />avec le réseau</span>
          <span class="hidden sm:inline">Les entreprises qui forment avec<br />le réseau</span>
        </h1>

        <p
          class="mt-sm md:mt-md max-w-prose text-small md:text-lead text-ink-muted leading-relaxed"
        >
          Des PME aux groupes multi-sites, les entreprises confient au réseau
          <span class="hidden md:inline"
            >LEARN UP ACADEMY la formation réglementaire de leurs équipes — en centre, sur leur site
            ou en intra-entreprise,</span
          >
          <span class="md:hidden">la formation réglementaire de leurs équipes,</span> partout en
          France.
        </p>

        <!-- Stats mobile (pleine largeur 3 colonnes) -->
        <div class="mt-lg grid grid-cols-3 divide-x divide-rule md:hidden">
          <StatItem
            value="+250"
            label="formations"
            size="sm"
            class="pr-2 [&_p:first-child]:text-xl [&_p:last-child]:text-[11px]"
          />
          <StatItem
            value="France entière"
            label="couverte par le réseau"
            size="sm"
            class="px-2 [&_p:first-child]:text-sm [&_p:last-child]:text-[11px]"
          />
          <StatItem
            value="312"
            label="sessions ouvertes"
            size="sm"
            class="pl-2 [&_p:first-child]:text-xl [&_p:last-child]:text-[11px]"
          />
        </div>

        <!-- Stats desktop (inline non-full) -->
        <div class="mt-xl hidden md:flex flex-wrap gap-y-6">
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
      <section class="py-8 md:py-section" aria-labelledby="certificateurs-title">
        <h2
          id="certificateurs-title"
          class="font-display text-xl sm:text-h2 font-extrabold text-ink"
        >
          Ils confient leurs formations au réseau
        </h2>

        <div class="mt-lg grid grid-cols-3 gap-2 sm:gap-grid md:grid-cols-6">
          <div
            v-for="company in techCompanyLogos"
            :key="company.name"
            class="flex h-16 sm:h-24 items-center justify-center rounded-xl border border-rule px-3 sm:px-md bg-surface"
          >
            <img
              :src="company.logoUrl"
              :alt="company.name"
              class="max-h-7 sm:max-h-9 max-w-[80%] object-contain"
              loading="lazy"
            />
          </div>
        </div>
        <p class="mt-sm text-xs sm:text-meta text-ink-muted">
          Références publiées avec l'accord des entreprises concernées.
        </p>
      </section>

      <!-- Secteurs réglementaires -->
      <section class="pb-8 md:pb-section" aria-labelledby="secteurs-title">
        <h2 id="secteurs-title" class="font-display text-xl sm:text-h2 font-extrabold text-ink">
          Des secteurs soumis à obligations réglementaires
        </h2>

        <div class="mt-lg md:mt-xl grid grid-cols-1 gap-3 md:gap-md md:grid-cols-2 lg:grid-cols-3">
          <article
            v-for="(sector, idx) in sectors"
            :key="sector.title"
            class="flex-col justify-center rounded-2xl bg-surface p-4 sm:p-6"
            :class="idx >= 4 ? 'hidden md:flex' : 'flex'"
          >
            <h3 class="font-display text-small sm:text-base font-bold text-ink">
              {{ sector.title }}
            </h3>
            <p class="mt-1 sm:mt-xs text-xs sm:text-small text-ink-muted leading-relaxed">
              {{ sector.body }}
            </p>
          </article>

          <article
            class="hidden md:flex flex-col justify-between gap-md rounded-2xl bg-navy-deep p-6 text-ink-inverse sm:flex-row sm:items-center md:col-span-2 lg:col-span-2"
          >
            <div class="flex-1">
              <h3 class="font-display text-base font-bold text-ink-inverse">
                Votre secteur n'est pas listé ?
              </h3>
              <p class="mt-xs text-small text-ink-inverse-muted leading-relaxed">
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
          class="mt-md inline-flex items-center gap-1 text-small font-bold text-ink transition-colors hover:text-primary md:hidden"
        >
          Voir le catalogue complet <span class="link-arrow">→</span>
        </NuxtLink>
      </section>

      <!-- De la PME au groupe multi-sites -->
      <section class="pb-8 md:pb-section" aria-labelledby="segments-title">
        <h2 id="segments-title" class="font-display text-xl sm:text-h2 font-extrabold text-ink">
          De la PME au groupe multi-sites
        </h2>

        <div class="mt-lg md:mt-xl grid grid-cols-1 gap-3 md:gap-md md:grid-cols-3">
          <article
            v-for="segment in segments"
            :key="segment.title"
            class="flex flex-col justify-between rounded-2xl border border-rule bg-surface p-4 sm:p-6"
          >
            <div>
              <p class="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-accent-text">
                {{ segment.tag }}
              </p>
              <h3 class="mt-1 sm:mt-sm font-display text-small sm:text-base font-bold text-ink">
                {{ segment.title }}
              </h3>
              <p class="mt-1 sm:mt-xs text-xs sm:text-small text-ink-muted leading-relaxed">
                {{ segment.body }}
              </p>
            </div>
          </article>
        </div>
      </section>

      <!-- Ce que les entreprises trouvent dans le réseau -->
      <section class="pb-8 md:pb-section" aria-labelledby="benefices-title">
        <h2 id="benefices-title" class="font-display text-xl sm:text-h2 font-extrabold text-ink">
          Ce que les entreprises <span class="hidden md:inline">trouvent dans le réseau</span
          ><span class="md:hidden">y trouvent</span>
        </h2>

        <div class="mt-lg md:mt-xl grid grid-cols-1 gap-3 md:gap-md md:grid-cols-2">
          <div
            v-for="benefit in networkBenefits"
            :key="benefit.title"
            class="flex items-center gap-3 sm:gap-md rounded-xl sm:rounded-2xl bg-surface p-3.5 sm:p-6"
          >
            <div
              class="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full bg-success-soft text-success"
            >
              <IconCheck :size="16" class="sm:hidden" />
              <IconCheck :size="18" class="hidden sm:block" />
            </div>
            <div>
              <h3 class="font-display text-badge sm:text-base font-bold text-ink">
                <span class="">{{ benefit.title }}</span>
              </h3>
              <p
                v-if="benefit.body"
                class="hidden md:block mt-xs text-small text-ink-muted leading-relaxed"
              >
                {{ benefit.body }}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- CTA -->
    <section class="bg-surface py-8 md:py-section">
      <div class="mx-auto px-gutter-mobile md:px-gutter">
        <div class="flex flex-col gap-lg text-left md:flex-row md:items-center md:justify-between">
          <div>
            <h2 class="font-display text-xl sm:text-h2 font-extrabold text-ink">
              Un besoin de formation ?
            </h2>
            <p class="mt-xs text-xs sm:text-small text-ink-muted">
              Le catalogue couvre les formations réglementaires ; un conseiller peut orienter votre
              recherche.
            </p>
          </div>
          <div class="flex shrink-0 flex-col gap-3 w-full sm:w-auto sm:flex-row sm:items-center">
            <Button
              as-child
              size="pill"
              class="w-full sm:w-auto font-bold bg-navy-deep text-ink-inverse hover:bg-primary"
            >
              <NuxtLink to="/formations">Parcourir le catalogue</NuxtLink>
            </Button>
            <Button
              as-child
              variant="outline"
              size="pill"
              class="w-full sm:w-auto font-bold bg-paper text-primary border-primary/30 hover:border-primary hover:text-accent-text"
            >
              <NuxtLink to="/centres/demande-de-formation?sujet=conseiller">
                Être guidé dans mon choix
              </NuxtLink>
            </Button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import IconCheck from '~/components/icons/IconCheck.vue'

definePageMeta({
  layout: 'with-breadcrumb',
  layoutProps: {
    color: 'bg-surface'
  },
  breadcrumb: [
    { label: 'Accueil', to: '/' },
    { label: 'Entreprises', to: '/entreprises' },
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
</script>
