<template>
  <form novalidate class="space-y-lg" @submit.prevent="onSubmit">
    <fieldset>
      <legend class="mb-sm text-small font-semibold text-ink">Votre projet</legend>
      <div class="flex flex-wrap gap-sm">
        <label
          v-for="option in VOIE_OPTIONS"
          :key="option.value"
          :class="[
            'flex h-control cursor-pointer items-center rounded-full border px-lg text-small font-semibold transition-colors has-focus-visible:ring-1 has-focus-visible:ring-primary',
            voie === option.value
              ? 'border-primary bg-primary text-ink-inverse'
              : 'border-outline bg-paper text-ink hover:border-primary hover:text-accent-text'
          ]"
        >
          <input
            v-model="voie"
            type="radio"
            name="candidature-voie"
            :value="option.value"
            class="sr-only"
          />
          {{ option.label }}
        </label>
      </div>
    </fieldset>

    <div class="grid gap-md sm:grid-cols-2">
      <div>
        <Label for="candidature-nom" class="mb-xs block">Nom et prénom</Label>
        <Input
          id="candidature-nom"
          v-model="nom"
          type="text"
          autocomplete="name"
          placeholder="Votre nom"
          variant="field"
          class="aria-invalid:border-danger"
          :aria-invalid="showError('nom') || undefined"
          :aria-describedby="showError('nom') ? 'candidature-nom-error' : undefined"
        />
        <p
          v-if="showError('nom')"
          id="candidature-nom-error"
          class="mt-xs text-small font-semibold text-danger"
        >
          {{ errors.nom }}
        </p>
      </div>
      <div>
        <Label for="candidature-email" class="mb-xs block">E-mail professionnel</Label>
        <Input
          id="candidature-email"
          v-model="email"
          type="email"
          autocomplete="email"
          placeholder="nom@entreprise.fr"
          variant="field"
          class="aria-invalid:border-danger"
          :aria-invalid="showError('email') || undefined"
          :aria-describedby="showError('email') ? 'candidature-email-error' : undefined"
        />
        <p
          v-if="showError('email')"
          id="candidature-email-error"
          class="mt-xs text-small font-semibold text-danger"
        >
          {{ errors.email }}
        </p>
      </div>
      <div>
        <Label for="candidature-telephone" class="mb-xs block">Téléphone</Label>
        <Input
          id="candidature-telephone"
          v-model="telephone"
          type="tel"
          autocomplete="tel"
          placeholder="06 -- -- -- --"
          variant="field"
          class="aria-invalid:border-danger"
          :aria-invalid="showError('telephone') || undefined"
          :aria-describedby="showError('telephone') ? 'candidature-telephone-error' : undefined"
        />
        <p
          v-if="showError('telephone')"
          id="candidature-telephone-error"
          class="mt-xs text-small font-semibold text-danger"
        >
          {{ errors.telephone }}
        </p>
      </div>
      <div>
        <Label for="candidature-ville" class="mb-xs block">Ville ou territoire visé</Label>
        <div class="relative">
          <IconMapPin
            :size="16"
            class="pointer-events-none absolute left-md top-1/2 -translate-y-1/2 text-ink-subtle"
          />
          <Input
            id="candidature-ville"
            v-model="ville"
            type="text"
            placeholder="Ville, département…"
            variant="field"
            class="pl-2xl aria-invalid:border-danger"
            :aria-invalid="showError('ville') || undefined"
            :aria-describedby="showError('ville') ? 'candidature-ville-error' : undefined"
          />
        </div>
        <p
          v-if="showError('ville')"
          id="candidature-ville-error"
          class="mt-xs text-small font-semibold text-danger"
        >
          {{ errors.ville }}
        </p>
      </div>
    </div>

    <div>
      <Label for="candidature-parcours" class="mb-xs block"> Votre parcours et votre projet </Label>
      <Textarea
        id="candidature-parcours"
        v-model="parcours"
        rows="5"
        placeholder="Expérience dans la formation, situation actuelle, échéance envisagée…"
        class="resize-none"
        :aria-invalid="showError('parcours') || undefined"
        :aria-describedby="showError('parcours') ? 'candidature-parcours-error' : undefined"
      />
      <p
        v-if="showError('parcours')"
        id="candidature-parcours-error"
        class="mt-xs text-small font-semibold text-danger"
      >
        {{ errors.parcours }}
      </p>
    </div>

    <div>
      <div class="flex items-start gap-sm">
        <Checkbox
          id="candidature-consentement"
          v-model="consentement"
          class="mt-xs"
          :aria-invalid="showError('consentement') || undefined"
          :aria-describedby="
            showError('consentement') ? 'candidature-consentement-error' : undefined
          "
        />
        <Label for="candidature-consentement" variant="muted">
          J'accepte que ces informations soient utilisées pour l'étude de ma candidature. Elles ne
          sont utilisées à aucune autre fin.
        </Label>
      </div>
      <p
        v-if="showError('consentement')"
        id="candidature-consentement-error"
        class="mt-xs text-small font-semibold text-danger"
      >
        {{ errors.consentement }}
      </p>
    </div>

    <div class="flex flex-col gap-sm sm:flex-row sm:items-center">
      <Button
        type="submit"
        variant="accent"
        size="pill-lg"
        :disabled="sending"
        class="w-full sm:w-auto"
      >
        <span
          v-if="sending"
          class="mr-sm block h-md w-md animate-spin rounded-full border-2 border-ink/25 border-t-ink"
          aria-hidden="true"
        />
        {{ sending ? 'Envoi en cours…' : 'Envoyer ma candidature' }}
      </Button>
      <p class="text-meta text-ink-subtle">Réponse sous 5 jours ouvrés.</p>
    </div>
  </form>
