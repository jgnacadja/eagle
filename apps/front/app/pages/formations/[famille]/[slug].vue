<template>
  <div>
    <!-- Hero -->
    <section
      class="border-b border-rule bg-linear-to-b from-paper to-surface"
      aria-labelledby="formation-title"
    >
      <div class="mx-auto max-w-container px-gutter-mobile py-2xl md:px-gutter">
        <div class="grid items-start gap-2xl lg:grid-cols-5">
          <div class="lg:col-span-3">
            <p class="text-overline text-accent-text">
              CACES &amp; conduite d'engins · Formation certifiante
            </p>
            <h1 id="formation-title" class="mt-sm font-display text-h1 font-bold text-ink">
              CACES R489 — Conduite de chariots élévateurs
            </h1>
            <p class="mt-md max-w-prose text-body text-ink-body">
              Conduire en sécurité les chariots de manutention à conducteur porté, catégories 1A à
              5, conformément à la recommandation R489 de l'Assurance Maladie.
            </p>

            <ul class="mt-md flex flex-wrap gap-sm">
              <Badge v-for="tag in tags" :key="tag" as="li" variant="chip">{{ tag }}</Badge>
              <Badge as="li" variant="success">
                <span class="h-sm w-sm rounded-full bg-current" aria-hidden="true" />
                Sessions ce mois-ci
              </Badge>
            </ul>

            <!-- CTA desktop — remplacés par la barre fixe en bas d'écran sur mobile -->
            <div class="mt-2xl hidden flex-wrap items-center gap-md lg:flex">
              <Button
                as-child
                class="h-control rounded-full bg-accent px-md py-sm text-button font-semibold text-ink transition hover:bg-accent-text"
              >
                <NuxtLink to="#demande">Demander cette formation</NuxtLink>
              </Button>
              <Button
                as-child
                variant="outline"
                class="h-control rounded-full border-outline bg-paper px-md py-sm text-button font-semibold text-ink transition hover:border-primary hover:bg-paper"
              >
                <NuxtLink to="#sessions">Voir les sessions</NuxtLink>
              </Button>
              <Button
                as-child
                variant="link"
                class="h-auto gap-sm p-0 text-small font-medium text-ink-muted hover:text-ink hover:no-underline"
              >
                <NuxtLink to="#">
                  <IconDownload :size="16" class="inline" />
                  Programme (PDF)
                </NuxtLink>
              </Button>
            </div>
          </div>

          <figure
            class="flex aspect-video items-center justify-center rounded-md border border-dashed border-outline bg-surface-alt text-center text-small text-ink-muted lg:col-span-2 lg:aspect-4/3"
          >
            <figcaption>
              Photo réelle — cariste en manœuvre<span class="hidden lg:inline">
                plateau technique (4:3)</span
              ><span class="lg:hidden"> (16:9)</span>
            </figcaption>
          </figure>
        </div>
      </div>
    </section>

    <!-- Contenu principal -->
    <div class="mx-auto max-w-container px-gutter-mobile py-section md:px-gutter">
      <div class="flex flex-col gap-2xl lg:flex-row">
        <!-- Colonne principale -->
        <div class="min-w-0 flex-1 space-y-2xl">
          <!-- À propos -->
          <section aria-labelledby="apropos-title">
            <h2 id="apropos-title" class="font-display text-h2 font-extrabold text-ink">
              À propos de cette formation
            </h2>
            <div class="mt-md space-y-md text-body text-ink-body">
              <p>
                La conduite de chariots à conducteur porté est encadrée par la recommandation R489.
                Le CACES® atteste des connaissances et du savoir-faire du conducteur pour la ou les
                catégories concernées.
              </p>
              <p>
                La formation alterne apports théoriques et conduite sur plateau technique. Elle
                couvre la formation initiale et le recyclage, en inter-entreprises dans le centre du
                réseau ou en intra sur votre site.
              </p>
            </div>
          </section>

          <!-- Objectifs -->
          <section aria-labelledby="objectifs-title">
            <h2 id="objectifs-title" class="font-display text-h2 font-extrabold text-ink">
              Objectifs pédagogiques
            </h2>
            <ul class="mt-md space-y-sm">
              <li v-for="objectif in objectifs" :key="objectif" class="flex gap-sm">
                <IconCheck :size="20" class="mt-xs shrink-0 text-success" />
                <span class="text-body text-ink-body">{{ objectif }}</span>
              </li>
            </ul>
          </section>

          <!-- Public & prérequis -->
          <section aria-label="Public et prérequis">
            <div class="grid gap-md sm:grid-cols-2">
              <Card class="rounded-md bg-surface">
                <CardHeader class="p-lg pb-0">
                  <h3 class="font-sans text-h4 font-semibold text-ink">Public concerné</h3>
                </CardHeader>
                <CardContent class="p-lg pt-sm">
                  <ul class="space-y-sm text-small text-ink-body">
                    <li v-for="item in publicConcerne" :key="item">· {{ item }}</li>
                  </ul>
                </CardContent>
              </Card>
              <Card class="rounded-md bg-surface">
                <CardHeader class="p-lg pb-0">
                  <h3 class="font-sans text-h4 font-semibold text-ink">Prérequis</h3>
                </CardHeader>
                <CardContent class="p-lg pt-sm">
                  <ul class="space-y-sm text-small text-ink-body">
                    <li v-for="item in prerequis" :key="item">· {{ item }}</li>
                  </ul>
                  <p class="mt-sm text-meta text-ink-subtle">
                    Sans prérequis, le bloc affiche « Aucun prérequis particulier » — jamais vide
                    (§17).
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          <!-- Programme -->
          <section aria-labelledby="programme-title">
            <div class="flex flex-wrap items-baseline justify-between gap-md">
              <h2 id="programme-title" class="font-display text-h2 font-extrabold text-ink">
                Programme
              </h2>
              <p class="text-small text-ink-subtle">
                Exemple : initial catégorie 3 — 21 heures — 3 jours
              </p>
            </div>

            <div
              class="mt-md divide-y divide-rule overflow-hidden rounded-md border border-rule bg-paper"
            >
              <details
                v-for="(module, index) in programme"
                :key="module.title"
                class="group"
                :open="index === 0"
              >
                <summary
                  class="flex cursor-pointer list-none items-center gap-md p-lg [&::-webkit-details-marker]:hidden"
                >
                  <span
                    class="flex h-xl w-xl shrink-0 items-center justify-center rounded-full bg-primary-dark text-small font-semibold text-ink-inverse"
                    aria-hidden="true"
                  >
                    {{ index + 1 }}
                  </span>
                  <span class="min-w-0 flex-1">
                    <span class="block font-semibold text-ink">{{ module.title }}</span>
                    <span class="block text-small text-ink-muted">{{ module.description }}</span>
                  </span>
                  <span class="shrink-0 text-small text-ink-subtle">{{ module.duration }}</span>
                  <IconChevronDown
                    :size="16"
                    class="shrink-0 text-ink-subtle transition-transform group-open:rotate-180"
                  />
                </summary>
              </details>
            </div>
          </section>

          <!-- Modalités & évaluation -->
          <section aria-label="Modalités pédagogiques et évaluation">
            <div class="grid gap-md sm:grid-cols-2">
              <Card class="rounded-md">
                <CardHeader class="p-lg pb-0">
                  <h3 class="font-sans text-h4 font-semibold text-ink">Modalités pédagogiques</h3>
                </CardHeader>
                <CardContent class="space-y-md p-lg pt-md">
                  <div v-for="modalite in modalites" :key="modalite.title" class="flex gap-sm">
                    <component :is="modalite.icon" :size="20" class="mt-xs shrink-0 text-primary" />
                    <p class="text-small text-ink-body">
                      <span class="font-medium text-ink">{{ modalite.title }}</span>
                      {{ modalite.description }}
                    </p>
                  </div>
                  <p class="text-meta text-ink-subtle">
                    Modalité distancielle non proposée pour cette formation « non affichée »
                    (RG-CAT-08).
                  </p>
                </CardContent>
              </Card>
              <Card class="rounded-md">
                <CardHeader class="p-lg pb-0">
                  <h3 class="font-sans text-h4 font-semibold text-ink">Évaluation</h3>
                </CardHeader>
                <CardContent class="p-lg pt-md">
                  <ol class="space-y-sm">
                    <li v-for="(etape, index) in evaluation" :key="etape" class="flex gap-sm">
                      <span
                        class="flex h-lg w-lg shrink-0 items-center justify-center rounded-full text-meta font-semibold text-ink-inverse"
                        :class="index === evaluation.length - 1 ? 'bg-success' : 'bg-primary-dark'"
                        aria-hidden="true"
                      >
                        {{ index + 1 }}
                      </span>
                      <span class="text-small text-ink-body">{{ etape }}</span>
                    </li>
                  </ol>
                </CardContent>
              </Card>
            </div>
          </section>

          <!-- Prochaines sessions -->
          <section id="sessions" aria-labelledby="sessions-title">
            <h2 id="sessions-title" class="font-display text-h2 font-extrabold text-ink">
              Prochaines sessions
            </h2>
            <p class="mt-xs text-small text-ink-subtle">
              Sessions inter-entreprises publiées — disponibilités actualisées en continu.
            </p>

            <ul class="mt-md space-y-md">
              <li v-for="session in sessions" :key="session.title">
                <SessionCard
                  :day="session.day"
                  :month="session.month"
                  :title="session.title"
                  :meta="session.meta"
                  :places="session.places"
                  :type="session.type"
                  :price="session.price"
                  :price-note="session.priceNote"
                />
              </li>
            </ul>

            <Button
              as-child
              variant="link"
              class="mt-md h-auto p-0 text-small font-bold text-primary hover:text-ink hover:no-underline"
            >
              <NuxtLink to="#">Voir toutes les sessions de cette formation →</NuxtLink>
            </Button>
          </section>

          <!-- Où suivre cette formation -->
          <section aria-labelledby="centres-title">
            <h2 id="centres-title" class="font-display text-h2 font-extrabold text-ink">
              Où suivre cette formation ?
            </h2>
            <p class="mt-xs text-small text-ink-subtle">
              Centres du réseau proposant cette formation — rattachements actifs uniquement
              (RG-CAT-04).
            </p>

            <div class="mt-md grid gap-md sm:grid-cols-3">
              <Card v-for="centre in centres" :key="centre.name" class="rounded-md">
                <CardContent class="flex items-center gap-md p-md sm:block sm:p-lg">
                  <div class="min-w-0 flex-1">
                    <div class="flex items-start justify-between gap-sm">
                      <h3 class="font-sans text-h4 font-semibold text-ink">{{ centre.name }}</h3>
                      <span class="hidden shrink-0 text-right text-meta text-ink-subtle sm:block">
                        {{ centre.department }}
                      </span>
                    </div>
                    <p class="mt-xs text-small text-ink-muted sm:hidden">
                      {{ centre.department }} · {{ centre.modalitiesShort }}
                    </p>
                    <p class="mt-sm hidden text-small text-ink-muted sm:block">
                      {{ centre.modalities }}
                    </p>
                    <p
                      v-if="centre.statusType !== 'neutral'"
                      class="mt-sm hidden items-center gap-xs text-small sm:flex"
                      :class="centre.statusType === 'warning' ? 'text-warning' : 'text-success'"
                    >
                      <span class="h-sm w-sm rounded-full bg-current" aria-hidden="true" />
                      {{ centre.status }}
                    </p>
                    <Badge v-else variant="neutral" class="mt-sm hidden sm:inline-flex">
                      {{ centre.status }}
                    </Badge>
                    <span class="mt-sm hidden text-small font-bold text-primary sm:block">
                      Voir le centre →
                    </span>
                  </div>
                  <div class="flex shrink-0 items-center gap-xs sm:hidden">
                    <Badge :variant="centre.statusType">
                      <span
                        v-if="centre.statusType === 'success'"
                        class="h-sm w-sm rounded-full bg-current"
                        aria-hidden="true"
                      />
                      <span v-else-if="centre.statusType === 'warning'" aria-hidden="true">
                        ▲
                      </span>
                      {{ centre.statusShort }}
                    </Badge>
                    <IconChevronRight :size="15" class="text-primary" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          <!-- Bandeau CTA -->
          <CtaBanner
            title="Vous ne savez pas quelle formation choisir ?"
            text="Décrivez votre besoin : LEARN UP identifie la formation, la catégorie et le format adaptés à votre situation."
          >
            <Button
              as-child
              class="h-control w-full rounded-md bg-paper px-md py-sm text-button font-semibold text-ink transition hover:bg-surface sm:w-auto"
            >
              <NuxtLink to="#">Être guidé dans mon choix</NuxtLink>
            </Button>
            <Button
              as-child
              variant="outline"
              class="h-control w-full rounded-md border-outline-inverse bg-transparent px-md py-sm text-button font-semibold text-ink-inverse transition hover:bg-transparent hover:text-ink-inverse sm:w-auto"
            >
              <NuxtLink to="#">Parler à un conseiller</NuxtLink>
            </Button>
          </CtaBanner>

          <!-- Formations similaires -->
          <section aria-labelledby="similaires-title">
            <div class="flex flex-wrap items-baseline justify-between gap-md">
              <h2 id="similaires-title" class="font-display text-h2 font-extrabold text-ink">
                Formations similaires
              </h2>
              <Button
                as-child
                variant="link"
                class="h-auto p-0 text-small font-bold text-primary hover:text-ink hover:no-underline"
              >
                <NuxtLink to="#">Voir la famille CACES &amp; conduite d'engins →</NuxtLink>
              </Button>
            </div>
            <div class="mt-md grid gap-md sm:grid-cols-3">
              <CenterFormationCard
                v-for="similaire in similaires"
                :key="similaire.title"
                :family="similaire.family"
                :title="similaire.title"
                :meta="similaire.meta"
              />
            </div>
          </section>
        </div>

        <!-- Barre latérale -->
        <aside
          class="w-full shrink-0 space-y-lg self-start lg:sticky lg:top-lg lg:w-callout"
          aria-label="Informations complémentaires"
        >
          <!-- L'essentiel -->
          <section id="demande" aria-labelledby="essentiel-title">
            <Card class="rounded-md bg-surface">
              <CardHeader class="p-lg pb-0">
                <h2 id="essentiel-title" class="font-sans text-h4 font-semibold text-ink">
                  L'essentiel
                </h2>
              </CardHeader>
              <CardContent class="p-lg pt-md">
                <dl class="space-y-sm text-small">
                  <div
                    v-for="item in essentiel"
                    :key="item.label"
                    class="flex justify-between gap-md"
                  >
                    <dt class="text-ink-muted">{{ item.label }}</dt>
                    <dd class="text-right font-medium text-ink">{{ item.value }}</dd>
                  </div>
                </dl>
                <div class="mt-lg space-y-sm">
                  <Button
                    as-child
                    class="h-control w-full rounded-md bg-primary-dark px-md py-sm text-button font-semibold text-ink-inverse transition hover:bg-primary"
                  >
                    <NuxtLink to="#">Demander cette formation</NuxtLink>
                  </Button>
                  <Button
                    as-child
                    variant="outline"
                    class="h-control w-full rounded-md border-outline bg-paper px-md py-sm text-button font-semibold text-ink transition hover:border-primary hover:bg-paper"
                  >
                    <NuxtLink to="#">Parler à un conseiller</NuxtLink>
                  </Button>
                </div>
                <p class="mt-sm text-meta leading-relaxed text-ink-subtle">
                  Le contexte de la formation est transmis automatiquement avec la demande — sans
                  ressaisie (RG-CAT-05).
                </p>
              </CardContent>
            </Card>
          </section>

          <!-- Certification -->
          <section aria-labelledby="certification-title">
            <Card class="rounded-md">
              <CardHeader class="p-lg pb-0">
                <h2 id="certification-title" class="font-sans text-h4 font-semibold text-ink">
                  Certification
                </h2>
              </CardHeader>
              <CardContent class="p-lg pt-md">
                <div class="flex gap-sm">
                  <span
                    class="flex h-control-sm w-control-sm shrink-0 items-center justify-center rounded-full bg-accent-soft"
                    aria-hidden="true"
                  >
                    <IconAward :size="20" class="text-accent-text" />
                  </span>
                  <div>
                    <p class="text-small font-medium text-ink">
                      CACES® R489 — chariots de manutention
                    </p>
                    <p class="mt-xs text-small text-ink-muted">
                      Délivré par un organisme testeur certifié, par catégorie présentée. Validité 5
                      ans, recyclage avant échéance.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          <!-- Formation en intra -->
          <section class="rounded-md bg-primary-dark p-lg" aria-labelledby="intra-title">
            <h2 id="intra-title" class="font-sans text-h4 font-semibold text-ink-inverse">
              Formation en intra
            </h2>
            <p class="mt-sm text-small leading-relaxed text-ink-inverse/70">
              Cette formation peut être organisée dans votre entreprise, sur vos équipements. Le
              formulaire conserve la formation et le besoin — le centre n'est pas imposé.
            </p>
            <Button
              as-child
              class="mt-md h-control w-full rounded-md bg-paper px-md py-sm text-button font-semibold text-ink transition hover:bg-surface"
            >
              <NuxtLink to="#">Organiser cette formation dans mon entreprise</NuxtLink>
            </Button>
          </section>

          <!-- Programme PDF -->
          <Button
            as-child
            variant="outline"
            class="h-control w-full gap-sm rounded-md border-rule bg-paper px-md py-sm text-small font-medium text-ink transition hover:border-outline hover:bg-paper"
          >
            <NuxtLink to="#">
              <IconDownload :size="16" />
              Télécharger le programme détaillé (PDF)
            </NuxtLink>
          </Button>
        </aside>
      </div>
    </div>

    <!-- Barre CTA fixe mobile -->
    <div class="fixed inset-x-0 bottom-0 z-10 border-t border-rule bg-paper p-lg lg:hidden">
      <div class="flex items-center justify-between gap-md">
        <div class="min-w-0">
          <p class="font-semibold text-ink">{{ stickyPrice }}</p>
          <p class="text-small text-ink-muted">{{ stickySessions }}</p>
        </div>
        <Button
          as-child
          class="h-control shrink-0 rounded-full bg-accent px-md py-sm text-button font-semibold text-ink transition hover:bg-accent-text"
        >
          <NuxtLink to="#demande">Demander cette formation</NuxtLink>
        </Button>
      </div>
    </div>
    <div class="h-4xl lg:hidden" aria-hidden="true" />
  </div>
