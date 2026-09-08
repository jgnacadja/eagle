<template>
  <div class="bg-paper-warm flex flex-1 flex-col">
    <template v-if="pageState === 'found'">
      <div class="mx-auto w-full max-w-container px-gutter-mobile py-2xl md:px-gutter">
        <div class="lg:grid lg:grid-cols-12 lg:gap-2xl">
          <!-- Colonne article -->
          <article class="lg:col-span-8">
            <header class="max-w-prose">
              <p class="text-overline text-accent-text">
                <span class="font-bold uppercase">{{ article.category }}</span>
                <span class="font-medium text-ink-subtle">
                  <span class="mx-xs">·</span>{{ article.date }} <span class="mx-xs">·</span
                  >{{ article.readingTime }}
                </span>
              </p>
              <h1
                class="mt-sm font-display text-h2 font-extrabold leading-tight text-ink lg:text-h1"
              >
                {{ article.title }}
              </h1>
              <div class="mt-md h-0.75 flex-1 bg-accent w-16" aria-hidden="true" />
              <p class="mt-md text-body text-ink-body">{{ article.excerpt }}</p>
            </header>

            <!-- Auteur + actions -->
            <div class="mt-lg flex items-center justify-between border-y border-rule py-md">
              <div class="flex items-center gap-md">
                <span
                  class="flex h-xl w-xl items-center justify-center rounded-full bg-primary text-meta font-semibold text-paper"
                  aria-hidden="true"
                  >LU</span
                >
                <div class="text-small">
                  <p class="font-semibold text-ink">{{ article.author }}</p>
                  <p class="text-ink-muted">{{ article.dates }}</p>
                </div>
              </div>
              <div class="flex items-center gap-md text-ink-subtle">
                <Button
                  type="button"
                  variant="ghost"
                  aria-label="Partager l'article"
                  class="h-control-sm w-control-sm rounded-full border border-primary/25 p-0 hover:bg-surface hover:text-ink"
                  @click="onShare"
                >
                  <IconShare :size="18" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  aria-label="Copier le lien de l'article"
                  class="h-control-sm w-control-sm rounded-full border border-primary/25 p-0 hover:bg-surface hover:text-ink"
                  @click="onCopyLink"
                >
                  <IconLink :size="18" />
                </Button>
              </div>
            </div>

            <!-- Image de couverture -->
            <figure class="mt-lg">
              <div
                class="flex aspect-video items-center justify-center rounded-md border border-dashed border-outline bg-surface-alt text-center text-small text-ink-muted"
              >
                {{ article.imageLabel }}
              </div>
              <figcaption class="mt-sm text-meta text-ink-subtle">
                {{ article.imageCaption }}
              </figcaption>
            </figure>

            <!-- Corps de l'article -->
            <div class="mt-2xl max-w-prose space-y-xl text-body text-ink-body">
              <section
                v-for="section in article.sections"
                :id="section.id"
                :key="section.id"
                :aria-labelledby="`${section.id}-heading`"
              >
                <h2 :id="`${section.id}-heading`" class="text-h3 font-extrabold text-ink">
                  {{ section.heading }}
                </h2>
                <p v-for="paragraph in section.paragraphs" :key="paragraph" class="mt-md">
                  {{ paragraph }}
                </p>
              </section>

              <!-- Encart « À retenir » -->
              <aside
                class="rounded-sm border border-accent/40 bg-accent-soft p-lg"
                aria-labelledby="a-retenir-heading"
              >
                <h2
                  id="a-retenir-heading"
                  class="text-small font-bold uppercase tracking-wide text-ink"
                >
                  À retenir
                </h2>
                <ul class="mt-sm list-disc space-y-xs pl-lg text-small text-ink-body">
                  <li v-for="point in article.keyPoints" :key="point">{{ point }}</li>
                </ul>
              </aside>

              <!-- Formation liée — mobile uniquement -->
              <Card class="p-lg lg:hidden">
                <p class="text-overline text-ink-subtle">Formation liée</p>
                <p class="mt-xs text-meta font-medium text-ink-muted">
                  {{ article.relatedFormation.family }}
                </p>
                <h3 class="mt-xs text-h4 font-bold text-ink">
                  {{ article.relatedFormation.title }}
                </h3>
                <p class="mt-xs text-meta text-ink-muted">{{ article.relatedFormation.meta }}</p>
                <NuxtLink
                  :to="article.relatedFormation.to"
                  class="mt-lg block h-control rounded-full bg-primary px-lg text-center text-small font-semibold leading-11 text-paper hover:bg-primary-dark"
                >
                  Voir la formation
                </NuxtLink>
              </Card>

              <!-- Mots-clés -->
              <nav aria-label="Mots-clés de l'article" class="flex flex-wrap gap-sm pt-sm">
                <Badge v-for="tag in article.tags" :key="tag" variant="chip">{{ tag }}</Badge>
              </nav>
            </div>
          </article>

          <!-- Sidebar — desktop uniquement -->
          <aside class="hidden lg:col-span-4 lg:block" aria-label="Informations complémentaires">
            <div class="sticky top-lg space-y-lg">
              <Card class="p-lg" role="navigation" aria-labelledby="dans-cet-article-heading">
                <h2 id="dans-cet-article-heading" class="text-overline text-ink-subtle uppercase">
                  Dans cet article
                </h2>
                <ul class="mt-md space-y-md text-small">
                  <li v-for="(section, index) in article.sections" :key="section.id">
                    <a
                      :href="`#${section.id}`"
                      :class="
                        index === 0
                          ? 'font-bold text-ink'
                          : 'text-ink-body hover:text-ink hover:underline'
                      "
                      :aria-current="index === 0 ? 'true' : undefined"
                    >
                      {{ section.heading }}
                    </a>
                  </li>
                </ul>
              </Card>

              <CenterFormationCard
                eyebrow="Formation liée"
                variant="button"
                :family="article.relatedFormation.family"
                :title="article.relatedFormation.title"
                :meta="article.relatedFormation.meta"
                :status="article.relatedFormation.status"
                :to="article.relatedFormation.to"
              />

              <Card class="bg-primary-dark p-lg text-paper">
                <h3 class="text-small font-bold">Un doute sur vos échéances ?</h3>
                <p class="mt-sm text-small text-paper/70">
                  Transmettez vos dates de délivrance : un conseiller planifie les recyclages en
                  série avec vos équipes.
                </p>
                <NuxtLink
                  to="/centres/demande-de-formation"
                  class="mt-lg block h-control rounded-full bg-paper px-lg text-center text-small font-semibold leading-11 text-ink hover:bg-paper/90"
                >
                  Parler à un conseiller
                </NuxtLink>
              </Card>
            </div>
          </aside>
        </div>
      </div>

      <!-- À lire ensuite — pleine largeur, fond blanc -->
      <section aria-labelledby="lire-ensuite-heading" class="bg-paper">
        <div class="mx-auto w-full max-w-container px-gutter-mobile py-2xl md:px-gutter">
          <div class="flex items-center justify-between">
            <h2 id="lire-ensuite-heading" class="font-display text-h3 font-extrabold text-ink">
              À lire ensuite
            </h2>
            <NuxtLink
              to="/actualites"
              class="hidden text-small font-semibold text-ink hover:underline sm:inline"
            >
              Toute l'actualité →
            </NuxtLink>
          </div>
          <ul class="mt-lg grid grid-cols-1 gap-lg sm:grid-cols-3">
            <li
              v-for="related in article.related"
              :key="related.slug"
              class="border-t border-accent-text/30 pt-md"
            >
              <article>
                <p class="text-overline text-accent-text">
                  <span class="font-bold uppercase">{{ related.source }}</span>
                  <span class="font-medium text-ink-subtle">
                    <span class="mx-xs">·</span>{{ related.date }}
                  </span>
                </p>
                <h3 class="mt-xs text-small font-bold leading-snug text-ink">
                  <NuxtLink :to="`/actualites/${related.slug}`" class="hover:underline">
                    {{ related.title }}
                  </NuxtLink>
                </h3>
              </article>
            </li>
          </ul>
        </div>
      </section>
    </template>

    <!-- État : erreur de chargement -->
    <LoadError
      v-else-if="loadError"
      title="L'article n'a pas pu être chargé."
      link-to="/actualites"
      link-label="Voir toute l'actualité"
      @retry="retry"
    >
      Le problème est temporaire. Vous pouvez réessayer, ou consulter toute l'actualité du réseau.
    </LoadError>

    <!-- État : article introuvable -->
    <NotFound
      v-else
      title="Cet article n'est pas disponible."
      primary-to="/actualites"
      primary-label="Voir toute l'actualité"
      secondary-to="/formations"
      secondary-label="Trouver ma formation"
      search-placeholder="Titre, mot-clé ou catégorie d'article"
      search-label="Rechercher un article"
      search-input-id="article-search"
      @search="onErrorSearch"
    >
      <template #icon>
        <IconFileOff :size="32" class="text-ink" />
      </template>
      La page demandée n'existe pas ou n'est plus publiée. L'actualité du réseau reste accessible.
    </NotFound>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'with-breadcrumb'
})

