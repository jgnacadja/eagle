<template>
  <div class="flex-1 bg-paper">
    <!-- Hero -->
    <section class="border-b border-rule bg-paper" aria-labelledby="hero-title">
      <div class="mx-auto max-w-container px-gutter-mobile md:px-gutter py-2xl">
        <div class="grid items-start gap-2xl lg:grid-cols-2">
          <div>
            <p class="text-overline text-accent-text uppercase">
              Réseau Learn Up Academy · Val-de-Marne (94)
            </p>
            <h1 id="hero-title" class="mt-sm font-display text-h1 font-extrabold text-ink">
              Centre LEARN UP ACADEMY de Créteil
            </h1>
            <p class="mt-sm flex items-center gap-1.5 text-body text-ink-body lg:hidden">
              <svg
                class="h-4 w-4 shrink-0"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M12 21c-4-4.5-7-8.2-7-12a7 7 0 1114 0c0 3.8-3 7.5-7 12z"
                />
                <circle cx="12" cy="9" r="2.5" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              14 rue des Refuzniks, 94000 Créteil · Île-de-France
            </p>

            <ul class="mt-md flex flex-wrap gap-2">
              <li
                v-for="tag in tags"
                :key="tag"
                class="rounded-full border border-outline bg-paper px-md py-xs text-small text-ink-body"
              >
                {{ tag }}
              </li>
            </ul>

            <figure
              class="mt-md flex aspect-video items-center justify-center rounded-md border border-dashed border-outline bg-surface-alt text-center text-small text-ink-muted lg:hidden"
            >
              <figcaption>Photo principale du centre — à fournir (16:9)</figcaption>
            </figure>

            <div class="mt-2xl flex flex-wrap items-center gap-md">
              <Button
                as-child
                class="h-control w-full rounded-md bg-accent px-md py-sm text-button font-semibold text-ink transition hover:bg-accent-text sm:w-auto"
              >
                <NuxtLink to="#formations">Trouver une formation dans ce centre</NuxtLink>
              </Button>
              <Button
                as-child
                variant="outline"
                class="h-control w-full rounded-md border-outline bg-paper px-md py-sm text-button font-medium text-ink transition hover:border-primary hover:bg-paper hover:text-ink sm:w-auto"
              >
                <NuxtLink to="#">Parler à un conseiller</NuxtLink>
              </Button>
              <NuxtLink
                to="tel:0184204530"
                class="hidden items-center gap-2 font-medium text-ink sm:inline-flex"
              >
                <svg
                  class="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M3 5a2 2 0 012-2h2.5l2 5-2 1.5a11 11 0 005 5l1.5-2 5 2V19a2 2 0 01-2 2C9.6 21 3 14.4 3 6V5z"
                  />
                </svg>
                01 84 20 45 30
              </NuxtLink>
            </div>
          </div>

          <figure
            class="hidden aspect-4/3 items-center justify-center rounded-md border border-dashed border-outline bg-surface-alt text-center text-small text-ink-muted lg:flex"
          >
            <figcaption>
              Photo principale du centre — à fournir<br />plateau technique, engins, façade (4:3)
            </figcaption>
          </figure>
        </div>
      </div>
    </section>

    <!-- Contenu principal -->
    <div class="mx-auto max-w-container px-gutter-mobile md:px-gutter py-section">
      <div class="flex flex-col gap-2xl lg:flex-row">
        <!-- Barre latérale -->
        <aside
          class="order-1 flex w-full shrink-0 flex-col gap-2xl lg:order-2 lg:w-80"
          aria-label="Informations complémentaires"
        >
          <!-- Informations pratiques -->
          <section aria-labelledby="infos-title">
            <Card class="h-fit rounded-md">
              <CardHeader class="p-md pb-0">
                <h2 id="infos-title" class="font-sans text-h4 font-semibold text-ink">
                  Informations pratiques
                </h2>
              </CardHeader>
              <CardContent class="p-md pt-0">
                <ul class="space-y-md text-small">
                  <li class="flex gap-3">
                    <svg
                      class="mt-1 h-4 w-4 shrink-0 text-ink-subtle"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M12 21c-4-4.5-7-8.2-7-12a7 7 0 1114 0c0 3.8-3 7.5-7 12z"
                      />
                      <circle
                        cx="12"
                        cy="9"
                        r="2.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                    <span class="text-ink-body">
                      14 rue des Refuzniks<br />94000 Créteil · Val-de-Marne · Île-de-France
                    </span>
                  </li>
                  <li class="flex gap-3">
                    <svg
                      class="mt-1 h-4 w-4 shrink-0 text-ink-subtle"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M3 5a2 2 0 012-2h2.5l2 5-2 1.5a11 11 0 005 5l1.5-2 5 2V19a2 2 0 01-2 2C9.6 21 3 14.4 3 6V5z"
                      />
                    </svg>
                    <NuxtLink to="tel:0184204530" class="font-medium text-ink hover:underline">
                      01 84 20 45 30
                    </NuxtLink>
                  </li>
                  <li class="flex gap-3">
                    <svg
                      class="mt-1 h-4 w-4 shrink-0 text-ink-subtle"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M3 6h18v12H3V6zm0 0l9 7 9-7"
                      />
                    </svg>
                    <NuxtLink
                      to="mailto:creteil@learnupacademy.fr"
                      class="text-ink hover:underline"
                    >
                      creteil@learnupacademy.fr
                    </NuxtLink>
                  </li>
                  <li class="flex gap-3">
                    <svg
                      class="mt-1 h-4 w-4 shrink-0 text-ink-subtle"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <circle cx="12" cy="12" r="9" />
                      <path stroke-linecap="round" stroke-linejoin="round" d="M12 7v5l3 3" />
                    </svg>
                    <span class="text-ink-body">Lundi–vendredi · 8h30–17h30</span>
                  </li>
                  <li class="flex gap-3">
                    <svg
                      class="mt-1 h-4 w-4 shrink-0 text-ink-subtle"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M4 17h16M6 17V9l6-4 6 4v8"
                      />
                    </svg>
                    <span class="text-ink-body">
                      Métro 8 — Créteil Préfecture · Bus 117, arrêt Base de loisirs
                    </span>
                  </li>
                  <li class="flex gap-3">
                    <svg
                      class="mt-1 h-4 w-4 shrink-0 text-ink-subtle"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <rect x="4" y="4" width="16" height="16" rx="2" />
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M9 8h4a2 2 0 010 4H9V8zm0 4v4"
                      />
                    </svg>
                    <span class="text-ink-body"
                      >Parking visiteurs sur place · Locaux accessibles PMR</span
                    >
                  </li>
                </ul>
              </CardContent>
            </Card>
          </section>

          <!-- Carte -->
          <section aria-label="Carte de localisation">
            <Card class="h-fit overflow-hidden rounded-md">
              <CardContent class="p-0">
                <div
                  class="flex aspect-4/3 items-center justify-center bg-surface-alt text-center text-meta text-ink-muted"
                >
                  Carte Leaflet · OpenStreetMap — chargée à l'interaction
                </div>
                <div class="flex items-center justify-between gap-3 p-md">
                  <p class="text-small text-ink-body">14 rue des Refuzniks, 94000 Créteil</p>
                  <Button
                    as-child
                    variant="link"
                    class="h-auto p-0 text-small font-bold text-primary hover:text-ink hover:no-underline"
                  >
                    <NuxtLink to="#">Ouvrir l'itinéraire →</NuxtLink>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>

          <!-- Qualité -->
          <section aria-labelledby="qualite-title">
            <Card class="h-fit rounded-md">
              <CardHeader class="p-md pb-0">
                <h2 id="qualite-title" class="font-sans text-h4 font-semibold text-ink">
                  Qualité et certifications
                </h2>
              </CardHeader>
              <CardContent class="p-md pt-0">
                <div class="flex gap-3">
                  <span
                    class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface"
                    aria-hidden="true"
                  >
                    <svg
                      class="h-5 w-5 text-ink"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      viewBox="0 0 24 24"
                    >
                      <circle cx="12" cy="8" r="5" />
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M9 12.5L7 21l5-3 5 3-2-8.5"
                      />
                    </svg>
                  </span>
                  <div class="text-small">
                    <p class="font-semibold text-ink">Certification Qualiopi</p>
                    <p class="text-ink-body">
                      Actions de formation · AFNOR Certification · valide jusqu'au 14 mars 2027.
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter class="p-md pt-0">
                <Button
                  as-child
                  variant="outline"
                  class="w-full justify-center gap-2 rounded-md border-outline bg-paper px-md py-sm text-small font-bold text-ink transition hover:border-primary hover:bg-paper hover:text-ink"
                >
                  <NuxtLink to="#">
                    <svg
                      class="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14"
                      />
                    </svg>
                    Télécharger le certificat Qualiopi
                  </NuxtLink>
                </Button>
              </CardFooter>
            </Card>
          </section>
        </aside>

        <!-- Colonne principale -->
        <div class="order-2 flex flex-1 flex-col gap-2xl lg:order-1">
          <!-- Le centre -->
          <section aria-labelledby="le-centre-title">
            <h2 id="le-centre-title" class="font-display text-h2 font-extrabold text-ink">
              Le centre
            </h2>
            <p class="mt-sm max-w-prose text-body leading-relaxed text-ink-body">
              Le centre de Créteil couvre les formations réglementaires en sécurité et prévention
              pour le Val-de-Marne et le sud-est francilien. Il dispose d'un plateau technique de 2
              400 m² : zone de conduite d'engins, structure de travaux en hauteur et salles
              d'habilitation électrique.
            </p>
            <p class="mt-sm max-w-prose text-body leading-relaxed text-ink-body">
              Les sessions sont assurées en inter-entreprises dans les locaux du centre, ou en intra
              sur les sites des entreprises du territoire.
            </p>
          </section>

          <!-- Formations disponibles -->
          <section id="formations" aria-labelledby="formations-title">
            <div class="flex flex-wrap items-baseline justify-between gap-2">
              <h2 id="formations-title" class="font-display text-h2 font-extrabold text-ink">
                Les formations disponibles dans ce centre
              </h2>
              <span class="text-small text-ink-muted">12 formations · 4 familles</span>
            </div>
            <div class="mt-md grid gap-grid sm:grid-cols-2">
              <Card
                v-for="formation in formations"
                :key="formation.title"
                class="flex flex-col rounded-md"
              >
                <CardHeader class="p-md pb-0">
                  <p class="text-overline text-accent-text uppercase">{{ formation.family }}</p>
                  <CardTitle
                    class="font-sans text-h4 font-semibold leading-tight tracking-normal text-ink"
                  >
                    {{ formation.title }}
                  </CardTitle>
                </CardHeader>
                <CardContent class="flex-1 p-md pt-0">
                  <p class="hidden flex-1 text-small text-ink-body lg:block">
                    {{ formation.description }}
                  </p>
                  <CardDescription class="mt-sm">{{ formation.meta }}</CardDescription>
                </CardContent>
                <CardFooter class="flex items-center justify-between p-md pt-0">
                  <span
                    class="inline-flex items-center gap-1.5 text-small"
                    :class="formation.status.type === 'warning' ? 'text-warning' : 'text-success'"
                  >
                    <span
                      v-if="formation.status.type !== 'warning'"
                      class="h-2 w-2 rounded-full"
                      :class="formation.status.type === 'success' ? 'bg-success' : 'bg-ink-muted'"
                      aria-hidden="true"
                    />
                    <span v-else aria-hidden="true">▲</span>
                    {{ formation.status.label }}
                  </span>
                  <Button
                    as-child
                    variant="link"
                    class="h-auto p-0 text-small font-bold text-primary hover:text-ink hover:no-underline"
                  >
                    <NuxtLink to="#">Voir la formation →</NuxtLink>
                  </Button>
                </CardFooter>
              </Card>
            </div>
            <Button
              as-child
              variant="link"
              class="mt-md h-auto p-0 text-small font-bold text-primary hover:text-ink hover:no-underline"
            >
              <NuxtLink to="#">Voir les 12 formations du centre →</NuxtLink>
            </Button>
          </section>

          <!-- Prochaines sessions -->
          <section aria-labelledby="sessions-title">
            <h2 id="sessions-title" class="font-display text-h2 font-extrabold text-ink">
              Prochaines sessions
            </h2>
            <p class="mt-sm text-small text-ink-muted">Disponibilités actualisées en continu.</p>
            <ul class="mt-md space-y-md">
              <li v-for="session in sessions" :key="session.title">
                <Card class="rounded-md">
                  <CardContent class="flex flex-wrap items-center gap-md p-md pt-md">
                    <div class="w-14 shrink-0 text-center">
                      <p class="font-display text-h3 font-bold leading-none text-ink">
                        {{ session.day }}
                      </p>
                      <p class="text-overline text-ink-muted uppercase">{{ session.month }}</p>
                    </div>
                    <div class="min-w-45 flex-1">
                      <p class="font-sans text-h4 font-semibold text-ink">{{ session.title }}</p>
                      <p class="text-small text-ink-muted">{{ session.meta }}</p>
                    </div>
                    <span
                      class="inline-flex items-center gap-1.5 text-small"
                      :class="session.status.type === 'warning' ? 'text-warning' : 'text-success'"
                    >
                      <span
                        v-if="session.status.type !== 'warning'"
                        class="h-2 w-2 rounded-full bg-success"
                        aria-hidden="true"
                      />
                      <span v-else aria-hidden="true">▲</span>
                      <span class="hidden sm:inline">{{ session.status.label }}</span>
                      <span class="sm:hidden">{{ session.placesMobile }}</span>
                    </span>
                    <Button
                      as-child
                      variant="outline"
                      class="h-auto rounded-md border-outline bg-paper px-md py-xs text-small font-bold text-ink transition hover:border-primary hover:bg-paper"
                    >
                      <NuxtLink to="#">Voir la session</NuxtLink>
                    </Button>
                  </CardContent>
                </Card>
              </li>
            </ul>
            <Button
              as-child
              variant="link"
              class="mt-md h-auto p-0 text-small font-bold text-primary hover:text-ink hover:no-underline"
            >
              <NuxtLink to="#">Voir toutes les sessions du centre →</NuxtLink>
            </Button>
          </section>

          <!-- Avis -->
          <section aria-labelledby="avis-title">
            <h2 id="avis-title" class="font-display text-h2 font-extrabold text-ink">Avis</h2>

            <div class="mt-sm rounded-md bg-surface p-md lg:hidden">
              <div class="flex flex-wrap items-center gap-2">
                <span class="font-display text-h2 font-bold text-ink">
                  4,7<span class="text-h4 font-normal text-ink-muted">/5</span>
                </span>
                <span class="text-accent" aria-hidden="true">★★★★★</span>
                <span class="text-small text-ink-muted">214 avis Google</span>
              </div>
              <p class="text-small text-ink-muted">
                Avis portant sur la marque LEARN UP ACADEMY, toutes implantations confondues.
              </p>
            </div>

            <div class="hidden lg:block">
              <div class="flex items-center gap-2">
                <span class="font-display text-h2 font-bold text-ink">
                  4,7<span class="text-h4 font-normal text-ink-muted">/5</span>
                </span>
                <span class="text-accent" aria-hidden="true">★★★★★</span>
                <span class="text-small text-ink-muted">
                  214 avis Google — marque LEARN UP ACADEMY
                </span>
              </div>
              <p class="text-small text-ink-muted">
                Ces avis portent sur la marque LEARN UP ACADEMY, toutes implantations confondues.
              </p>
              <div class="mt-md grid gap-grid sm:grid-cols-2">
                <TestimonialCard
                  v-for="avis in avisList"
                  :key="avis.author"
                  :stars="avis.stars"
                  :quote="avis.quote"
                  :author="avis.author"
                />
              </div>
            </div>
          </section>

          <!-- Actualités -->
          <section aria-labelledby="actus-title">
            <div class="flex flex-wrap items-baseline justify-between gap-2">
              <h2 id="actus-title" class="font-display text-h2 font-extrabold text-ink">
                Actualités de ce centre
              </h2>
              <Button
                as-child
                variant="link"
                class="hidden h-auto p-0 text-small font-bold text-primary hover:text-ink hover:no-underline sm:inline"
              >
                <NuxtLink to="#">Toutes les actualités →</NuxtLink>
              </Button>
            </div>
            <div class="mt-md grid gap-grid sm:grid-cols-2">
              <ArticleCard
                v-for="(article, index) in articles"
                :key="article.title"
                :category="article.category"
                :title="article.title"
                :date="article.date"
                :class="index === 1 ? 'hidden sm:block' : ''"
              />
            </div>
            <Button
              as-child
              variant="link"
              class="mt-md h-auto p-0 text-small font-bold text-primary hover:text-ink hover:no-underline sm:hidden"
            >
              <NuxtLink to="#">Toutes les actualités →</NuxtLink>
            </Button>
          </section>
        </div>
      </div>

      <!-- Bandeau CTA -->
      <section
        class="mt-2xl flex flex-wrap items-center justify-between gap-2xl rounded-lg bg-primary p-lg text-ink-inverse"
        aria-labelledby="cta-title"
      >
        <div class="max-w-prose">
          <h2 id="cta-title" class="font-display text-h3 font-bold text-ink-inverse">
            Un besoin de formation sur ce territoire ?
          </h2>
          <p class="mt-sm text-small text-ink-inverse/70">
            La demande transmet automatiquement le centre, la ville et la formation concernée — sans
            ressaisie.
          </p>
        </div>
        <div class="flex w-full flex-col gap-md sm:w-auto sm:flex-row">
          <Button
            as-child
            class="h-control w-full rounded-md bg-paper px-lg py-sm text-center text-button font-bold text-ink transition hover:bg-surface sm:w-auto"
          >
            <NuxtLink to="#">Demander une formation</NuxtLink>
          </Button>
          <Button
            as-child
            variant="outline"
            class="h-control w-full rounded-md border-outline-inverse bg-transparent px-lg py-sm text-center text-button font-medium text-ink-inverse transition hover:border-ink-inverse hover:bg-ink-inverse/10 sm:w-auto"
          >
            <NuxtLink to="#">Parler à un conseiller</NuxtLink>
          </Button>
        </div>
      </section>

      <!-- Autres centres -->
      <section class="mt-2xl" aria-labelledby="autres-title">
        <div class="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="autres-title" class="font-display text-h2 font-extrabold text-ink">
            Autres centres en Île-de-France
          </h2>
          <Button
            as-child
            variant="link"
            class="hidden h-auto p-0 text-small font-bold text-primary hover:text-ink hover:no-underline sm:inline"
          >
            <NuxtLink to="#">Voir le réseau de centres →</NuxtLink>
          </Button>
        </div>
        <div class="mt-md grid gap-grid sm:grid-cols-3">
          <NuxtLink
            v-for="centre in nearbyCenters"
            :key="centre.slug"
            :to="`/centres/${centre.slug}`"
            class="block"
          >
            <CenterCard
              :name="centre.name"
              :distance="centre.distance"
              :formations="centre.formations"
              :tags="[]"
              class="h-full transition hover:shadow-md"
            />
          </NuxtLink>
        </div>
        <Button
          as-child
          variant="link"
          class="mt-md h-auto p-0 text-small font-bold text-primary hover:text-ink hover:no-underline sm:hidden"
        >
          <NuxtLink to="#">Voir le réseau de centres →</NuxtLink>
        </Button>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Formation {
  family: string
  title: string
  description: string
  meta: string
  status: { type: 'success' | 'warning' | 'neutral'; label: string }
}

