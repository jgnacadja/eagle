<template>
  <div class="flex-1">
    <div class="mx-auto px-gutter-mobile py-section md:px-gutter">
      <div class="mb-2xl">
        <h1 class="font-display text-h2 font-extrabold text-ink lg:text-h1">
          Parler à votre conseiller
        </h1>
        <p class="mt-sm max-w-prose text-body text-ink-muted">
          Décrivez votre besoin&nbsp;: votre demande est transmise à l'interlocuteur compétent de
          votre territoire, qui vous recontacte sous 24&nbsp;h ouvrées.
        </p>
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
              <h2 class="font-display text-h3 font-extrabold text-ink">Demande transmise</h2>
              <p class="mt-sm max-w-prose text-body text-ink-muted">
                Un conseiller vous recontacte sous 24&nbsp;h ouvrées aux coordonnées indiquées.
              </p>
            </div>
            <div class="rounded-md border border-rule bg-surface px-xl py-md">
              <p class="text-small font-semibold text-ink">
                Référence de suivi&nbsp;: {{ reference }}
              </p>
              <p class="mt-xs text-meta text-ink-subtle">
                Conservez-la&nbsp;: elle facilite le suivi.
              </p>
            </div>
            <div class="flex flex-wrap justify-center gap-md">
              <Button as-child variant="dark" size="pill-lg">
                <NuxtLink to="/">Retour à l'accueil</NuxtLink>
              </Button>
              <Button as-child variant="outline" size="pill-lg">
                <NuxtLink to="/formations">Parcourir le catalogue</NuxtLink>
              </Button>
            </div>
          </Card>

          <!-- Formulaire (v-show : jamais démonté — cf. demande-de-formation) -->
          <form v-show="!submitted" novalidate @submit.prevent="onSubmit">
            <Card v-reveal class="space-y-lg p-lg sm:px-xl sm:py-lg">
              <fieldset>
                <legend class="mb-md text-small font-semibold text-ink">
                  Votre besoin <span class="text-danger" aria-hidden="true">*</span>
                </legend>
                <RadioGroup
                  v-model="besoin"
                  name="conseiller-besoin"
                  class="grid-cols-1 sm:grid-cols-2"
                >
                  <label
                    v-for="option in BESOIN_OPTIONS"
                    :key="option.value"
                    :for="`conseiller-besoin-${option.value}`"
                    :class="[
                      'flex cursor-pointer items-center gap-md rounded-md p-md transition-colors has-focus-visible:ring-1 has-focus-visible:ring-primary',
                      besoin === option.value
                        ? 'border-2 border-primary bg-primary-soft'
                        : 'border border-rule bg-paper hover:border-outline'
                    ]"
                  >
                    <RadioGroupItem
                      :id="`conseiller-besoin-${option.value}`"
                      :value="option.value"
                    />
                    <span>
                      <span class="block text-small font-semibold text-ink">{{
                        option.title
                      }}</span>
                      <span class="block text-meta text-ink-muted">{{ option.body }}</span>
                    </span>
                  </label>
                </RadioGroup>
              </fieldset>

              <div>
                <Label for="nom" class="mb-xs block">
                  Nom et prénom <span class="text-danger" aria-hidden="true">*</span>
                </Label>
                <Input
                  id="nom"
                  v-model="nom"
                  type="text"
                  autocomplete="name"
                  placeholder="Ex. : Camille Moreau"
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

              <div class="grid grid-cols-1 gap-md sm:grid-cols-2">
                <div>
                  <Label for="email" class="mb-xs block">
                    Adresse e-mail <span class="text-danger" aria-hidden="true">*</span>
                  </Label>
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
                  <Label for="telephone" class="mb-xs block">
                    Téléphone <span class="text-danger" aria-hidden="true">*</span>
                  </Label>
                  <Input
                    id="telephone"
                    v-model="telephone"
                    type="tel"
                    autocomplete="tel"
                    placeholder="06 12 34 56 78"
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

              <div>
                <Label for="siret" class="mb-xs block">
                  SIRET <span class="font-normal text-ink-subtle">(facultatif)</span>
                </Label>
                <Input
                  id="siret"
                  v-model="siret"
                  type="text"
                  inputmode="numeric"
                  placeholder="14 chiffres"
                  variant="field"
                  class="aria-invalid:border-danger"
                  :aria-invalid="showError('siret') || undefined"
                  :aria-describedby="siretDescribedby"
                />
                <p
                  v-if="showError('siret')"
                  id="siret-error"
                  class="mt-xs text-small font-semibold text-danger"
                >
                  {{ errors.siret }}
                </p>
                <p v-else id="siret-hint" class="mt-xs text-meta text-ink-subtle">
                  Utilisé pour identifier votre entreprise et votre territoire d'intervention.
                </p>
              </div>

              <div>
                <Label for="message" class="mb-xs block">
                  Votre besoin en quelques mots
                  <span class="font-normal text-ink-subtle">(facultatif)</span>
                </Label>
                <Textarea
                  id="message"
                  v-model="message"
                  rows="3"
                  placeholder="Ex. : Former 8 salariés au CACES près de Lyon avant septembre."
                  class="resize-none"
                />
              </div>

              <div>
                <div class="flex items-center gap-sm">
                  <Checkbox
                    id="consentement"
                    v-model="consentement"
                    :aria-invalid="showError('consentement') || undefined"
                    :aria-describedby="showError('consentement') ? 'consentement-error' : undefined"
                  />
                  <Label for="consentement" variant="muted">
                    J'accepte que ces informations soient utilisées pour le traitement de ma
                    demande.
                    <NuxtLink
                      to="/confidentialite"
                      class="font-medium text-primary underline underline-offset-4 transition-colors hover:text-accent-text"
                    >
                      Politique de confidentialité
                    </NuxtLink>
                    <span class="text-danger" aria-hidden="true"> *</span>
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

              <div>
                <Button
                  type="submit"
                  variant="accent"
                  size="pill-lg"
                  class="w-full shadow-sm"
                  :disabled="sending"
                >
                  <span
                    v-if="sending"
                    class="mr-sm block h-md w-md animate-spin rounded-full border-2 border-ink/25 border-t-ink"
                    aria-hidden="true"
                  />
                  {{ sending ? 'Envoi en cours…' : 'Envoyer ma demande' }}
                </Button>
                <p class="mt-sm text-center text-meta text-ink-subtle">
                  Un conseiller vous recontacte sous 24&nbsp;h ouvrées.
                </p>
                <p
                  v-if="submitError"
                  class="mt-sm text-small font-semibold text-danger"
                  role="alert"
                >
                  {{ submitError }}
                </p>
              </div>
            </Card>
          </form>
        </div>

        <!-- Sidebar : suite de la demande -->
        <aside class="space-y-lg sm:sticky sm:top-lg">
          <Card v-reveal class="p-lg">
            <h2 class="mb-lg text-small font-semibold text-ink">Ce qui se passe ensuite</h2>
            <ol class="space-y-md">
              <li v-for="(step, index) in nextSteps" :key="step" class="flex items-start gap-md">
                <span
                  aria-hidden="true"
                  class="flex h-lg w-lg shrink-0 items-center justify-center rounded-full bg-primary text-meta font-semibold text-ink-inverse"
                  >{{ index + 1 }}</span
                >
                <p class="text-small text-ink-muted">{{ step }}</p>
              </li>
            </ol>
          </Card>

          <Card v-reveal variant="dark" class="p-lg">
            <h2 class="text-small font-semibold text-paper">Vous préférez téléphoner&nbsp;?</h2>
            <p class="mt-md text-small text-ink-inverse-muted">
              Chaque centre affiche son numéro direct — trouvez celui de votre territoire.
            </p>
            <Button as-child variant="outline-inverse" size="pill" class="mt-md w-full">
              <NuxtLink to="/centres">Trouver un centre</NuxtLink>
            </Button>
          </Card>

          <p class="text-meta leading-relaxed text-ink-subtle">
            Les informations recueillies servent uniquement au traitement de la demande — détails
            dans la
            <NuxtLink
              to="/confidentialite"
              class="font-medium text-primary underline underline-offset-4 transition-colors hover:text-accent-text"
              >politique de confidentialité</NuxtLink
            >.
          </p>
        </aside>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ConseillerBesoin } from '@learnup/types'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { z } from 'zod'

