<template>
  <div class="bg-paper">
    <!-- ═══════════════════════════════════════════════════
         1. HERO — Qui sommes-nous
    ════════════════════════════════════════════════════ -->
    <section class="relative isolate overflow-hidden bg-surface-soft py-xl md:py-4xl">
      <!-- Formes d'ambiance en arrière-plan -->
      <div
        class="pointer-events-none absolute -top-24 right-0 h-96 w-96 rounded-full bg-paper-warm opacity-80 blur-3xl"
        aria-hidden="true"
      />
      <div
        class="pointer-events-none absolute -bottom-24 left-0 h-96 w-96 rounded-full bg-primary-soft/60 blur-3xl"
        aria-hidden="true"
      />

      <div class="relative mx-auto max-w-container px-gutter-mobile md:px-gutter">
        <div class="mx-auto max-w-3xl text-center">
          <!-- Badge pilule -->
          <div v-hero="heroStagger(0)" class="flex justify-center">
            <span
              class="inline-flex items-center rounded-full border border-rule bg-paper px-md py-xs text-overline font-extrabold uppercase tracking-wider text-ink shadow-xs"
            >
              Qui sommes-nous
            </span>
          </div>

          <!-- Titre principal -->
          <h1
            v-hero="heroStagger(1)"
            class="mt-lg font-display text-h2 font-extrabold leading-tight text-ink sm:text-h1 md:text-hero"
          >
            Le conseil en formation,
            <span class="text-accent-text">au plus près du terrain.</span>
          </h1>

          <!-- Texte d'introduction -->
          <p
            v-hero="heroStagger(2)"
            class="mx-auto mt-md max-w-2xl font-sans text-small text-ink-muted leading-relaxed sm:text-lead"
          >
            Learn Up Academy est une plateforme de conseil et d'orientation en formation
            professionnelle. Nous comprenons votre besoin, localisons la bonne session dans un
            réseau national de centres, et organisons vos formations réglementaires — d'un
            interlocuteur unique.
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

        <!-- ═══════════════════════════════════════════════════
             2. BANDEAU CHIFFRES CLÉS & RÉSEAU
        ════════════════════════════════════════════════════ -->
        <div v-reveal class="mt-2xl rounded-2xl border border-rule bg-paper p-lg shadow-xs md:p-xl">
          <div
            class="grid grid-cols-1 gap-lg sm:grid-cols-2 lg:grid-cols-4 sm:divide-y-0 lg:divide-x divide-rule"
          >
            <!-- 1. Réseau national -->
            <div class="flex flex-col justify-center px-md py-xs text-left">
              <p class="font-display text-h4 font-extrabold text-ink sm:text-h3">Réseau national</p>
              <p class="mt-xs text-meta text-ink-muted">Centres partenaires · Partout en France</p>
            </div>

            <!-- 2. Formations -->
            <div class="flex flex-col justify-center px-md py-xs text-left">
              <p class="font-display text-h3 font-extrabold text-accent-text sm:text-h2">250+</p>
              <p class="mt-xs text-meta text-ink-muted">Formations au catalogue</p>
            </div>

            <!-- 3. Sessions -->
            <div class="flex flex-col justify-center px-md py-xs text-left">
              <p class="font-display text-h3 font-extrabold text-ink sm:text-h2">80+</p>
              <p class="mt-xs text-meta text-ink-muted">Sessions ouvertes chaque semaine</p>
            </div>

            <!-- 4. Qualiopi -->
            <div class="flex flex-col justify-center px-md py-xs text-left">
              <p class="font-display text-h4 font-extrabold text-ink sm:text-h3">Qualiopi</p>
              <p class="mt-xs text-meta text-ink-muted">Certification · Qualité des actions</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <div class="mx-auto max-w-container px-gutter-mobile md:px-gutter">
      <!-- ═══════════════════════════════════════════════════
           3. NOTRE MISSION (2 colonnes)
      ════════════════════════════════════════════════════ -->
      <section id="mission" class="py-xl md:py-section" aria-labelledby="mission-title">
        <div class="grid grid-cols-1 items-center gap-xl md:grid-cols-2 md:gap-2xl">
          <!-- Colonne gauche : Contenu éditorial -->
          <div v-reveal>
            <p class="text-overline font-extrabold uppercase tracking-wider text-accent-text">
              Notre mission
            </p>
            <h2
              id="mission-title"
              class="mt-xs font-display text-h2 font-extrabold leading-tight text-ink md:text-h1"
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

          <!-- Colonne droite : Visuel équipe / activité -->
          <div v-reveal class="flex justify-center">
            <div
              class="relative w-full overflow-hidden rounded-2xl border border-rule bg-surface shadow-sm"
            >
              <img
                src="/images/formation1.webp"
                alt="Équipe Learn Up Academy en session de formation"
                class="aspect-[4/3] w-full object-cover"
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
         4. NOTRE MÉTIER — 3 étapes (Section sombre)
    ════════════════════════════════════════════════════ -->
    <section
      id="metier"
      class="bg-navy-deep py-xl text-ink-inverse md:py-section"
      aria-labelledby="metier-title"
    >
      <div class="mx-auto max-w-container px-gutter-mobile md:px-gutter">
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
            class="rounded-xl border border-outline-inverse/15 bg-navy-card/40 p-lg transition-colors hover:border-outline-inverse/30"
          >
            <!-- Badge numéro -->
            <span
              class="inline-block rounded-md border border-outline-inverse/20 bg-navy-primary/80 px-2 py-1 font-mono text-meta font-bold text-accent"
            >
              {{ step.number }}
            </span>
            <h3 class="mt-md font-display text-h4 font-bold text-ink-inverse sm:text-h3">
              {{ step.title }}
            </h3>
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
    <section
      id="engagements"
      class="bg-surface-soft py-xl md:py-section"
      aria-labelledby="engagements-title"
    >
      <div class="mx-auto max-w-container px-gutter-mobile md:px-gutter">
        <div class="text-center">
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
            class="flex flex-col rounded-xl border border-rule bg-paper p-lg shadow-xs transition-shadow hover:shadow-sm"
          >
            <div
              class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-soft text-primary"
            >
              <component :is="pillar.icon" :size="20" class="shrink-0" />
            </div>
            <h3 class="mt-md font-display text-h4 font-bold text-ink">
              {{ pillar.title }}
            </h3>
            <p class="mt-xs font-sans text-small text-ink-muted leading-relaxed">
              {{ pillar.body }}
            </p>
          </article>
        </div>

        <!-- ═══════════════════════════════════════════════════
             6. QUALITÉ & ACCESSIBILITÉ (2 cartes)
        ════════════════════════════════════════════════════ -->
        <div class="mt-xl grid grid-cols-1 gap-lg lg:grid-cols-2 md:mt-2xl">
          <!-- Carte Qualité -->
          <article
            v-reveal="revealStagger(0)"
            class="flex flex-col sm:flex-row items-start gap-lg rounded-2xl border border-rule bg-paper p-lg shadow-xs md:p-xl"
          >
            <!-- Badge logo Qualiopi textuel -->
            <div
              class="flex h-24 w-28 shrink-0 flex-col items-center justify-center rounded-xl border border-rule bg-surface-alt/70 p-2 text-center"
              aria-label="Certification Qualiopi"
            >
              <span
                class="text-[9px] font-extrabold uppercase tracking-tight text-ink leading-none"
              >
                RÉPUBLIQUE
              </span>
              <span
                class="text-[9px] font-extrabold uppercase tracking-tight text-ink leading-none mt-0.5"
              >
                FRANÇAISE
              </span>
              <div class="mt-1.5 w-full border-t border-rule pt-1 text-center">
                <span
                  class="font-display text-xs font-black tracking-tight text-ink block leading-none"
                >
                  Qualiopi
                </span>
                <span
                  class="text-[8px] uppercase tracking-wider text-ink-muted block mt-0.5 leading-none"
                >
                  processus certifié
                </span>
              </div>
            </div>

            <!-- Détails Qualité -->
            <div class="flex-1">
              <p class="text-overline font-extrabold uppercase tracking-wider text-accent-text">
                Qualité
              </p>
              <h3 class="mt-xs font-display text-h3 font-extrabold text-ink">
                Une démarche qualité certifiée
              </h3>
              <p class="mt-sm font-sans text-small text-ink-muted leading-relaxed">
                Les certifications Qualiopi de notre organisme et de nos partenaires couvrent
                l'ensemble des actions de formation. Nos certificats et sous-traitants sont
                consultables ci-dessous.
              </p>
              <a
                href="#qualite-certificat"
                class="mt-md inline-flex items-center gap-xs font-sans text-small font-bold text-primary transition-colors hover:text-accent-text"
                @click.prevent="openQualiopiModal"
              >
                <IconDownload :size="16" class="shrink-0" />
                <span>Télécharger le certificat (PDF)</span>
              </a>
            </div>
          </article>

          <!-- Carte Accessibilité -->
          <article
            v-reveal="revealStagger(1)"
            class="flex flex-col justify-between rounded-2xl border border-rule bg-paper p-lg shadow-xs md:p-xl"
          >
            <div>
              <p class="text-overline font-extrabold uppercase tracking-wider text-accent-text">
                Accessibilité & handicap
              </p>
              <h3 class="mt-xs font-display text-h3 font-extrabold text-ink">
                Des formations accessibles à tous
              </h3>
              <p class="mt-sm font-sans text-small text-ink-muted leading-relaxed">
                Un référent handicap dédié étudie tous les aménagements possibles (rythme, supports,
                accès aux locaux) avant toute inscription. En savoir plus sur notre référentiel PSH.
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
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════
         7. LE RÉSEAU (Carte + Contenu)
    ════════════════════════════════════════════════════ -->
    <div class="mx-auto max-w-container px-gutter-mobile md:px-gutter">
      <section id="reseau" class="py-xl md:py-section" aria-labelledby="reseau-title">
        <div class="grid grid-cols-1 items-center gap-xl lg:grid-cols-2">
          <!-- Carte interactive des centres du réseau -->
          <div class="w-full">
            <div
              class="h-80 w-full overflow-hidden rounded-2xl border border-rule bg-surface shadow-xs md:h-96"
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

          <!-- Contenu descriptif du réseau -->
          <div v-reveal>
            <p class="text-overline font-extrabold uppercase tracking-wider text-accent-text">
              Le réseau
            </p>
            <h2
              id="reseau-title"
              class="mt-xs font-display text-h2 font-extrabold leading-tight text-ink md:text-h1"
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
              <Button
                as-child
                variant="ghost"
                size="pill-lg"
                class="font-bold text-primary hover:text-accent-text"
              >
                <NuxtLink to="/rejoindre-le-reseau">
                  Rejoindre le réseau <span class="link-arrow">→</span>
                </NuxtLink>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- ═══════════════════════════════════════════════════
         8. BANNIÈRE CTA FINALE (Section sombre)
    ════════════════════════════════════════════════════ -->
    <section
      id="contact-cta"
      class="bg-navy-deep py-2xl text-ink-inverse md:py-3xl"
      aria-labelledby="cta-title"
    >
      <div class="mx-auto max-w-container px-gutter-mobile text-center md:px-gutter">
        <h2
          id="cta-title"
          v-reveal-soft
          class="font-display text-h3 font-extrabold text-ink-inverse md:text-h2"
        >
          Une question sur nos services ou une formation à organiser ?
        </h2>
        <p class="mx-auto mt-xs max-w-xl font-sans text-small text-ink-inverse-muted md:text-lead">
          Un conseiller vous répond et vous oriente.
        </p>

        <div class="mt-xl flex flex-col sm:flex-row items-center justify-center gap-md">
          <Button as-child variant="accent" size="pill-lg" class="w-full sm:w-auto shadow-sm">
            <NuxtLink to="/parler-a-votre-conseiller">Parler à un conseiller</NuxtLink>
          </Button>
          <Button as-child variant="outline-inverse" size="pill-lg" class="w-full sm:w-auto">
            <NuxtLink to="/formations">Voir les formations</NuxtLink>
          </Button>
        </div>
      </div>
    </section>

    <!-- Dialog de téléchargement du certificat Qualiopi -->
    <Dialog v-model:open="qualiopiModalOpen">
      <DialogContent class="max-w-md bg-paper p-lg">
        <DialogHeader>
          <DialogTitle class="font-display text-h3 font-extrabold text-ink">
            Certificat Qualiopi
          </DialogTitle>
          <DialogDescription class="mt-xs text-small text-ink-muted">
            Certification au titre des catégories d'actions suivantes : actions de formation.
          </DialogDescription>
        </DialogHeader>
        <div
          class="mt-lg rounded-xl border border-rule bg-surface-alt p-md text-small text-ink-body"
        >
          <p class="font-bold text-ink">LEARN UP ACADEMY</p>
          <p class="mt-xs text-meta text-ink-muted">
            Organisme certifié Qualiopi sous le référentiel national qualité.
          </p>
          <p class="mt-xs text-meta text-ink-muted">Valide sur l'ensemble du réseau national.</p>
        </div>
        <DialogFooter class="mt-lg flex flex-col-reverse gap-sm sm:flex-row sm:justify-end">
          <Button variant="outline" size="pill-sm" @click="qualiopiModalOpen = false">
            Fermer
          </Button>
          <Button as-child variant="default" size="pill-sm">
            <NuxtLink to="/parler-a-votre-conseiller"> Demander l'attestation officielle </NuxtLink>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '~/components/ui/dialog'
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
</script>