interface Session {
  day: string
  month: string
  title: string
  meta: string
  placesMobile: string
  status: { type: 'success' | 'warning'; label: string }
}

interface ArticleItem {
  category: string
  title: string
  date: string
}

interface NearbyCenter {
  slug: string
  name: string
  distance: string
  formations: string
}

definePageMeta({
  layout: 'with-breadcrumb',
  breadcrumb: [
    { label: 'Accueil', to: '/' },
    { label: 'Réseau de centres', to: '/centres' },
    { label: 'Île-de-France', to: '/centres' },
    { label: 'Centre de Créteil' }
  ]
})

useContentSeo(
  {
    seo_title: 'Centre LEARN UP ACADEMY de Créteil',
    seo_description:
      'CACES, habilitations électriques, SST et travaux en hauteur au centre de Créteil.'
  },
  'Centre de Créteil'
)

const tags = ['CACES', 'Habilitations', 'SST', 'Hauteur']

const formations: Formation[] = [
  {
    family: "Caces · Conduite d'engins",
    title: 'CACES R489 — chariots élévateurs',
    description: 'Conduite en sécurité des chariots de manutention, catégories 1A à 5.',
    meta: '2 à 5 jours · Inter / intra · Recyclage : 5 ans',
    status: { type: 'success', label: 'Sessions ce mois-ci' }
  },
  {
    family: 'Habilitations électriques',
    title: 'Habilitation B1-B2-BR-BC',
    description:
      'Personnel électricien intervenant en basse tension. Prérequis : formation initiale en électricité.',
    meta: '3 jours · Inter / intra · Recyclage : 3 ans',
    status: { type: 'success', label: 'Sessions ce mois-ci' }
  },
  {
    family: 'Santé · Secours',
    title: 'SST — Sauveteur secouriste du travail',
    description:
      'Formation initiale et maintien-actualisation des compétences (MAC). Sans prérequis.',
    meta: '2 jours · Inter / intra · MAC : 24 mois',
    status: { type: 'warning', label: 'Session le 18/09' }
  },
  {
    family: 'Travaux en hauteur',
    title: 'Port du harnais et travail sur cordes',
    description:
      "Vérification des EPI, points d'ancrage, déplacements sécurisés. Aptitude médicale requise.",
    meta: '1 jour · Inter / intra · Recyclage : recommandé 3 ans',
    status: { type: 'neutral', label: 'Sur demande' }
  }
]