</template>

<script setup lang="ts">
import IconBuilding from '~/components/icons/IconBuilding.vue'
import IconFactory from '~/components/icons/IconFactory.vue'

interface Session {
  day: string
  month: string
  title: string
  meta: string
  price: string
  priceNote: string
  places: number
  type: 'success' | 'warning'
}

interface CentreItem {
  name: string
  department: string
  modalities: string
  modalitiesShort: string
  status: string
  statusShort: string
  statusType: 'success' | 'warning' | 'neutral'
}

interface Similaire {
  family: string
  title: string
  meta: string
}

definePageMeta({
  layout: 'with-breadcrumb',
  breadcrumb: [
    { label: 'Accueil', to: '/' },
    { label: 'Formations', to: '/formations' },
    { label: 'CACES & conduite d’engins', to: '/formations/caces-conduite-engins' },
    { label: 'CACES R489 — chariots élévateurs' }
  ]
})

const route = useRoute()

// Maquette : seule la fiche CACES R489 existe tant que le catalogue formations
// n'est pas branché — 404 pour tout autre slug.
if (route.params.slug !== 'caces-r489-chariots-elevateurs') {
  throw createError({ statusCode: 404, statusMessage: 'Page introuvable' })
}

useContentSeo(
  {
    seo_title: 'CACES R489 — Conduite de chariots élévateurs',
    seo_description:
      'Conduire en sécurité les chariots de manutention à conducteur porté, catégories 1A à 5, conformément à la recommandation R489.'
  },
  'CACES R489 — Conduite de chariots élévateurs'
)

