<template>
  <div class="bg-paper">
    <!-- ═══════════════════════════════════════════════════
         1. HERO — Qui sommes-nous
    ════════════════════════════════════════════════════ -->
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
            v-hero="heroStagger(0)"
            class="inline-block rounded-full border border-primary/25 bg-paper px-md py-xs text-meta font-bold uppercase tracking-wider text-primary shadow-sm"
          >
            Qui sommes-nous
          </span>

          <h1
            v-hero="heroStagger(1)"
            class="mx-auto mt-lg max-w-prose font-display text-h2 font-extrabold text-ink md:text-hero"
          >
            Le conseil en formation, <span class="text-accent-text">au plus près</span
            ><br class="hidden md:block" />
            <span class="text-accent-text">&nbsp;du terrain.</span>
          </h1>

          <p v-hero="heroStagger(3)" class="mx-auto mt-sm text-ink-muted text-small max-w-prose">
            <span
              >Learn Up Academy est une plateforme de conseil et d'orientation en formation
              professionnelle. Nous comprenons votre besoin, localisons la bonne session dans un
              réseau national de centres, et organisons vos formations réglementaires — d'un
              interlocuteur unique.
            </span>
          </p>

          <!-- Boutons d'action -->
          <div
            v-hero="heroStagger(3)"
            class="mt-xl flex flex-col sm:flex-row items-center justify-center gap-md"
          >
            <Button as-child variant="dark" size="pill-lg" class="w-full sm:w-auto shadow-sm">
              <NuxtLink to="/parler-a-votre-conseiller">Parler à un conseiller</NuxtLink>
            </Button>
            <Button as-child variant="outline" size="pill-lg" class="w-full sm:w-auto shadow-xs">
              <NuxtLink to="#reseau">Découvrir le réseau</NuxtLink>
            </Button>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════
         2. CHIFFRES CLÉS (Cartes sur mobile, bandeau sur desktop)
    ════════════════════════════════════════════════════ -->
    <section class="border-y border-rule/60 bg-surface py-md lg:py-0">
      <div class="mx-auto px-gutter-mobile md:px-gutter">
        <ul
          class="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-0 lg:divide-x lg:divide-rule/70"
        >
          <li
            v-for="(benefit, i) in heroBenefits"
            :key="benefit.subtitle"
            v-reveal="revealStagger(i)"
            class="flex flex-col justify-center rounded-2xl border border-rule/50 bg-white p-4 shadow-xs lg:rounded-none lg:border-0 lg:border-r lg:border-rule/70 last:lg:border-r-0 lg:bg-transparent lg:p-0 lg:shadow-none lg:py-xl lg:px-8 first:lg:pl-0 last:lg:pr-0"
          >
            <!-- Titre ou indicateur dynamique -->
            <div class="flex h-8 items-center">
              <div v-if="benefit.isDynamic" class="flex items-center gap-2">
                <span class="inline-block h-1 w-14 rounded-full bg-ink" />
                <span class="text-meta font-extrabold uppercase tracking-wider text-accent-text">
                  DYN.
                </span>
              </div>
              <h2
                v-else
                class="font-display text-h4 font-extrabold leading-tight text-ink sm:text-h3 md:text-h2"
              >
                {{ benefit.title }}
              </h2>
            </div>

            <!-- Sous-titre (version courte sur mobile conforme au Figma, complète sur web) -->
            <p class="mt-1 text-meta text-ink-muted md:text-small">
              <span class="md:hidden">{{ benefit.subtitleMobile || benefit.subtitle }}</span>
              <span class="hidden md:inline">{{ benefit.subtitle }}</span>
            </p>
          </li>
        </ul>
      </div>
    </section>

    <div class="px-gutter-mobile md:px-gutter">
      <!-- ═══════════════════════════════════════════════════
           3. NOTRE MISSION (Ordre mobile : Titre -> Image -> Texte)
      ════════════════════════════════════════════════════ -->
      <section id="mission" class="py-xl md:py-section" aria-labelledby="mission-title">
        <!-- Version Mobile (< md) : Titre -> Image -> Texte -->
        <div class="md:hidden flex flex-col gap-lg">
          <div>
            <p class="text-overline font-extrabold uppercase tracking-wider text-accent-text">
              Notre mission
            </p>
            <h2 class="mt-xs font-display text-h2 font-extrabold leading-tight text-ink">
              Rendre la formation réglementaire simple à trouver, à organiser et à suivre
            </h2>
          </div>

          <div class="flex justify-center">
            <div
              class="relative w-full overflow-hidden rounded-2xl border border-rule bg-surface shadow-sm"
            >
              <img
                src="/images/formation1.webp"
                alt="Équipe Learn Up Academy en session de formation"
                class="h-56 sm:h-64 w-full rounded-xl object-cover shadow-md"
                loading="lazy"
              />
              <div
                class="absolute bottom-md left-md right-md rounded-xl border border-rule bg-paper/90 p-sm backdrop-blur-sm"
              >
                <p class="font-display text-small font-bold text-ink">
                  Une coordination nationale humaine
                </p>
                <p class="mt-0.5 text-meta text-ink-muted">
                  Des conseillers experts à vos côtés pour chaque étape réglementaire.
                </p>
              </div>
            </div>
          </div>

          <div>
            <p class="font-sans text-body text-ink-muted leading-relaxed">
              Les obligations de formation se multiplient, les conditions sont dispersées et les
              interlocuteurs nombreux. Nous centralisons la recherche, la qualification du besoin et
              la coordination des sessions, pour que les responsables formation, les dirigeants de
              TPE et les particuliers accèdent à la bonne formation, au bon endroit, au bon moment.
            </p>
            <p class="mt-md font-sans text-body text-ink-muted leading-relaxed">
              Nous ne sommes pas un organisme de plus : nous sommes le point d'entrée qui vous relie
              à un réseau de centres sélectionnés partout en France.
            </p>
          </div>
        </div>

        <!-- Version Desktop (>= md) : 2 colonnes avec Titre + Paragraphes groupés (zéro écart anormal) -->
        <div class="hidden md:grid md:grid-cols-2 md:gap-2xl md:items-center">
          <div v-reveal>
            <p class="text-overline font-extrabold uppercase tracking-wider text-accent-text">
              Notre mission
            </p>
            <h2
              id="mission-title"
              class="mt-xs font-display text-h2 font-extrabold leading-tight text-ink md:text-h2"
            >
              Rendre la formation réglementaire simple à trouver, à organiser et à suivre
            </h2>
            <p class="mt-md font-sans text-body text-ink-muted leading-relaxed">
              Les obligations de formation se multiplient, les conditions sont dispersées et les
              interlocuteurs nombreux. Nous centralisons la recherche, la qualification du besoin et
              la coordination des sessions, pour que les responsables formation, les dirigeants de
              TPE et les particuliers accèdent à la bonne formation, au bon endroit, au bon moment.
            </p>
            <p class="mt-md font-sans text-body text-ink-muted leading-relaxed">
              Nous ne sommes pas un organisme de plus : nous sommes le point d'entrée qui vous relie
              à un réseau de centres sélectionnés partout en France.
            </p>
          </div>

          <div v-reveal class="flex justify-center">
            <div
              class="relative w-full overflow-hidden rounded-2xl border border-rule bg-surface shadow-sm"
            >
              <img
                src="/images/formation1.webp"
                alt="Équipe Learn Up Academy en session de formation"
                class="h-72 lg:h-95 w-full rounded-xl object-cover shadow-md"
                loading="lazy"
              />
              <div
                class="absolute bottom-md left-md right-md rounded-xl border border-rule bg-paper/90 p-sm backdrop-blur-sm sm:bottom-lg sm:left-lg sm:right-lg sm:p-md"
              >
                <p class="font-display text-small font-bold text-ink">
                  Une coordination nationale humaine
                </p>
                <p class="mt-0.5 text-meta text-ink-muted">
                  Des conseillers experts à vos côtés pour chaque étape réglementaire.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- ═══════════════════════════════════════════════════
         4. NOTRE MÉTIER — 3 étapes (Section sombre navy)
    ════════════════════════════════════════════════════ -->
    <section
      id="metier"
      class="bg-primary-muted py-xl text-ink-inverse md:py-section"
      aria-labelledby="metier-title"
    >
      <div class="px-gutter-mobile md:px-gutter">
        <div>
          <p class="text-overline font-extrabold uppercase tracking-wider text-accent">
            Notre métier
          </p>
          <h2
            id="metier-title"
            v-reveal-soft
            class="mt-xs font-display text-h2 font-extrabold text-ink-inverse md:text-h1"
          >
            Trois étapes, un interlocuteur
          </h2>
        </div>

        <div class="mt-xl grid grid-cols-1 gap-md md:grid-cols-3 md:gap-lg">
          <article
            v-for="(step, idx) in steps"
            :key="step.number"
            v-reveal="revealStagger(idx)"
            class="rounded-xl border border-outline-inverse/15 bg-navy-card/40 p-md sm:p-lg transition-colors hover:border-outline-inverse/30"
          >
            <!-- Badge numéro et Titre en ligne sur mobile -->
            <div class="flex items-center gap-xs md:block">
              <span class="inline-block px-2 py-1 font-mono text-meta font-bold text-accent">
                {{ step.number }}
              </span>
              <h3 class="font-display text-h4 font-bold text-ink-inverse sm:text-h3 md:mt-md">
                {{ step.title }}
              </h3>
            </div>
            <p class="mt-xs font-sans text-small text-ink-inverse-muted leading-relaxed">
              {{ step.body }}
            </p>
          </article>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════
         5. NOS ENGAGEMENTS — 4 piliers
    ════════════════════════════════════════════════════ -->
    <section id="engagements" class="py-xl md:py-section" aria-labelledby="engagements-title">
      <div class="px-gutter-mobile md:px-gutter">
        <div class="text-left md:text-center">
          <p class="text-overline font-extrabold uppercase tracking-wider text-accent-text">
            Nos engagements
          </p>
          <h2
            id="engagements-title"
            v-reveal-soft
            class="mt-xs font-display text-h2 font-extrabold text-ink md:text-h1"
          >
            Ce que vous pouvez attendre de nous
          </h2>
        </div>

        <div class="mt-xl grid grid-cols-1 gap-md sm:grid-cols-2 lg:grid-cols-4 md:gap-lg">
          <article
            v-for="(pillar, idx) in pillars"
            :key="pillar.title"
            v-reveal="revealStagger(idx)"
            class="flex flex-col rounded-xl bg-surface p-md sm:p-lg shadow-xs transition-shadow hover:shadow-sm"
          >
            <div
              class="hidden md:flex h-10 w-10 items-center justify-center rounded-xl bg-white text-primary"
            >
              <component :is="pillar.icon" :size="20" class="shrink-0" />
            </div>
            <h3 class="font-display text-h4 font-bold text-ink md:mt-md">
              {{ pillar.title }}
            </h3>
            <p class="mt-xs font-sans text-small text-ink-muted leading-relaxed">
              {{ pillar.body }}
            </p>
          </article>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════
          6. QUALITÉ & ACCESSIBILITÉ (2 cartes)
     ════════════════════════════════════════════════════ -->
    <section class="bg-surface py-section">
      <div class="mx-auto px-gutter-mobile md:px-gutter grid grid-cols-1 gap-lg lg:grid-cols-2">
        <!-- Carte Qualité -->
        <article
          v-reveal="revealStagger(0)"
          class="flex flex-col items-start gap-md p-md sm:p-lg sm:flex-row sm:gap-lg"
        >
          <!-- En-tête mobile : Logo + Titre / Badge -->
          <div class="flex items-center gap-md sm:block">
            <div
              class="flex h-20 w-24 shrink-0 flex-col items-center justify-center rounded-xl border border-rule bg-white p-2 text-center text-small leading-tight sm:h-24 sm:w-28"
              aria-label="Certification Qualiopi"
            >
              <span>Logo Qualiopi</span>
              <span class="text-meta text-ink-muted">(officiel)</span>
            </div>
            <div class="sm:hidden">
              <p class="text-overline font-extrabold uppercase tracking-wider text-accent-text">
                Qualité
              </p>
              <h3 class="mt-xs font-display text-h3 font-extrabold text-ink">
                Une démarche qualité certifiée
              </h3>
            </div>
          </div>

          <!-- Détails Qualité -->
          <div class="flex-1 w-full">
            <div class="hidden sm:block">
              <p class="text-overline font-extrabold uppercase tracking-wider text-accent-text">
                Qualité
              </p>
              <h3 class="mt-xs font-display text-h3 font-extrabold text-ink">
                Une démarche qualité certifiée
              </h3>
            </div>
            <p class="mt-sm font-sans text-small text-ink-muted leading-relaxed">
              La certification Qualiopi atteste de la qualité des processus mis en œuvre au titre
              des actions de formation. Le certificat et son périmètre sont consultables ci-dessous.
            </p>
            <a
              href="#qualite-certificat"
              class="mt-md inline-flex w-full sm:w-auto items-center justify-center gap-xs rounded-full border border-primary/30 bg-white py-2 px-md font-sans text-small font-bold text-primary shadow-xs transition-colors hover:bg-primary/5 sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none hover:text-accent-text"
              @click.prevent="openQualiopiModal"
            >
              <IconDownload :size="16" class="shrink-0" />
              <span>Télécharger le certificat (PDF)</span>
            </a>
          </div>
        </article>

        <!-- Carte Accessibilité -->
        <article v-reveal="revealStagger(1)" class="flex flex-col justify-between p-md sm:p-lg">
          <div>
            <p class="text-overline font-extrabold uppercase tracking-wider text-accent-text">
              Accessibilité & handicap
            </p>
            <h3 class="mt-xs font-display text-h3 font-extrabold text-ink">
              Des formations accessibles à tous
            </h3>
            <p class="mt-sm font-sans text-small text-ink-muted leading-relaxed">
              Un référent handicap étudie avec vous les aménagements possibles (rythme, supports,
              accès aux locaux) avant toute inscription. Le site vise la conformité RGAA niveau AA.
            </p>
          </div>
          <div class="mt-md">
            <NuxtLink
              to="/parler-a-votre-conseiller"
              class="inline-flex items-center gap-xs font-sans text-small font-bold text-primary transition-colors hover:text-accent-text"
            >
              <span>Contacter le référent handicap</span>
              <span class="link-arrow">→</span>
            </NuxtLink>
          </div>
        </article>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════
         7. LE RÉSEAU (Carte + Contenu)
    ════════════════════════════════════════════════════ -->
    <div class="px-gutter-mobile md:px-gutter">
      <section id="reseau" class="py-xl md:py-section" aria-labelledby="reseau-title">
        <!-- Version Mobile (< lg) : Titre -> Carte -> Description -> Boutons -->
        <div class="lg:hidden flex flex-col gap-lg">
          <div>
            <p class="text-overline font-extrabold uppercase tracking-wider text-accent-text">
              Le réseau
            </p>
            <h2 class="mt-xs font-display text-h2 font-extrabold leading-tight text-ink">
              Un réseau national de centres, une seule marque
            </h2>
          </div>

          <div class="w-full">
            <div
              class="h-72 sm:h-80 w-full overflow-hidden rounded-2xl border border-rule bg-surface shadow-xs"
            >
              <CenterMap
                v-if="mapCenters.length"
                :centers="mapCenters"
                :active-id="null"
                :caption="''"
                :user-position="userPosition"
              />
              <div
                v-else
                class="flex h-full flex-col items-center justify-center p-lg text-center text-small text-ink-muted"
              >
                <div
                  class="flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-primary mb-sm"
                >
                  <IconMap :size="24" />
                </div>
                <p class="font-display font-bold text-ink">Carte interactive du réseau</p>
                <p class="mt-xs max-w-xs text-meta text-ink-muted">
                  Plus de 400 centres partenaires référencés sur l'ensemble du territoire national.
                </p>
              </div>
            </div>
          </div>

          <div>
            <p class="font-sans text-body text-ink-muted leading-relaxed">
              Centres de formation, organismes référencés et formateurs indépendants travaillent
              sous la marque LEARN UP ACADEMY avec les mêmes exigences de qualité. Où que soient vos
              équipes, vous bénéficiez du même niveau de service et d'un interlocuteur unique.
            </p>

            <div class="mt-lg flex flex-col sm:flex-row items-center gap-md">
              <Button as-child variant="outline" size="pill-lg" class="w-full sm:w-auto shadow-xs">
                <NuxtLink to="/centres">Trouver un centre</NuxtLink>
              </Button>
              <NuxtLink
                to="/rejoindre-le-reseau"
                class="inline-block text-small font-bold text-accent-text transition-colors hover:text-primary"
              >
                Rejoindre le réseau&nbsp;
                <span class="link-arrow">→</span>
              </NuxtLink>
            </div>
          </div>
        </div>

        <!-- Version Desktop (>= lg) : 2 colonnes, Carte à gauche, Titre + Description groupés à droite -->
        <div class="hidden lg:grid lg:grid-cols-2 lg:gap-xl lg:items-center">
          <div class="w-full">
            <div
              class="h-80 lg:h-96 w-full overflow-hidden rounded-2xl border border-rule bg-surface shadow-xs"
            >
              <CenterMap
                v-if="mapCenters.length"
                :centers="mapCenters"
                :active-id="null"
                :caption="''"
                :user-position="userPosition"
              />
              <div
                v-else
                class="flex h-full flex-col items-center justify-center p-lg text-center text-small text-ink-muted"
              >
                <div
                  class="flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-primary mb-sm"
                >
                  <IconMap :size="24" />
                </div>
                <p class="font-display font-bold text-ink">Carte interactive du réseau</p>
                <p class="mt-xs max-w-xs text-meta text-ink-muted">
                  Plus de 400 centres partenaires référencés sur l'ensemble du territoire national.
                </p>
              </div>
            </div>
          </div>

          <div v-reveal>
            <p class="text-overline font-extrabold uppercase tracking-wider text-accent-text">
              Le réseau
            </p>
            <h2
              id="reseau-title"
              class="mt-xs font-display text-h2 font-extrabold leading-tight text-ink"
            >
              Un réseau national de centres, une seule marque
            </h2>
            <p class="mt-md font-sans text-body text-ink-muted leading-relaxed">
              Centres de formation, organismes référencés et formateurs indépendants travaillent
              sous la marque LEARN UP ACADEMY avec les mêmes exigences de qualité. Où que soient vos
              équipes, vous bénéficiez du même niveau de service et d'un interlocuteur unique.
            </p>

            <div class="mt-xl flex flex-wrap items-center gap-md">
              <Button as-child variant="outline" size="pill-lg" class="shadow-xs">
                <NuxtLink to="/centres">Trouver un centre</NuxtLink>
              </Button>
              <NuxtLink
                to="/rejoindre-le-reseau"
                class="inline-block text-small font-bold text-accent-text transition-colors hover:text-primary ml-3"
              >
                Rejoindre le réseau&nbsp;
                <span class="link-arrow">→</span>
              </NuxtLink>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- ═══════════════════════════════════════════════════
         8. BANNIÈRE CTA FINALE (Section sombre navy)
    ════════════════════════════════════════════════════ -->
    <section
      id="contact-cta"
      class="bg-primary py-2xl text-ink-inverse md:py-3xl"
      aria-labelledby="cta-title"
    >
      <div class="px-gutter-mobile text-center md:px-gutter">
        <h2
          id="cta-title"
          v-reveal-soft
          class="font-display text-h3 font-extrabold text-ink-inverse md:text-h2"
        >
          Une question ou une formation à organiser ?
        </h2>
        <p class="hidden sm:block mt-sm font-sans text-small text-ink-inverse-muted md:text-lead">
          Un conseiller vous répond et vous oriente.
        </p>

        <div class="mt-xl flex flex-col sm:flex-row items-center justify-center gap-md">
          <Button as-child variant="accent" size="pill-lg" class="w-full sm:w-auto shadow-sm">
            <NuxtLink to="/parler-a-votre-conseiller">Parler à un conseiller</NuxtLink>
          </Button>
          <Button
            as-child
            variant="outline-inverse"
            size="pill-lg"
            class="hidden sm:inline-flex w-full sm:w-auto"
          >
            <NuxtLink to="/formations">Voir les formations</NuxtLink>
          </Button>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Centre } from '@learnup/types'