const sessions: Session[] = [
  {
    day: '12',
    month: 'Sept',
    title: 'CACES R489 — cat. 3 · initial',
    meta: '3 jours · en centre · Créteil',
    placesMobile: '5 places',
    status: { type: 'success', label: '5 places disponibles' }
  },
  {
    day: '18',
    month: 'Sept',
    title: 'SST — formation initiale',
    meta: '2 jours · en centre · Créteil',
    placesMobile: '2 places',
    status: { type: 'warning', label: '2 places disponibles' }
  },
  {
    day: '24',
    month: 'Sept',
    title: 'Habilitation B1-B2-BR — recyclage',
    meta: '1,5 jour · en centre · Créteil',
    placesMobile: '8 places',
    status: { type: 'success', label: '8 places disponibles' }
  }
]

const avisList = [
  {
    stars: '★★★★★',
    quote:
      '« Organisation de la session CACES en moins de deux semaines pour nos 6 caristes. Convocations et attestations transmises dans les délais. »',
    author: 'Responsable logistique · juin 2026'
  },
  {
    stars: '★★★★☆',
    quote:
      "« Recyclages d'habilitation planifiés sur deux sites. Suivi des échéances par l'équipe LEARN UP. »",
    author: 'Chargée QHSE · avril 2026'
  }
]

const articles: ArticleItem[] = [
  {
    category: 'Équipement',
    title: "Extension de la zone de conduite d'engins",
    date: '26 août 2026'
  },
  {
    category: 'Sessions',
    title: 'Ouverture des sessions SST du 4e trimestre',
    date: '12 août 2026'
  }
]

const nearbyCenters: NearbyCenter[] = [
  {
    slug: 'vitry',
    name: 'Centre de Vitry-sur-Seine',
    distance: 'à 9 km',
    formations: 'CACES · AIPR · SST'
  },
  {
    slug: 'melun',
    name: 'Centre de Melun',
    distance: 'à 34 km',
    formations: 'Habilitations · Travaux en hauteur'
  },
  {
    slug: 'massy',
    name: 'Centre de Massy',
    distance: 'à 21 km',
    formations: 'CACES · SST · Incendie'
  }
]
</script>