definePageMeta({
  layout: 'with-breadcrumb',
  breadcrumb: [{ label: 'Accueil', to: '/' }, { label: 'Parler à votre conseiller' }]
})

useContentSeo(
  {
    seo_title: 'Parler à votre conseiller | LEARN UP ACADEMY',
    seo_description:
      'Décrivez votre besoin : votre demande est transmise à l’interlocuteur compétent de votre territoire, qui vous recontacte sous 24 h ouvrées.',
    // Formulaire de contact : hors indexation.
    seo_noindex: true
  },
  'Parler à votre conseiller'
)

// Le besoin alimente le routage back-office (learnup_type_projet) — jamais
// exposé côté client : « conseiller » couvre le besoin de formation générique.
const BESOIN_OPTIONS: { value: ConseillerBesoin; title: string; body: string }[] = [
  { value: 'conseiller', title: 'Un besoin de formation', body: 'Pour vos équipes ou pour vous' },
  { value: 'centre', title: 'Ouvrir un centre', body: 'Rejoindre le réseau' },
  { value: 'formateur', title: 'Devenir formateur', body: 'Intervenir sur les sessions du réseau' },
  { value: 'organisme', title: 'Organisme du réseau', body: 'Un besoin pour votre client' }
]

// Toujours renseigné (présélection « Un besoin de formation ») : hors schéma,
// rien à valider — même pattern que la voie du dialog Candidature.
const besoin = ref<ConseillerBesoin>('conseiller')

