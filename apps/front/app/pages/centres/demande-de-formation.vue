<template>
  <div class="flex-1">
    <div class="mx-auto px-gutter-mobile py-section md:px-gutter">
      <!-- En-tête de page + stepper -->
      <div class="mb-2xl flex items-start justify-between gap-lg">
        <div>
          <h1 class="font-display text-h2 font-extrabold text-ink lg:text-h1">
            Demande de formation
          </h1>
          <p class="mt-sm max-w-prose text-body text-ink-muted">
            La demande est prise en charge par notre réseau nous vous répondons sous 24&nbsp;h
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
        <!-- Confirmation d'envoi -->
        <Card
          v-if="submitted"
          class="flex flex-col items-center gap-lg p-xl text-center lg:col-span-2"
        >
          <p
            class="flex h-4xl w-4xl items-center justify-center rounded-full bg-success-soft text-success"
          >
            <IconCheck :size="32" />
          </p>
          <div>
            <h2 class="font-display text-h3 font-extrabold text-ink">
              Votre demande est transmise
            </h2>
            <p class="mt-sm max-w-prose text-body text-ink-muted">
              Un conseiller LEARN&nbsp;UP&nbsp;ACADEMY prend en charge votre demande et vous
              recontacte sous 24&nbsp;h ouvrées.
            </p>
          </div>
          <div class="flex flex-wrap justify-center gap-md">
            <Button as-child variant="dark" size="pill-lg">
              <NuxtLink to="/">Retour à l'accueil</NuxtLink>
            </Button>
            <Button as-child variant="outline" size="pill-lg">
              <NuxtLink to="/formations">Explorer le catalogue</NuxtLink>
            </Button>
          </div>
        </Card>

        <!-- Formulaire (v-show : jamais démonté — le swap v-if/v-else casse le
             retrait de fragment sous happy-dom en test) -->
        <form
          v-show="!submitted"
          novalidate
          class="space-y-lg lg:col-span-2"
          @submit.prevent="onSubmit"
        >
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
                  <Label for="salaries" class="mb-xs block"> Salariés à former </Label>
                  <Input
                    id="salaries"
                    v-model="salaries"
                    type="number"
                    min="1"
                    variant="field"
                    class="aria-invalid:border-danger"
                    :aria-invalid="showError('salaries') || undefined"
                    :aria-describedby="showError('salaries') ? 'salaries-error' : undefined"
                  />
                  <p
                    v-if="showError('salaries')"
                    id="salaries-error"
                    class="mt-xs text-small font-semibold text-danger"
                  >
                    {{ errors.salaries }}
                  </p>
                </div>
                <div>
                  <Label for="echeance" class="block">
                    <span class="mb-xs block">Échéance souhaitée</span>
                    <Select v-model="echeance">
                      <SelectTrigger
                        id="echeance"
                        variant="field"
                        :aria-invalid="showError('echeance') || undefined"
                        :aria-describedby="showError('echeance') ? 'echeance-error' : undefined"
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
                  <p
                    v-if="showError('echeance')"
                    id="echeance-error"
                    class="mt-xs text-small font-semibold text-danger"
                  >
                    {{ errors.echeance }}
                  </p>
                </div>
              </div>

              <div>
                <Label for="precisions" class="mb-xs block">
                  Précisions <span class="font-normal text-ink-subtle">(facultatif)</span>
                </Label>
                <Textarea
                  id="precisions"
                  v-model="precisions"
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
                  <Label for="raison-sociale" class="mb-xs block"> Raison sociale </Label>
                  <Input
                    id="raison-sociale"
                    v-model="raisonSociale"
                    type="text"
                    placeholder="Nom de l'entreprise"
                    variant="field"
                    class="aria-invalid:border-danger"
                    :aria-invalid="showError('raisonSociale') || undefined"
                    :aria-describedby="
                      showError('raisonSociale') ? 'raison-sociale-error' : undefined
                    "
                  />
                  <p
                    v-if="showError('raisonSociale')"
                    id="raison-sociale-error"
                    class="mt-xs text-small font-semibold text-danger"
                  >
                    {{ errors.raisonSociale }}
                  </p>
                </div>
                <div>
                  <Label for="siret" class="mb-xs block">SIRET</Label>
                  <Input
                    id="siret"
                    v-model="siret"
                    type="text"
                    inputmode="numeric"
                    placeholder="14 chiffres"
                    variant="field"
                    class="aria-invalid:border-danger"
                    :aria-invalid="showError('siret') || undefined"
                    :aria-describedby="showError('siret') ? 'siret-error' : undefined"
                  />
                  <p
                    v-if="showError('siret')"
                    id="siret-error"
                    class="mt-xs text-small font-semibold text-danger"
                  >
                    {{ errors.siret }}
                  </p>
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
                  <Label for="nom" class="mb-xs block"> Nom et prénom </Label>
                  <Input
                    id="nom"
                    v-model="nom"
                    type="text"
                    autocomplete="name"
                    variant="field"
                    class="aria-invalid:border-danger"
                    :aria-invalid="showError('nom') || undefined"
                    :aria-describedby="showError('nom') ? 'nom-error' : undefined"
                  />
                  <p
                    v-if="showError('nom')"
                    id="nom-error"
                    class="mt-xs text-small font-semibold text-danger"
                  >
                    {{ errors.nom }}
                  </p>
                </div>
                <div>
                  <Label for="fonction" class="mb-xs block"> Fonction </Label>
                  <Input
                    id="fonction"
                    v-model="fonction"
                    type="text"
                    placeholder="RH, QHSE, direction…"
                    variant="field"
                    class="aria-invalid:border-danger"
                    :aria-invalid="showError('fonction') || undefined"
                    :aria-describedby="showError('fonction') ? 'fonction-error' : undefined"
                  />
                  <p
                    v-if="showError('fonction')"
                    id="fonction-error"
                    class="mt-xs text-small font-semibold text-danger"
                  >
                    {{ errors.fonction }}
                  </p>
                </div>
                <div>
                  <Label for="email" class="mb-xs block"> E-mail professionnel </Label>
                  <Input
                    id="email"
                    v-model="email"
                    type="email"
                    autocomplete="email"
                    placeholder="nom@entreprise.fr"
                    variant="field"
                    class="aria-invalid:border-danger"
                    :aria-invalid="showError('email') || undefined"
                    :aria-describedby="showError('email') ? 'email-error' : undefined"
                  />
                  <p
                    v-if="showError('email')"
                    id="email-error"
                    class="mt-xs text-small font-semibold text-danger"
                  >
                    {{ errors.email }}
                  </p>
                </div>
                <div>
                  <Label for="telephone" class="mb-xs block"> Téléphone </Label>
                  <Input
                    id="telephone"
                    v-model="telephone"
                    type="tel"
                    autocomplete="tel"
                    placeholder="06 -- -- -- --"
                    variant="field"
                    class="aria-invalid:border-danger"
                    :aria-invalid="showError('telephone') || undefined"
                    :aria-describedby="showError('telephone') ? 'telephone-error' : undefined"
                  />
                  <p
                    v-if="showError('telephone')"
                    id="telephone-error"
                    class="mt-xs text-small font-semibold text-danger"
                  >
                    {{ errors.telephone }}
                  </p>
                </div>
              </div>

              <div class="pt-xs">
                <div class="flex items-center gap-sm">
                  <Checkbox
                    id="consentement"
                    v-model="consentement"
                    :aria-invalid="showError('consentement') || undefined"
                    :aria-describedby="showError('consentement') ? 'consentement-error' : undefined"
                  />
                  <Label for="consentement" variant="muted">
                    J'accepte que ces informations soient utilisées pour le traitement de ma demande
                    de formation.
                    <NuxtLink
                      to="#"
                      class="font-medium text-primary transition-colors hover:text-accent-text"
                    >
                      Politique de confidentialité
                    </NuxtLink>
                  </Label>
                </div>
                <p
                  v-if="showError('consentement')"
                  id="consentement-error"
                  class="mt-xs text-small font-semibold text-danger"
                >
                  {{ errors.consentement }}
                </p>
              </div>
            </fieldset>
          </Card>

          <!-- Envoi -->
          <div class="flex flex-col gap-sm sm:flex-row sm:items-center">
            <Button
              type="submit"
              variant="accent"
              size="pill-sm"
              class="w-full px-2xl shadow-sm sm:w-auto"
              :disabled="sending"
            >
              <span
                v-if="sending"
                class="mr-sm block h-md w-md animate-spin rounded-full border-2 border-ink/25 border-t-ink"
                aria-hidden="true"
              />
              {{ sending ? 'Envoi en cours…' : 'Envoyer ma demande' }}
            </Button>
          </div>
          <p v-if="submitError" class="text-small font-semibold text-danger" role="alert">
            {{ submitError }}
          </p>
        </form>

        <!-- Sidebar : contexte de la demande -->
        <aside class="space-y-lg sm:sticky sm:top-lg">
          <Card variant="surface" class="p-lg">
            <div class="mb-lg flex items-center justify-between">
              <h2 class="text-meta font-semibold uppercase tracking-wide text-ink-subtle">
                Votre demande concerne
              </h2>
              <NuxtLink
                :to="modifierTo"
                class="text-small font-medium text-primary transition-colors hover:text-accent-text"
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
                  <p class="font-medium text-ink">
                    {{ sujet?.title ?? 'Votre projet de formation' }}
                  </p>
                  <p class="text-ink-muted">
                    {{ sujet?.body ?? 'Un conseiller identifie le centre et la session adaptés.' }}
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
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { z } from 'zod'
import { MODALITY_LABELS } from '~/utils/catalog-filters'

