<template>
  <div class="flex-1">
    <div class="mx-auto max-w-container px-gutter-mobile py-section md:px-gutter">
      <!-- En-tête de page + stepper -->
      <div class="mb-2xl flex items-start justify-between gap-lg">
        <div>
          <h1 class="font-display text-h2 font-extrabold text-ink lg:text-h1">
            Demande de formation
          </h1>
          <p class="mt-sm max-w-prose text-body text-ink-muted">
            La demande est prise en charge par LEARN&nbsp;UP&nbsp;ACADEMY. Réponse sous 24&nbsp;h
            ouvrées.
          </p>
        </div>

        <!-- Stepper -->
        <ol class="hidden shrink-0 items-center gap-sm pt-xs sm:flex" aria-label="Progression">
          <li class="flex items-center gap-sm">
            <span
              class="flex h-xl w-xl items-center justify-center rounded-full bg-primary text-small font-semibold text-ink-inverse"
              aria-current="step"
              >1</span
            >
            <span class="h-px w-xl bg-outline" aria-hidden="true" />
          </li>
          <li class="flex items-center gap-sm">
            <span
              class="flex h-xl w-xl items-center justify-center rounded-full border border-outline text-small font-semibold text-ink-subtle"
              >2</span
            >
            <span class="h-px w-xl bg-outline" aria-hidden="true" />
          </li>
          <li>
            <span
              class="flex h-xl w-xl items-center justify-center rounded-full border border-outline text-success"
            >
              ✓
            </span>
          </li>
        </ol>
      </div>

      <div class="grid grid-cols-1 items-start gap-lg lg:grid-cols-3">
        <!-- Formulaire -->
        <form class="space-y-lg lg:col-span-2" @submit.prevent="onSubmit">
          <!-- Votre besoin -->
          <Card class="p-lg sm:py-lg sm:px-xl">
            <fieldset class="space-y-md">
              <legend
                class="mb-md text-meta font-semibold uppercase tracking-wide text-accent-text"
              >
                Votre besoin
              </legend>

              <div class="grid grid-cols-1 gap-md sm:grid-cols-2">
                <div>
                  <Label for="salaries" class="mb-xs block text-small font-medium text-ink">
                    Salariés à former
                  </Label>
                  <Input
                    id="salaries"
                    v-model="form.salaries"
                    type="number"
                    min="1"
                    class="h-control rounded-full border-outline bg-paper px-md text-small text-ink-body shadow-none focus-visible:ring-primary"
                  />
                </div>
                <div>
                  <Label for="echeance" class="block text-small font-medium text-ink">
                    <span class="mb-xs block">Échéance souhaitée</span>
                    <Select v-model="form.echeance">
                      <SelectTrigger
                        id="echeance"
                        class="h-control w-full rounded-full border-outline bg-paper px-md text-small text-ink-body shadow-none"
                      >
                        <SelectValue placeholder="Choisir une échéance" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem
                          v-for="option in echeanceOptions"
                          :key="option"
                          :value="option"
                          class="text-small"
                        >
                          {{ option }}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </Label>
                </div>
              </div>

              <div>
                <Label for="precisions" class="mb-xs block text-small font-medium text-ink">
                  Précisions <span class="font-normal text-ink-subtle">(facultatif)</span>
                </Label>
                <Textarea
                  id="precisions"
                  v-model="form.precisions"
                  rows="3"
                  placeholder="Contraintes d'horaires, site concerné, niveau des salariés…"
                  class="resize-none"
                />
              </div>
            </fieldset>
          </Card>

          <!-- Votre entreprise -->
          <Card class="p-lg sm:py-lg sm:px-xl">
            <fieldset class="space-y-md">
              <legend
                class="mb-md text-meta font-semibold uppercase tracking-wide text-accent-text"
              >
                Votre entreprise
              </legend>

              <div class="grid grid-cols-1 gap-md sm:grid-cols-2">
                <div>
                  <Label for="raison-sociale" class="mb-xs block text-small font-medium text-ink">
                    Raison sociale
                  </Label>
                  <Input
                    id="raison-sociale"
                    v-model="form.raisonSociale"
                    type="text"
                    placeholder="Nom de l'entreprise"
                    class="h-control rounded-full border-outline bg-paper px-md text-small text-ink-body shadow-none placeholder:text-ink-placeholder focus-visible:ring-primary"
                  />
                </div>
                <div>
                  <Label for="siret" class="mb-xs block text-small font-medium text-ink"
                    >SIRET</Label
                  >
                  <Input
                    id="siret"
                    v-model="form.siret"
                    type="text"
                    inputmode="numeric"
                    placeholder="14 chiffres"
                    class="h-control rounded-full border-outline bg-paper px-md text-small text-ink-body shadow-none placeholder:text-ink-placeholder focus-visible:ring-primary"
                  />
                </div>
              </div>
            </fieldset>
          </Card>

          <!-- Vos coordonnées -->
          <Card class="p-lg sm:py-lg sm:px-xl">
            <fieldset class="space-y-md">
              <legend
                class="mb-md text-meta font-semibold uppercase tracking-wide text-accent-text"
              >
                Vos coordonnées
              </legend>

              <div class="grid grid-cols-1 gap-md sm:grid-cols-2">
                <div>
                  <Label for="nom" class="mb-xs block text-small font-medium text-ink">
                    Nom et prénom
                  </Label>
                  <Input
                    id="nom"
                    v-model="form.nom"
                    type="text"
                    autocomplete="name"
                    class="h-control rounded-full border-outline bg-paper px-md text-small text-ink-body shadow-none focus-visible:ring-primary"
                  />
                </div>
                <div>
                  <Label for="fonction" class="mb-xs block text-small font-medium text-ink">
                    Fonction
                  </Label>
                  <Input
                    id="fonction"
                    v-model="form.fonction"
                    type="text"
                    placeholder="RH, QHSE, direction…"
                    class="h-control rounded-full border-outline bg-paper px-md text-small text-ink-body shadow-none placeholder:text-ink-placeholder focus-visible:ring-primary"
                  />
                </div>
                <div>
                  <Label for="email" class="mb-xs block text-small font-medium text-ink">
                    E-mail professionnel
                  </Label>
                  <Input
                    id="email"
                    v-model="form.email"
                    type="email"
                    autocomplete="email"
                    placeholder="nom@entreprise.fr"
                    class="h-control rounded-full border-outline bg-paper px-md text-small text-ink-body shadow-none placeholder:text-ink-placeholder focus-visible:ring-primary"
                  />
                </div>
                <div>
                  <Label for="telephone" class="mb-xs block text-small font-medium text-ink">
                    Téléphone
                  </Label>
                  <Input
                    id="telephone"
                    v-model="form.telephone"
                    type="tel"
                    autocomplete="tel"
                    placeholder="06 -- -- -- --"
                    class="h-control rounded-full border-outline bg-paper px-md text-small text-ink-body shadow-none placeholder:text-ink-placeholder focus-visible:ring-primary"
                  />
                </div>
              </div>

              <div class="flex items-start gap-sm pt-xs">
                <Checkbox
                  id="consentement"
                  v-model="form.consentement"
                  required
                  class="mt-xs h-md w-md rounded border-outline data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-paper"
                />
                <Label for="consentement" class="text-small font-normal text-ink-muted">
                  J'accepte que ces informations soient utilisées pour le traitement de ma demande
                  de formation.
                  <NuxtLink to="#" class="font-medium text-primary underline underline-offset-2">
                    Politique de confidentialité
                  </NuxtLink>
                </Label>
              </div>
            </fieldset>
          </Card>

          <!-- Envoi -->
          <div class="flex flex-col gap-sm sm:flex-row sm:items-center">
            <Button
              type="submit"
              class="h-control w-full rounded-full bg-accent px-2xl text-small font-semibold text-ink shadow-sm transition hover:bg-accent-text sm:w-auto"
            >
              Envoyer ma demande
            </Button>
            <p class="text-meta text-ink-subtle">
              Demande sans engagement, traitée sous 24&nbsp;h ouvrées.
            </p>
          </div>
        </form>

        <!-- Sidebar : contexte de la demande -->
        <aside class="space-y-lg sm:sticky sm:top-lg">
          <Card class="bg-surface p-lg">
            <div class="mb-lg flex items-center justify-between">
              <h2 class="text-meta font-semibold uppercase tracking-wide text-ink-subtle">
                Votre demande concerne
              </h2>
              <NuxtLink
                :to="modifierTo"
                class="text-small font-medium text-primary underline underline-offset-2"
                @click="saveDraft"
              >
                Modifier
              </NuxtLink>
            </div>

            <ul class="space-y-md text-small">
              <li v-if="centreSlug" class="flex items-start gap-sm">
                <IconMapPin :size="20" class="mt-xs shrink-0 text-primary" />
                <div>
                  <p class="font-medium text-ink">{{ centreName || 'Centre partenaire' }}</p>
                  <p v-if="centreMeta" class="text-ink-muted">{{ centreMeta }}</p>
                </div>
              </li>
              <li v-else class="flex items-start gap-sm">
                <IconMapPin :size="20" class="mt-xs shrink-0 text-primary" />
                <div>
                  <p class="font-medium text-ink">Votre projet de formation</p>
                  <p class="text-ink-muted">
                    Un conseiller identifie le centre et la session adaptés.
                  </p>
                </div>
              </li>
              <li v-if="formationSlug" class="flex items-start gap-sm">
                <IconBook :size="20" class="mt-xs shrink-0 text-primary" />
                <div>
                  <p class="font-medium text-ink">{{ formationName }}</p>
                  <p v-if="formationMeta" class="text-ink-muted">{{ formationMeta }}</p>
                </div>
              </li>
              <li v-if="sessionSlug" class="flex items-start gap-sm">
                <IconCalendar :size="20" class="mt-xs shrink-0 text-primary" />
                <div>
                  <p class="font-medium text-ink">{{ sessionName }}</p>
                  <p v-if="sessionMeta" class="text-ink-muted">{{ sessionMeta }}</p>
                </div>
              </li>
            </ul>
          </Card>

          <Card class="p-lg">
            <ul class="space-y-sm text-small text-ink-muted">
              <li class="flex items-start gap-sm">
                <IconCheck :size="16" class="mt-xs shrink-0 text-success" />
                <span>
                  Ces informations sont jointes à votre demande — vous n'avez rien à ressaisir.
                </span>
              </li>
              <li class="flex items-start gap-sm">
                <IconCheck :size="16" class="mt-xs shrink-0 text-success" />
                <span>
                  Un conseiller LEARN&nbsp;UP&nbsp;ACADEMY organise la suite&nbsp;: devis,
                  convocations, attestations.
                </span>
              </li>
            </ul>
          </Card>
        </aside>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Centre, Course } from '@learnup/types'