const route = useRoute()
const slug = route.params.slug as string

// Maquette : seul l'article « recyclage-caces-echeances-2027 » existe tant que la
// collection articles n'est pas branchée — null pour tout autre slug (état introuvable).
// ?error=1 simule une erreur de chargement pour prévisualiser l'état erreur.
const KNOWN_SLUG = 'recyclage-caces-echeances-2027'
const {
  data: articleData,
  error: loadError,
  refresh
} = await useAsyncData(`article-${slug}`, () => {
  if (route.query.error === '1') {
    return Promise.reject(new Error('Article load failed'))
  }
  return Promise.resolve(slug === KNOWN_SLUG ? { slug } : null)
})

type PageState = 'found' | 'not-found' | 'error'
const pageState = computed<PageState>(() => {
  if (loadError.value) return 'error'
  return articleData.value ? 'found' : 'not-found'
})

// Statut HTTP côté SSR selon l'état affiché.
const requestEvent = useRequestEvent()
if (requestEvent) {
  if (pageState.value === 'error') {
    setResponseStatus(requestEvent, 500, "Erreur de chargement de l'article")
  } else if (pageState.value === 'not-found') {
    setResponseStatus(requestEvent, 404, 'Article introuvable')
  }
}

// Maquette : contenu statique en attendant le branchement Directus (collection articles).
const article = {
  category: 'Réglementation & obligations',
  date: '2 sept. 2026',
  readingTime: '4 min',
  title: 'Recyclage CACES : comment anticiper les échéances 2027 sans immobiliser vos équipes',
  excerpt:
    "Un volume important de CACES® délivrés en 2022 arrive à échéance en 2027. Planifier les recyclages dès maintenant permet d'étaler les absences, de sécuriser les autorisations de conduite et de lisser le budget formation.",
  author: 'Équipe réglementation LEARN UP ACADEMY',
  dates: 'Publié le 2 sept. 2026 · mis à jour le 3 sept. 2026',
  imageLabel: 'Photo réelle — atelier d’évaluation pratique CACES',
  imageCaption: 'Session d’évaluation pratique, centre administratif.',
  sections: [
    {
      id: 'pourquoi',
      heading: 'Pourquoi 2027 concentre les échéances',
      paragraphs: [
        'Les CACES® délivrés lors de la vague de reprise de 2022 ont une validité de 5 ans (10 ans pour le R482). Mécaniquement, les renouvellements se concentrent donc sur 2027, avec un risque de saturation des sessions au premier semestre.',
        'Un conducteur dont le CACES® expire ne peut plus recevoir d’autorisation de conduite. L’anticipation évite l’arrêt de poste et le passage en formation initiale, plus longue et plus coûteuse qu’un recyclage.'
      ]
    },
    {
      id: 'etaler',
      heading: 'Comment étaler les recyclages',
      paragraphs: [
        'Recenser les échéances par site et par catégorie, puis constituer des groupes mixtes, et compléter avec les sessions inter du réseau pour les effectifs isolés.',
        'Les sessions inter du réseau permettent de compléter les groupes intra sans immobiliser vos équipes le temps de remplir des sessions dédiées à votre entreprise — un calendrier planifié près de chez vous, sans attendre un groupe complet.'
      ]
    }
  ],
  keyPoints: [
    'Vérifiez les dates de délivrance dès cet automne',
    'Le recyclage se planifie 3 à 6 mois avant l’échéance',
    '2 jours suffisent en multi-catégories'
  ],
  tags: ['CACES R489', 'Recyclage', 'Autorisation de conduite'],
  relatedFormation: {
    family: 'CACES · Conduite d’engins',
    title: 'Recyclage CACES R489 — toutes catégories',
    meta: '2 jours · Inter / Intra',
    status: { type: 'success' as const, label: 'Sessions ce mois-ci' },
    to: '/formations/caces-conduite-engins/caces-r489-chariots-elevateurs'
  },
  related: [
    {
      slug: 'habilitations-nf-c-18-510',
      source: 'Réglementation',
      date: '14 août 2026',
      title: 'Habilitations électriques : ce que change la nouvelle NF C 18-510'
    },
    {
      slug: 'aipr-qui-former',
      source: 'Réglementation',
      date: '31 juillet 2026',
      title: 'AIPR : qui doit être formé sur vos chantiers ?'
    },
    {
      slug: 'plateau-pemp-creteil',
      source: 'Centre de Créteil',
      date: '26 août 2026',
      title: 'Nouveau plateau technique nacelles PEMP à Créteil'
    }
  ]
}

