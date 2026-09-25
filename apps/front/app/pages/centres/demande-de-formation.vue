<template>
  <div class="flex-1">
    <div class="mx-auto px-gutter-mobile py-section md:px-gutter">
      <!-- En-tête de page + stepper -->
      <div class="mb-2xl flex items-start justify-between gap-lg">
        <div>
          <h1 class="font-display text-h2 font-extrabold text-ink lg:text-h1">
            {{ isIntra ? 'Organiser cette formation dans mon entreprise' : 'Demande de formation' }}
          </h1>
          <p v-if="isIntra" class="mt-sm max-w-prose text-body text-ink-muted">
            Formation sur votre site, sur vos équipements. LEARN&nbsp;UP&nbsp;ACADEMY organise
            l'intervention.
          </p>
          <p v-else class="mt-sm max-w-prose text-body text-ink-muted">
            La demande est prise en charge par notre réseau. Nous vous répondons sous 24&nbsp;h
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
        <div class="lg:col-span-2 md:px-16">
          <!-- Confirmation d'envoi -->
          <Card
            v-if="submitted"
            v-reveal
            class="flex flex-col items-center gap-lg p-xl text-center"
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
                <template v-if="formationName">
                  Un conseiller LEARN&nbsp;UP&nbsp;ACADEMY vous recontacte sous 24&nbsp;h ouvrées au
                  sujet de la formation
                  <strong class="font-semibold text-ink">{{ formationName }}</strong
                  >{{ confirmationSuffix }}
                </template>
                <template v-else>
                  Un conseiller LEARN&nbsp;UP&nbsp;ACADEMY prend en charge votre demande et vous
                  recontacte sous 24&nbsp;h ouvrées.
                </template>
              </p>
            </div>
            <div class="flex flex-wrap justify-center gap-md">
              <Button as-child variant="dark" size="pill-lg">
                <NuxtLink :to="confirmationBackTo">{{ confirmationBackLabel }}</NuxtLink>
              </Button>
              <Button as-child variant="outline" size="pill-lg">
                <NuxtLink to="/formations">Parcourir le catalogue</NuxtLink>
              </Button>
            </div>
          </Card>

          <!-- Formulaire (v-show : jamais démonté — le swap v-if/v-else casse le
             retrait de fragment sous happy-dom en test) -->
          <form v-show="!submitted" novalidate class="space-y-lg" @submit.prevent="onSubmit">
            <!-- Votre besoin -->
            <Card v-reveal class="p-lg sm:py-lg sm:px-xl">
              <fieldset class="space-y-md">
                <legend
                  class="mb-md text-meta font-semibold uppercase tracking-wide text-accent-text"
                >
                  Votre besoin
                </legend>

                <!-- Intra : le lieu est saisi par le client — aucun centre imposé. -->
                <div v-if="isIntra">
                  <Label for="lieu" class="mb-xs block"> Lieu de la formation </Label>
                  <Input
                    id="lieu"
                    v-model="lieu"
                    type="text"
                    placeholder="Code postal ou ville de votre site"
                    variant="field"
                    class="aria-invalid:border-danger"
                    :aria-invalid="showError('lieu') || undefined"
                    :aria-describedby="showError('lieu') ? 'lieu-error' : undefined"
                  />
                  <p
                    v-if="showError('lieu')"
                    id="lieu-error"
                    class="mt-xs text-small font-semibold text-danger"
                  >
                    {{ errors.lieu }}
                  </p>
                </div>

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
            <Card v-reveal class="p-lg sm:py-lg sm:px-xl">
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
                      placeholder="xxx xxx xxx xxxxx"
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
            <Card v-reveal class="p-lg sm:py-lg sm:px-xl">
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
                    <Label for="telephone-pro" class="mb-xs block"> Téléphone Professionnel </Label>
                    <Input
                      id="telephone-pro"
                      v-model="telephonePro"
                      type="tel"
                      autocomplete="tel"
                      placeholder="06 -- -- -- --"
                      variant="field"
                      class="aria-invalid:border-danger"
                      :aria-invalid="showError('telephonePro') || undefined"
                      :aria-describedby="
                        showError('telephonePro') ? 'telephone-pro-error' : undefined
                      "
                    />
                    <p
                      v-if="showError('telephonePro')"
                      id="telephone-pro-error"
                      class="mt-xs text-small font-semibold text-danger"
                    >
                      {{ errors.telephonePro }}
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
                      :aria-describedby="
                        showError('consentement') ? 'consentement-error' : undefined
                      "
                    />
                    <Label for="consentement" variant="muted">
                      J'accepte que ces informations soient utilisées pour le traitement de ma
                      demande de formation.
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
        </div>

        <!-- Sidebar : contexte de la demande — affichée avant le
             formulaire sur mobile (maquette 1b), à droite sur desktop. -->
        <aside class="order-first space-y-lg sm:sticky sm:top-lg lg:order-last">
          <Card v-reveal variant="surface" class="p-lg">
            <div class="mb-lg flex items-center justify-between">
              <h2 class="font-sans text-h4 font-bold text-ink">Votre demande concerne</h2>
              <NuxtLink
                :to="modifierTo"
                class="text-small font-medium text-primary transition-colors hover:text-accent-text"
                @click="saveDraft"
              >
                Modifier
              </NuxtLink>
            </div>

            <!-- RG06 : un seul élément contexte — icône de l'ancre,
                 titre = centre quand il est connu, méta selon le niveau
                 transmis. RG04 : jamais de ligne vide (méta conditionnelle). -->
            <ul class="space-y-md text-small">
              <li class="flex items-start gap-sm">
                <component :is="contextIcon" :size="20" class="mt-xs shrink-0 text-primary" />
                <div>
                  <p class="font-bold text-ink">{{ contextTitle }}</p>
                  <p v-if="contextMeta" class="text-ink-muted">{{ contextMeta }}</p>
                </div>
              </li>
            </ul>
            <Badge v-if="isIntra" variant="neutral" class="mt-md">
              Intra — sans centre imposé
            </Badge>
          </Card>

          <Card v-reveal class="p-lg">
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
import IconMapPin from '~/components/icons/IconMapPin.vue'
import IconBook from '~/components/icons/IconBook.vue'
import IconCalendar from '~/components/icons/IconCalendar.vue'

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
// Variante intra (?intra=1) : la formation se déroule sur le site du client —
// aucun centre imposé, le lieu est collecté dans « Votre besoin ».
const isIntra = computed(() => queryValue(route.query.intra) === '1')