import { MODALITY_LABELS } from '~/utils/catalog-filters'

definePageMeta({
  layout: 'with-breadcrumb'
})

const route = useRoute()
const config = useRuntimeConfig()

// Contexte transmis en query params par les CTA (?centre=, ?formation=, ?session=).
// Maquette : libellés résolus depuis les slugs tant que le catalogue n'est pas branché.
// Un param répété (?centre=a&centre=b) produit un tableau — on prend la 1re valeur.
const queryValue = (value: unknown): string | null => {
  const v = Array.isArray(value) ? value[0] : value
  return typeof v === 'string' && v ? v : null
}
const centreSlug = computed(() => queryValue(route.query.centre))
const formationSlug = computed(() => queryValue(route.query.formation))
const sessionSlug = computed(() => queryValue(route.query.session))
const familleSlug = computed(() => queryValue(route.query.famille))

// Libellés résolus dynamiquement : le centre vient de Directus,
// la formation et la session de l'API catalogue.
const centresData = centreSlug.value
  ? await useDirectusList<Centre>('centres', `demande-centre-${centreSlug.value}`, {
      fields: ['name', 'city', 'department', 'postal_code'],
      filter: { slug: { _eq: centreSlug.value }, status: { _eq: 'published' } },
      limit: 1
    })
  : ref<Centre[]>([])