definePageMeta({
  layout: 'with-breadcrumb'
})

const route = useRoute()
const config = useRuntimeConfig()

// Contexte transmis en query params par les CTA (?centre=, ?formation=, ?session=, ?sujet=).
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
const sujetSlug = computed(() => queryValue(route.query.sujet))

// Les CTA « Rejoindre le réseau » et la home arrivent avec ?sujet= : le sujet
// est affiché dans le bloc contexte — le formulaire reste générique.
const SUJETS: Record<string, { title: string; body: string }> = {
  franchise: {
    title: 'Ouvrir un centre LEARN UP ACADEMY',
    body: 'Candidature à la franchise — étude du projet et du territoire.'
  },
  organisme: {
    title: 'Référencer votre organisme',
    body: 'Votre organisme reçoit les demandes du réseau sur son territoire.'
  },
  formateur: {
    title: 'Intervenir comme formateur',
    body: 'Vos interventions sont proposées aux centres du réseau.'
  },
  conseiller: {
    title: 'Échanger avec un conseiller',
    body: 'Un conseiller LEARN UP ACADEMY vous recontacte.'
  }
}
const sujet = computed(() => (sujetSlug.value ? (SUJETS[sujetSlug.value] ?? null) : null))

// Libellés résolus dynamiquement : le centre vient de Directus,
// la formation et la session de l'API catalogue.
const centresData = centreSlug.value
  ? await useDirectusList<Centre>('centres', `demande-centre-${centreSlug.value}`, {
      fields: ['name', 'city', 'department', 'postal_code'],
      filter: { slug: { _eq: centreSlug.value }, status: { _eq: 'published' } },
      limit: 1
    })
  : ref<Centre[]>([])