const tags = [
  '2 à 5 jours selon catégories',
  'Présentiel · inter / intra',
  'CACES® — validité 5 ans'
]

const objectifs = [
  'Comprendre la réglementation applicable et les responsabilités du conducteur.',
  "Identifier les risques liés à l'utilisation d'un chariot de manutention.",
  'Mettre en œuvre les vérifications de prise et de fin de poste, la conduite et les manœuvres en sécurité.',
  'Évaluer et rendre compte des anomalies et difficultés rencontrées.'
]

const publicConcerne = [
  'Caristes débutants ou expérimentés',
  'Salariés des fonctions logistique, production, magasinage',
  'Nouveaux arrivants amenés à conduire un chariot',
  "Personnes soumises à l'obligation de renouvellement (recyclage)"
]

const prerequis = [
  'Être âgé de 18 ans minimum',
  'Aptitude médicale à la conduite délivrée par la médecine du travail',
  'Comprendre le français (consignes écrites et orales)'
]

const programme = [
  {
    title: 'Réglementation et prévention des risques',
    description:
      'Rôles des instances, responsabilités du conducteur, dispositifs de sécurité, EPI.',
    duration: '3,5 h · théorie'
  },
  {
    title: 'Technologie et fonctionnement des chariots',
    description: 'Catégories, organes de service, stabilité, plaque de charge, vérifications.',
    duration: '3,5 h · théorie'
  },
  {
    title: 'Conduite, circulation et manutention',
    description: 'Prise de poste, circulation à vide et en charge, gerbage, stockage, chargement.',
    duration: '10,5 h · pratique'
  },
  {
    title: 'Tests CACES® théorique et pratique',
    description: 'Épreuves conformes au référentiel R489, par catégorie présentée.',
    duration: '3,5 h · évaluation'
  }
]