// L'ancien CTA « conseiller » (?sujet=conseiller, home/footer) a sa page dédiée.
if (sujetSlug.value === 'conseiller') {
  await navigateTo('/parler-a-votre-conseiller')
}

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
  }
}
const sujet = computed(() => (sujetSlug.value ? (SUJETS[sujetSlug.value] ?? null) : null))

// Libellés résolus dynamiquement : la formation et la session viennent de
// l'API catalogue, le centre de Directus.
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

// Centre ancre de l'encart : transmis par ?centre=, sinon déduit de la
// session choisie, sinon le centre principal de la formation (centerSlug)
// — une fiche formation connaît son centre sans le passer en query (RG06).
const demandeCentreSlug = computed(() => {
  // En intra, aucun centre n'ancre la demande — « sans centre imposé ».
  if (isIntra.value) return null
  return (
    centreSlug.value ?? session.value?.location?.centreSlug ?? formation.value?.centerSlug ?? null
  )
})
// Query en getter + watch : une navigation client vers la même route avec
// un autre ?centre= (page-key = route.path, pas de remount) relance le
// fetch au lieu de figer le premier slug résolu.
const centresData = await useDirectusList<Centre>(
  'centres',
  'demande-centre',
  () =>
    demandeCentreSlug.value
      ? {
          fields: ['name', 'city', 'department', 'postal_code'],
          filter: { slug: { _eq: demandeCentreSlug.value }, status: { _eq: 'published' } },
          limit: 1
        }
      : null,
  { watch: [demandeCentreSlug] }
)
// data vaut undefined tant que le fetch client n'est pas résolu
// (useAsyncData n'est pas awaitable à travers le composable).
const centre = computed(() => centresData.value?.[0] ?? null)