</template>

<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { z } from 'zod'
import type { CandidaturePayload, CandidatureVoie } from '~/types/candidature'

const props = defineProps<{
  sending?: boolean
}>()

const emit = defineEmits<{
  submit: [payload: CandidaturePayload]
}>()

// v-model:voie — la voie est pilotée par le parent (présélection par CTA),
// hors schéma : toujours renseignée, rien à valider.
const voie = defineModel<CandidatureVoie>('voie', { default: 'centre' })

const VOIE_OPTIONS: { value: CandidatureVoie; label: string }[] = [
  { value: 'centre', label: 'Ouvrir un centre' },
  { value: 'organisme', label: 'Référencer mon organisme' },
  { value: 'formateur', label: 'Formateur indépendant' }
]

const { handleSubmit, errors, submitCount, defineField } = useForm({
  validationSchema: toTypedSchema(
    z.object({
      nom: z
        .string({ error: 'Indiquez votre nom et prénom.' })
        .trim()
        .min(1, 'Indiquez votre nom et prénom.'),
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
      ville: z
        .string({ error: 'Indiquez la ville ou le territoire visé.' })
        .trim()
        .min(1, 'Indiquez la ville ou le territoire visé.'),
      parcours: z
        .string({ error: 'Décrivez votre parcours et votre projet.' })
        .trim()
        .min(1, 'Décrivez votre parcours et votre projet.'),
      consentement: z
        .boolean({ error: 'Consentement requis pour envoyer la candidature.' })
        .refine((value) => value, 'Consentement requis pour envoyer la candidature.')
    })
  ),
  initialValues: { consentement: false }
})

const [nom] = defineField('nom')
const [email] = defineField('email')
const [telephone] = defineField('telephone')
const [ville] = defineField('ville')
const [parcours] = defineField('parcours')
const [consentement] = defineField('consentement')

type CandidatureField = 'nom' | 'email' | 'telephone' | 'ville' | 'parcours' | 'consentement'

// Erreurs masquées jusqu'à la 1re tentative d'envoi, puis en direct.
const showError = (field: CandidatureField) => submitCount.value > 0 && !!errors.value[field]

const onSubmit = handleSubmit((values) => {
  if (props.sending) return
  emit('submit', {
    voie: voie.value,
    nom: values.nom,
    email: values.email,
    telephone: values.telephone,
    ville: values.ville,
    parcours: values.parcours
  })
})
</script>