const modalites = [
  {
    icon: IconBuilding,
    title: 'Inter, en centre.',
    description: 'Sessions planifiées sur plateau technique, engins fournis.'
  },
  {
    icon: IconFactory,
    title: 'Intra, sur site.',
    description: 'Dans votre entreprise, sur vos équipements et vos flux réels.'
  }
]

const evaluation = [
  'Test théorique — questionnaire conforme au référentiel R489.',
  'Épreuve pratique — manœuvres en situation, par catégorie.',
  'Délivrance du CACES® en cas de réussite aux deux épreuves.'
]

const sessions: Session[] = [
  {
    day: '12',
    month: 'Sept',
    title: 'Initial · catégorie 3 — Centre de Créteil (94)',
    meta: '3 jours · 21 h · 08h30–16h30 · présentiel',
    price: '690 €',
    priceNote: 'HT / participant',
    places: 5,
    type: 'success'
  },
  {
    day: '19',
    month: 'Sept',
    title: 'Recyclage · catégories 1A-3-5 — Centre de Vitry-sur-Seine (94)',
    meta: '2 jours · 14 h · 08h30–16h30 · présentiel',
    price: '490 €',
    priceNote: 'HT / participant',
    places: 2,
    type: 'warning'
  },
  {
    day: '03',
    month: 'Oct',
    title: 'Initial · catégories 3 + 5 — Centre de Melun (77)',
    meta: '5 jours · 35 h · 08h30–16h30 · présentiel',
    price: '1 090 €',
    priceNote: 'HT / participant',
    places: 8,
    type: 'success'
  }
]