// Breadcrumb adapté à l'état affiché. route.meta est partagé entre toutes
// les routes /actualites/:slug : on réassigne la valeur à chaque changement
// d'état pour ne pas conserver le breadcrumb d'un slug précédent.
const defaultBreadcrumb = [
  { label: 'Accueil', to: '/' },
  { label: 'Actualités', to: '/actualites' },
  { label: article.category },
  { label: article.title }
]
const stateLabels: Record<Exclude<PageState, 'found'>, string> = {
  'not-found': 'Article introuvable',
  error: 'Erreur de chargement'
}
watchEffect(() => {
  const stateLabel = pageState.value === 'found' ? null : stateLabels[pageState.value]
  route.meta.breadcrumb = stateLabel
    ? [
        { label: 'Accueil', to: '/' },
        { label: 'Actualités', to: '/actualites' },
        { label: stateLabel }
      ]
    : defaultBreadcrumb
})

const seoByState: Record<
  PageState,
  { seo_title: string; seo_description: string; seo_noindex?: boolean }
> = {
  found: {
    seo_title: `${article.title} | LEARN UP ACADEMY`,
    seo_description: article.excerpt
  },
  'not-found': {
    seo_title: 'Article introuvable',
    seo_description: "Cet article n'existe pas ou n'est plus publié.",
    seo_noindex: true
  },
  error: {
    seo_title: 'Erreur de chargement',
    seo_description: "L'article n'a pas pu être chargé.",
    seo_noindex: true
  }
}
// Getter réactif : le SEO suit pageState si refresh() change l'état affiché.
useContentSeo(
  () => seoByState[pageState.value],
  () => seoByState[pageState.value].seo_title
)

function retry() {
  if (route.query.error) {
    // Retire le paramètre de simulation pour permettre un vrai rechargement.
    const { error: _error, ...query } = route.query
    navigateTo({ path: route.path, query })
  } else {
    refresh()
  }
}

function onErrorSearch(query: string) {
  navigateTo({ path: '/actualites', query: query ? { q: query } : {} })
}

function onShare() {
  // Branchement à venir — la maquette se contente de l'action simulée.
}

function onCopyLink() {
  if (typeof window !== 'undefined') {
    navigator.clipboard?.writeText(window.location.href)
  }
}
</script>