const centre = computed(() => centresData.value[0] ?? null)

const formationData =
  familleSlug.value && formationSlug.value
    ? await useAsyncData(
        `demande-formation-${familleSlug.value}-${formationSlug.value}`,
        async () => {
          try {
            return await $fetch<Course>(
              `${config.public.apiBase}/courses/${familleSlug.value}/${formationSlug.value}`
            )
          } catch (err) {
            if (import.meta.server) {
              logServerError('[demande] formation fetch failed:', err)
            }
            return null
          }
        }
      )
    : { data: ref<Course | null>(null) }
const formation = formationData.data

const session = computed(
  () => formation.value?.sessions?.find((s) => s.id === sessionSlug.value) ?? null
)

const centreName = computed(() => (centreSlug.value ? (centre.value?.name ?? '') : ''))
const centreMeta = computed(() =>
  centre.value
    ? [centre.value.city, centre.value.department, centre.value.postal_code]
        .filter(Boolean)
        .join(' · ')
    : ''
)
// RG04 : pas de valeur de repli — le bloc n'est rendu que si le slug est transmis.
const formationName = computed(() =>
  formationSlug.value ? (formation.value?.title ?? 'Formation du catalogue') : ''
)
const formationMeta = computed(() => {
  const c = formation.value
  if (!formationSlug.value || !c) return ''
  return [c.durationDays ? `${c.durationDays} jours` : null, c.certification, c.certifierName]
    .filter(Boolean)
    .join(' · ')
})
const sessionName = computed(() => {
  if (!sessionSlug.value) return ''
  const start = session.value?.startDate
  if (!start) return 'Session programmée'
  const date = new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC'
  }).format(new Date(`${start}T00:00:00Z`))
  return `Session du ${date}`
})
const sessionMeta = computed(() => {
  const s = session.value
  if (!sessionSlug.value || !s) return ''
  return [
    formation.value?.durationDays ? `${formation.value.durationDays} jours` : null,
    s.modality ? (MODALITY_LABELS[s.modality] ?? s.modality) : null,
    s.location?.city ?? null,
    s.seatsRemaining != null ? `${s.seatsRemaining} places disponibles` : null
  ]
    .filter(Boolean)
    .join(' · ')
})