import IconBadgeCheck from '~/components/icons/IconBadgeCheck.vue'
import IconClock from '~/components/icons/IconClock.vue'
import IconDownload from '~/components/icons/IconDownload.vue'
import IconFileText from '~/components/icons/IconFileText.vue'
import IconMap from '~/components/icons/IconMap.vue'
import IconUser from '~/components/icons/IconUser.vue'
import { useGeolocation } from '~/composables/useGeolocation'
import type { CenterResult } from '~/types/center-result'
import { toCenterResults } from '~/utils/centre'
import { heroStagger, revealStagger } from '~/utils/reveal'

definePageMeta({
  breadcrumb: [{ label: 'Accueil', to: '/' }, { label: 'À propos' }]
})

useContentSeo(
  {
    seo_title: 'À propos — LEARN UP ACADEMY | Le conseil en formation',
    seo_description:
      "Learn Up Academy est une plateforme de conseil et d'orientation en formation professionnelle. Nous centralisons la recherche et la coordination des formations réglementaires dans toute la France."
  },
  'À propos — LEARN UP ACADEMY'
)

// Modal Qualiopi
const qualiopiModalOpen = ref(false)
function openQualiopiModal() {
  qualiopiModalOpen.value = true
}

// Données : Notre métier (3 étapes)
const steps = [
  {
    number: '01',
    title: 'Comprendre',
    body: 'Un conseiller qualifie votre besoin : obligation réglementaire, nombre de personnes, contraintes de dates et de lieux.'
  },
  {
    number: '02',
    title: 'Localiser',
    body: 'Nous identifions les sessions disponibles dans les centres du réseau, au plus près de vos équipes, en inter ou en intra.'
  },
  {
    number: '03',
    title: 'Orchestrer',
    body: 'Inscriptions, conventions, suivi des attestations : vous gardez une vision claire à travers un seul point de contact.'
  }
]