const centreName = computed(() => (demandeCentreSlug.value ? (centre.value?.name ?? '') : ''))
// « Créteil · Val-de-Marne (94) » : code département entre parenthèses —
// 3 chiffres pour l'outre-mer (971…), 2A/2B pour la Corse, et pas de
// doublon « Paris · Paris » quand ville et département se confondent.
const centreMeta = computed(() => {
  const c = centre.value
  if (!c) return ''
  const cp = c.postal_code ?? ''
  let code = ''
  if (/^\d{5}$/.test(cp)) {
    if (cp.startsWith('97')) code = cp.slice(0, 3)
    else if (cp.startsWith('20')) code = cp < '20200' ? '2A' : '2B'
    else code = cp.slice(0, 2)
  }
  const department = c.department === c.city ? '' : c.department
  const deptParts = [department, code ? `(${code})` : ''].filter(Boolean)
  return [c.city, deptParts.join(' ')].filter(Boolean).join(' · ')
})
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
// Date courte pour la ligne de détail : « session du 12 sept. 2026 ».
const sessionDateShort = computed(() => {
  const start = session.value?.startDate
  if (!start) return ''
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC'
  }).format(new Date(`${start}T00:00:00Z`))
})

// RG06 : niveau de contexte le plus profond réellement exploitable
// (?session= sans formation ne résout rien — retombe sur le générique).
// Pilote l'encart ET le lien « Modifier ».
const contextLevel = computed<'centre' | 'formation' | 'session' | 'sujet' | 'generic'>(() => {
  if (sessionSlug.value && formationSlug.value) return 'session'
  if (formationSlug.value) return 'formation'
  if (demandeCentreSlug.value) return 'centre'
  if (sujet.value) return 'sujet'
  return 'generic'
})

// Icône de l'élément contexte : l'ancre est le centre dès qu'il est connu
// (query ou session), sinon le niveau transmis (RG06).
const contextIcon = computed(() => {
  if (demandeCentreSlug.value) return IconMapPin
  if (contextLevel.value === 'session') return IconCalendar
  if (contextLevel.value === 'formation') return IconBook
  return IconMapPin
})

const contextTitle = computed(() => {
  if (demandeCentreSlug.value) return centre.value?.name ?? 'Centre partenaire'
  if (formationSlug.value) return formationName.value
  if (sujet.value) return sujet.value.title
  return 'Votre projet de formation'
})

const contextMeta = computed(() => {
  switch (contextLevel.value) {
    case 'session': {
      // « CACES R489 cat. 3 · Présentiel · session du 12 sept. 2026 · 5 places » —
      // le titre de la formation n'est répété que si le centre porte le bloc.
      const parts: string[] = []
      if (demandeCentreSlug.value && formation.value?.title) parts.push(formation.value.title)
      const modality = session.value?.modality
      if (modality) parts.push(MODALITY_LABELS[modality] ?? modality)
      if (sessionDateShort.value) parts.push(`session du ${sessionDateShort.value}`)
      const seats = session.value?.seatsRemaining
      if (seats != null) parts.push(`${seats} places`)
      return parts.join(' · ')
    }
    case 'formation':
      if (isIntra.value) {
        return 'Formation intra · sur votre site · devis selon effectif et catégories'
      }
      return demandeCentreSlug.value ? formationName.value : formationMeta.value
    case 'centre':
      return centreMeta.value
    case 'sujet':
      return sujet.value?.body ?? ''
    default:
      return 'Un conseiller identifie le centre et la session adaptés.'
  }
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
  return demandeCentreSlug.value ? `/centres/${demandeCentreSlug.value}` : '/centres'
})

// Breadcrumb : le nom du centre s'affiche quand le contexte est transmis.
const defaultBreadcrumb = [
  { label: 'Accueil', to: '/' },
  { label: 'Centres', to: '/centres' },
  { label: 'Demande de formation' }
]
watchEffect(() => {
  route.meta.breadcrumb = demandeCentreSlug.value
    ? [
        { label: 'Accueil', to: '/' },
        { label: 'Centres', to: '/centres' },
        { label: centreName.value, to: `/centres/${demandeCentreSlug.value}` },
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
    z
      .object({
        // Input émet string | number : la saisie reste une chaîne tant qu'on ne convertit pas.
        salaries: z.coerce
          .number({ error: 'Indiquez le nombre de salariés à former.' })
          .min(1, 'Indiquez le nombre de salariés à former.'),
        echeance: z
          .string({ error: 'Choisissez une échéance.' })
          .min(1, 'Choisissez une échéance.'),
        lieu: z.string().trim().optional(),
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
        telephonePro: z
          .string()
          .trim()
          .refine(
            (value) => !value || value.replace(/\D/g, '').length >= 10,
            'Numéro incomplet — 10 chiffres attendus.'
          )
          .optional(),
        consentement: z
          .boolean({ error: 'Consentement requis pour envoyer la demande.' })
          .refine((value) => value, 'Consentement requis pour envoyer la demande.')
      })
      // Le lieu n'est requis qu'en intra : la session se déroule sur le site
      // du client, sans centre pour le localiser.
      .superRefine((data, ctx) => {
        if (isIntra.value && !data.lieu) {
          ctx.addIssue({
            code: 'custom',
            path: ['lieu'],
            message: 'Indiquez le lieu de la formation (code postal ou ville).'
          })
        }
      })
  ),
  initialValues: {
    salaries: 8,
    lieu: '',
    echeance: 'Septembre 2026',
    precisions: '',
    consentement: false
  }
})