const nextSteps = [
  "Votre demande est transmise à l'interlocuteur compétent de votre territoire.",
  'Un conseiller vous recontacte sous 24 h ouvrées.',
  'Vous recevez une proposition adaptée : sessions, lieux, dates.'
]

// Pré-remplit « Votre besoin en quelques mots » depuis ?q= — la recherche
// libre de la home ou de la page entreprise bascule ici avec son texte.
const route = useRoute()
const initialMessage = typeof route.query.q === 'string' ? route.query.q.trim().slice(0, 2000) : ''

const { handleSubmit, errors, submitCount, defineField } = useForm({
  validationSchema: toTypedSchema(
    z.object({
      nom: z
        .string({ error: 'Indiquez votre nom et prénom.' })
        .trim()
        .min(1, 'Indiquez votre nom et prénom.'),
      email: z
        .string({ error: 'Indiquez votre adresse e-mail.' })
        .trim()
        .min(1, 'Indiquez votre adresse e-mail.')
        .pipe(z.email('Format d’e-mail invalide.')),
      telephone: z
        .string({ error: 'Indiquez votre téléphone.' })
        .trim()
        .min(1, 'Indiquez votre téléphone.')
        .refine(
          (value) => value.replace(/\D/g, '').length >= 10,
          'Numéro incomplet — 10 chiffres attendus.'
        ),
      siret: z
        .string()
        .transform((value) => value.replace(/\s/g, ''))
        .refine(
          (value) => value === '' || /^\d{14}$/.test(value),
          'SIRET invalide — 14 chiffres attendus.'
        ),
      // « En quelques mots » : limite basse — marge sous le MaxLength(5000)
      // de l'API pour la référence de suivi suffixée à l'envoi.
      message: z.string().max(2000, 'Message trop long — 2 000 caractères maximum.').optional(),
      consentement: z
        .boolean({ error: 'Consentement requis pour envoyer la demande.' })
        .refine((value) => value, 'Consentement requis pour envoyer la demande.')
    })
  ),
  initialValues: { siret: '', message: initialMessage, consentement: false }
})

const [nom] = defineField('nom')
const [email] = defineField('email')
const [telephone] = defineField('telephone')
const [siret] = defineField('siret')
const [message] = defineField('message')
const [consentement] = defineField('consentement')

type ConseillerField = 'nom' | 'email' | 'telephone' | 'siret' | 'consentement'

// Erreurs masquées jusqu'à la 1re tentative d'envoi, puis en direct.
const showError = (field: ConseillerField) => submitCount.value > 0 && !!errors.value[field]

// L'aide SIRET disparaît quand l'erreur s'affiche (un seul describedby utile).
const siretDescribedby = computed(() => (showError('siret') ? 'siret-error' : 'siret-hint'))

const { submit: submitLead, sending, error: submitError } = useLeadSubmit()
const submitted = ref(false)
const reference = ref('')

// Référence de suivi LU-AAAA-MMDD-NNN : générée à l'envoi et suffixée au
// message — elle remonte dans learnup_precisions, où le back-office peut la
// retrouver (l'API ne renvoie que { submitted: true }).
// Plus grand multiple de 1000 contenu dans 2^32 : les valeurs au-delà sont
// rejetées pour que le modulo reste uniforme (pas de biais sur le suffixe).
const UINT32_LIMIT_1000 = 4_294_967_000

function makeReference(): string {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  let n = crypto.getRandomValues(new Uint32Array(1))[0] ?? 0
  while (n >= UINT32_LIMIT_1000) {
    n = crypto.getRandomValues(new Uint32Array(1))[0] ?? 0
  }
  const suffix = String(n % 1000).padStart(3, '0')
  return `LU-${now.getFullYear()}-${pad(now.getMonth() + 1)}${pad(now.getDate())}-${suffix}`
}

const onSubmit = handleSubmit(async (v) => {
  const ref = makeReference()
  const ok = await submitLead('conseiller', {
    besoin: besoin.value,
    nom: v.nom,
    email: v.email,
    telephone: v.telephone,
    siret: v.siret || undefined,
    message: [v.message, `Référence : ${ref}`].filter(Boolean).join('\n\n'),
    consentement: v.consentement,
    pageUri: window.location.href,
    pageName: 'Parler à votre conseiller'
  })
  if (ok) {
    reference.value = ref
    submitted.value = true
  }
})
</script>