const centres: CentreItem[] = [
  {
    name: 'Centre de Créteil',
    department: 'Val-de-Marne',
    modalities: 'Inter en centre · intra',
    modalitiesShort: 'inter / intra',
    status: '4 sessions à venir',
    statusShort: '4 sessions',
    statusType: 'success'
  },
  {
    name: 'Centre de Vitry-sur-Seine',
    department: 'Val-de-Marne',
    modalities: 'Inter en centre · intra',
    modalitiesShort: 'inter / intra',
    status: 'Prochaine session le 19/09',
    statusShort: 'dès 19/09',
    statusType: 'warning'
  },
  {
    name: 'Centre de Melun',
    department: 'Seine-et-Marne',
    modalities: 'Inter en centre · intra',
    modalitiesShort: 'inter / intra',
    status: 'Sur demande',
    statusShort: 'Sur demande',
    statusType: 'neutral'
  }
]

const similaires: Similaire[] = [
  {
    family: "CACES · Conduite d'engins",
    title: 'CACES R485 — gerbeurs à conducteur accompagnant',
    meta: '1 à 2 jours · Inter / intra'
  },
  {
    family: "CACES · Conduite d'engins",
    title: 'CACES R482 — engins de chantier',
    meta: '2 à 10 jours · Inter / intra'
  },
  {
    family: 'Levage · Manutention',
    title: 'Pont roulant R484 — commande au sol',
    meta: '1 à 2 jours · Inter / intra'
  }
]

const essentiel = [
  { label: 'Durée', value: '14 à 35 h — 2 à 5 jours' },
  { label: 'Modalité', value: 'Présentiel · inter / intra' },
  { label: 'Certification', value: 'CACES® R489' },
  { label: 'Validité', value: '5 ans · recyclage' },
  { label: 'Tarif inter', value: 'À partir de 490 € HT' },
  { label: 'Financement', value: 'OPCO · plan de développement' }
]

const stickyPrice = essentiel.find((item) => item.label === 'Tarif inter')?.value ?? ''
const firstSession = sessions[0]
const stickySessions = firstSession
  ? `Sessions dès le ${firstSession.day} ${firstSession.month.toLowerCase()}.`
  : ''
</script>