// Données : Nos engagements (4 piliers)
const pillars = [
  {
    icon: IconBadgeCheck,
    title: 'Des centres sélectionnés',
    body: 'Organismes certifiés, formateurs habilités, matériel conforme.'
  },
  {
    icon: IconUser,
    title: 'Un conseil humain',
    body: 'Un conseiller identifié, joignable, qui connaît votre dossier.'
  },
  {
    icon: IconClock,
    title: 'Une réponse rapide',
    body: 'Une proposition de session sous 48 heures après qualification.'
  },
  {
    icon: IconFileText,
    title: 'Une information claire',
    body: 'Prérequis, durées, validités et financements explicités sans ambiguïté.'
  }
]

// Données : Réseau et carte
const centresData = await useDirectusList<Centre>('centres', 'a-propos-map-centres', {
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

const { position: userPosition } = useGeolocation()

const mapCenters = computed<CenterResult[]>(() => {
  if (!centresData?.value?.length) return []
  return toCenterResults(centresData.value)
})

const heroBenefits = [
  {
    title: 'Réseau national',
    subtitle: 'Centres partenaires — France entière',
    subtitleMobile: 'France entière',
    isDynamic: false
  },
  {
    title: '',
    subtitle: 'Formations au catalogue',
    subtitleMobile: 'Formations au catalogue',
    isDynamic: true
  },
  {
    title: '',
    subtitle: 'Stagiaires accompagnés par an',
    subtitleMobile: 'Stagiaires / an',
    isDynamic: true
  },
  {
    title: 'Qualiopi',
    subtitle: 'Certification — périmètre à confirmer',
    subtitleMobile: 'Certification',
    isDynamic: false
  }
]
</script>