// RG06 : niveau de contexte le plus profond transmis.
const contextLevel = computed<'centre' | 'formation' | 'session'>(() => {
  if (sessionSlug.value) return 'session'
  if (formationSlug.value) return 'formation'
  return 'centre'
})

// « Modifier » renvoie au point d'origine sans perdre la saisie.
// Pas de repli sur une famille arbitraire : sans ?famille=, on retombe sur le centre.
const formationPath = computed(() =>
  formationSlug.value && familleSlug.value
    ? `/formations/${familleSlug.value}/${formationSlug.value}`
    : null
)
const modifierTo = computed(() => {
  if (contextLevel.value === 'session' && formationPath.value) {
    return `${formationPath.value}#sessions`
  }
  if (contextLevel.value === 'formation' && formationPath.value) {
    return formationPath.value
  }
  return centreSlug.value ? `/centres/${centreSlug.value}` : '/centres'
})

// Breadcrumb : le nom du centre s'affiche quand le contexte est transmis.
const defaultBreadcrumb = [
  { label: 'Accueil', to: '/' },
  { label: 'Centres', to: '/centres' },
  { label: 'Demande de formation' }
]
watchEffect(() => {
  route.meta.breadcrumb = centreSlug.value
    ? [
        { label: 'Accueil', to: '/' },
        { label: 'Centres', to: '/centres' },
        { label: centreName.value, to: `/centres/${centreSlug.value}` },
        { label: 'Demande de formation' }
      ]
    : defaultBreadcrumb
})

useContentSeo(
  {
    seo_title: 'Demande de formation | LEARN UP ACADEMY',
    seo_description:
      'Transmettez votre demande de formation : prise en charge par LEARN UP ACADEMY, réponse sous 24 h ouvrées.',
    // Page formulaire paramétrée : hors indexation.
    seo_noindex: true
  },
  'Demande de formation'
)

const echeanceOptions = ['Septembre 2026', 'Octobre 2026', 'Novembre 2026']

const form = reactive({
  // Input émet string | number : la saisie reste une chaîne tant qu'on ne convertit pas.
  salaries: 8 as string | number,
  echeance: 'Septembre 2026',
  precisions: '',
  raisonSociale: '',
  siret: '',
  nom: '',
  fonction: '',
  email: '',
  telephone: '',
  consentement: false
})

// Persistance de la saisie : le lien « Modifier » renvoie au point d'origine
// sans perdre le formulaire déjà rempli (RG06).
const DRAFT_KEY = 'demande-formation-draft'

function saveDraft() {
  if (typeof window === 'undefined') return
  window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify(form))
}

onMounted(() => {
  const raw = window.sessionStorage.getItem(DRAFT_KEY)
  if (!raw) return
  try {
    const parsed: unknown = JSON.parse(raw)
    if (parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)) {
      Object.assign(form, parsed)
    }
  } catch {
    window.sessionStorage.removeItem(DRAFT_KEY)
  }
})

function onSubmit() {
  // Consentement obligatoire (le submit programmatique contourne la validation native).
  if (!form.consentement) return
  // Branchement API à venir — la maquette se contente de l'envoi simulé.
  if (typeof window !== 'undefined') {
    window.sessionStorage.removeItem(DRAFT_KEY)
  }
}
</script>