const [salaries] = defineField<'salaries', string | number>('salaries')
const [lieu] = defineField('lieu')
const [echeance] = defineField('echeance')
const [precisions] = defineField('precisions')
const [raisonSociale] = defineField('raisonSociale')
const [siret] = defineField('siret')
const [nom] = defineField('nom')
const [fonction] = defineField('fonction')
const [email] = defineField('email')
const [telephone] = defineField('telephone')
const [telephonePro] = defineField('telephonePro')
const [consentement] = defineField('consentement')

type DemandeField =
  | 'salaries'
  | 'lieu'
  | 'echeance'
  | 'raisonSociale'
  | 'siret'
  | 'nom'
  | 'fonction'
  | 'email'
  | 'telephone'
  | 'telephonePro'
  | 'consentement'

// Erreurs masquées jusqu'à la 1re tentative d'envoi, puis en direct.
const showError = (field: DemandeField) => submitCount.value > 0 && !!errors.value[field]

// Persistance de la saisie : le lien « Modifier » renvoie au point d'origine
// sans perdre le formulaire déjà rempli (RG06).
const DRAFT_KEY = 'demande-formation-draft'
const DRAFT_FIELDS = new Set<string>([
  'salaries',
  'lieu',
  'echeance',
  'precisions',
  'raisonSociale',
  'siret',
  'nom',
  'fonction',
  'email',
  'telephone',
  'telephonePro',
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

// Confirmation : le message reprend le contexte — « , session du 12 octobre
// 2026 à Créteil. » ou « , dans votre entreprise à Lyon. » (« . » seul si la
// formation est transmise sans session ni lieu).
const confirmationSuffix = computed(() => {
  if (sessionSlug.value) {
    const start = session.value?.startDate
    const when = start
      ? `session du ${new Intl.DateTimeFormat('fr-FR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          timeZone: 'UTC'
        }).format(new Date(`${start}T00:00:00Z`))}`
      : 'session programmée'
    const city = session.value?.location?.city ?? centre.value?.city
    return `, ${when}${city ? ` à ${city}` : ''}.`
  }
  if (isIntra.value) {
    const place = typeof lieu.value === 'string' ? lieu.value.trim() : ''
    return `, dans votre entreprise${place ? ` à ${place}` : ''}.`
  }
  return '.'
})

// Sortie de la confirmation : retour à la fiche formation quand elle est
// connue, sinon au centre, sinon à l'accueil.
const confirmationBackTo = computed(
  () =>
    formationPath.value ?? (demandeCentreSlug.value ? `/centres/${demandeCentreSlug.value}` : '/')
)
const confirmationBackLabel = computed(() => {
  if (formationPath.value) return 'Retour à la formation'
  if (demandeCentreSlug.value) return 'Retour au centre'
  return "Retour à l'accueil"
})

// `v` = valeurs parsées zod (siret normalisé, salaries coercé) — pas le brut.
const onSubmit = handleSubmit(async (v) => {
  const ok = await submitLead('demande', {
    nom: v.nom,
    email: v.email,
    telephone: v.telephone,
    telephonePro: v.telephonePro || undefined,
    raisonSociale: v.raisonSociale,
    siret: v.siret,
    fonction: v.fonction,
    salaries: v.salaries,
    lieu: v.lieu || undefined,
    echeance: v.echeance,
    precisions: v.precisions || undefined,
    // Libellés résolus — HubSpot reçoit du texte lisible, pas les slugs.
    centre: centreName.value || demandeCentreSlug.value || undefined,
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