// data vaut undefined tant que le fetch client n'est pas résolu
// (useAsyncData n'est pas awaitable à travers le composable).
const centre = computed(() => centresData.value?.[0] ?? null)

const formationData =
  familleSlug.value && formationSlug.value
    ? await useAsyncData(
        `demande-formation-${familleSlug.value}-${formationSlug.value}`,
        async () => {
          try {
            const apiBase = import.meta.server ? config.apiBase : config.public.apiBase
            const headers = internalSsrHeaders(config)
            const url = `${apiBase}/courses/${familleSlug.value}/${formationSlug.value}`
            return headers ? await $fetch<Course>(url, { headers }) : await $fetch<Course>(url)
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

const { handleSubmit, errors, submitCount, defineField, setValues, values } = useForm({
  validationSchema: toTypedSchema(
    z.object({
      // Input émet string | number : la saisie reste une chaîne tant qu'on ne convertit pas.
      salaries: z.coerce
        .number({ error: 'Indiquez le nombre de salariés à former.' })
        .min(1, 'Indiquez le nombre de salariés à former.'),
      echeance: z.string({ error: 'Choisissez une échéance.' }).min(1, 'Choisissez une échéance.'),
      precisions: z.string().optional(),
      raisonSociale: z
        .string({ error: "Indiquez la raison sociale de l'entreprise." })
        .trim()
        .min(1, "Indiquez la raison sociale de l'entreprise."),
      siret: z
        .string({ error: 'Indiquez le SIRET de votre entreprise.' })
        .trim()
        .min(1, 'Indiquez le SIRET de votre entreprise.')
        // Espaces tolérés à la saisie, supprimés avant envoi à HubSpot.
        .transform((value) => value.replace(/\s/g, ''))
        .refine((value) => /^\d{14}$/.test(value), 'SIRET invalide — 14 chiffres attendus.'),
      nom: z
        .string({ error: 'Indiquez votre nom et prénom.' })
        .trim()
        .min(1, 'Indiquez votre nom et prénom.'),
      fonction: z
        .string({ error: 'Indiquez votre fonction.' })
        .trim()
        .min(1, 'Indiquez votre fonction.'),
      email: z
        .string({ error: 'Indiquez votre e-mail professionnel.' })
        .trim()
        .min(1, 'Indiquez votre e-mail professionnel.')
        .pipe(z.email('Format d’e-mail invalide.')),
      telephone: z
        .string({ error: 'Indiquez votre téléphone.' })
        .trim()
        .min(1, 'Indiquez votre téléphone.')
        .refine(
          (value) => value.replace(/\D/g, '').length >= 10,
          'Numéro incomplet — 10 chiffres attendus.'
        ),
      consentement: z
        .boolean({ error: 'Consentement requis pour envoyer la demande.' })
        .refine((value) => value, 'Consentement requis pour envoyer la demande.')
    })
  ),
  initialValues: {
    salaries: 8,
    echeance: 'Septembre 2026',
    precisions: '',
    consentement: false
  }
})

const [salaries] = defineField<'salaries', string | number>('salaries')
const [echeance] = defineField('echeance')
const [precisions] = defineField('precisions')
const [raisonSociale] = defineField('raisonSociale')
const [siret] = defineField('siret')
const [nom] = defineField('nom')
const [fonction] = defineField('fonction')
const [email] = defineField('email')
const [telephone] = defineField('telephone')
const [consentement] = defineField('consentement')

type DemandeField =
  | 'salaries'
  | 'echeance'
  | 'raisonSociale'
  | 'siret'
  | 'nom'
  | 'fonction'
  | 'email'
  | 'telephone'
  | 'consentement'

// Erreurs masquées jusqu'à la 1re tentative d'envoi, puis en direct.
const showError = (field: DemandeField) => submitCount.value > 0 && !!errors.value[field]

// Persistance de la saisie : le lien « Modifier » renvoie au point d'origine
// sans perdre le formulaire déjà rempli (RG06).
const DRAFT_KEY = 'demande-formation-draft'
const DRAFT_FIELDS = new Set<string>([
  'salaries',
  'echeance',
  'precisions',
  'raisonSociale',
  'siret',
  'nom',
  'fonction',
  'email',
  'telephone',
  'consentement'
])

function saveDraft() {
  if (typeof window === 'undefined') return
  window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify(values))
}

onMounted(() => {
  const raw = window.sessionStorage.getItem(DRAFT_KEY)
  if (!raw) return
  try {
    const parsed: unknown = JSON.parse(raw)
    if (parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)) {
      // Ne restaure que les champs du schéma — ignore toute clé étrangère.
      const draft = Object.fromEntries(
        Object.entries(parsed as Record<string, unknown>).filter(([key]) => DRAFT_FIELDS.has(key))
      )
      setValues(draft)
    }
  } catch {
    window.sessionStorage.removeItem(DRAFT_KEY)
  }
})

const { submit: submitLead, sending, error: submitError } = useLeadSubmit()
const submitted = ref(false)

// `v` = valeurs parsées zod (siret normalisé, salaries coercé) — pas le brut.
const onSubmit = handleSubmit(async (v) => {
  const ok = await submitLead('demande', {
    nom: v.nom,
    email: v.email,
    telephone: v.telephone,
    raisonSociale: v.raisonSociale,
    siret: v.siret,
    fonction: v.fonction,
    salaries: v.salaries,
    echeance: v.echeance,
    precisions: v.precisions || undefined,
    // Libellés résolus — HubSpot reçoit du texte lisible, pas les slugs.
    centre: centreName.value || centreSlug.value || undefined,
    formation: formationName.value || undefined,
    session: sessionName.value || undefined,
    sujet: sujetSlug.value || undefined,
    consentement: true,
    pageUri: window.location.href,
    pageName: 'Demande de formation'
  })
  if (ok) {
    submitted.value = true
    window.sessionStorage.removeItem(DRAFT_KEY)
  }
})
</script>
