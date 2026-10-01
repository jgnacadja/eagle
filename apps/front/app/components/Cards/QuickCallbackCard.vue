<template>
  <Card :variant="variant === 'dark' ? 'dark' : 'surface'" class="p-lg">
    <div class="space-y-xs">
      <h2 :class="['text-small font-semibold', variant === 'dark' ? 'text-paper' : 'text-ink']">
        Besoin d'un échange téléphonique direct&nbsp;?
      </h2>
      <p :class="['text-small', variant === 'dark' ? 'text-ink-inverse-muted' : 'text-ink-muted']">
        Saisissez votre numéro afin que votre conseiller puisse vous rappeler.
      </p>
    </div>

    <!-- Transition fluide entre l'état initial, le formulaire déplié et la confirmation -->
    <Transition name="form-step" mode="out-in" @after-enter="onTransitionAfterEnter">
      <!-- État A : Encart compact (Bouton CTA principal) -->
      <div v-if="!isOpen && !submitted" key="cta" class="mt-md">
        <Button
          ref="openButtonRef"
          type="button"
          variant="accent"
          size="pill"
          class="w-full shadow-sm font-semibold"
          @click="openForm"
        >
          <IconPhone :size="16" class="mr-xs" aria-hidden="true" />
          Me faire appeler
        </Button>
        <div class="mt-sm text-center">
          <NuxtLink
            to="/centres"
            :class="[
              'text-meta underline underline-offset-4 transition-colors',
              variant === 'dark'
                ? 'text-ink-inverse-muted hover:text-paper'
                : 'text-ink-muted hover:text-ink'
            ]"
          >
            Trouver un centre <span class="link-arrow">→</span>
          </NuxtLink>
        </div>
      </div>

      <!-- État B : Formulaire démasqué / déplié -->
      <form
        v-else-if="isOpen && !submitted"
        key="form"
        novalidate
        class="mt-md space-y-md"
        @submit.prevent="handleSubmit"
        @keydown.esc="handleCancel"
      >
        <div>
          <Label
            for="rappel-telephone"
            :class="[
              'mb-xs block text-meta font-medium',
              variant === 'dark' ? 'text-paper' : 'text-ink'
            ]"
          >
            Votre numéro de téléphone <span class="text-danger" aria-hidden="true">*</span>
          </Label>
          <Input
            id="rappel-telephone"
            ref="phoneInputRef"
            v-model="telephone"
            type="tel"
            autocomplete="tel"
            placeholder="ex: 06 12 34 56 78"
            variant="field"
            :aria-invalid="showError ? 'true' : undefined"
            :aria-describedby="showError ? 'rappel-tel-error' : undefined"
            class="aria-invalid:border-danger"
          />
          <p
            v-if="showError"
            id="rappel-tel-error"
            class="mt-xs text-meta font-semibold text-danger"
            role="alert"
          >
            {{ errorMessage }}
          </p>
        </div>

        <div>
          <Label
            id="rappel-creneau-label"
            for="rappel-creneau"
            :class="[
              'mb-xs block text-meta font-medium',
              variant === 'dark' ? 'text-paper' : 'text-ink'
            ]"
          >
            Heure / Créneau souhaité
            <span class="text-meta font-normal opacity-80">(optionnel)</span>
          </Label>
          <Select v-model="creneau">
            <SelectTrigger
              id="rappel-creneau"
              variant="field"
              aria-labelledby="rappel-creneau-label"
            >
              <span class="flex items-center gap-xs">
                <IconClock :size="16" class="text-ink-subtle" aria-hidden="true" />
                <SelectValue placeholder="Dès que possible" />
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="option in creneauOptions"
                :key="option"
                :value="option"
                class="text-small"
              >
                {{ option }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <ConsentField
          id="rappel-consentement"
          v-model="consentement"
          :invalid="showConsentError"
          :error="errors.consentement"
          :label-class="variant === 'dark' ? 'text-ink-inverse-muted' : undefined"
        >
          {{ RAPPEL_CONSENT_TEXT }}
          <NuxtLink
            to="/confidentialite"
            :class="[
              'font-medium underline underline-offset-2 transition-colors',
              variant === 'dark'
                ? 'text-paper hover:text-accent'
                : 'text-primary hover:text-accent-text'
            ]"
          >
            Politique de confidentialité
          </NuxtLink>
        </ConsentField>

        <div>
          <Button
            type="submit"
            variant="accent"
            size="pill"
            class="w-full shadow-sm font-semibold"
            :disabled="sending"
          >
            <span
              v-if="sending"
              class="mr-sm block h-md w-md animate-spin rounded-full border-2 border-ink/25 border-t-ink"
              aria-hidden="true"
            />
            {{ sending ? 'Validation…' : 'Valider le rappel' }}
          </Button>

          <p
            v-if="submitError"
            class="mt-xs text-meta font-semibold text-danger text-center"
            role="alert"
          >
            {{ submitError }}
          </p>

          <div class="mt-sm text-center">
            <button
              type="button"
              :class="[
                'text-meta underline underline-offset-4 transition-colors',
                variant === 'dark'
                  ? 'text-ink-inverse-muted hover:text-paper'
                  : 'text-ink-muted hover:text-ink'
              ]"
              @click="handleCancel"
            >
              Annuler
            </button>
          </div>
        </div>
      </form>

      <!-- État C : Confirmation après validation -->
      <output
        v-else
        key="confirmed"
        aria-live="polite"
        class="mt-md flex flex-col items-center gap-sm text-center py-sm"
      >
        <div
          class="flex h-3xl w-3xl items-center justify-center rounded-full bg-success-soft text-success"
          aria-hidden="true"
        >
          <IconCheck :size="24" aria-hidden="true" />
        </div>
        <div>
          <h3
            :class="[
              'font-display text-small font-bold',
              variant === 'dark' ? 'text-paper' : 'text-ink'
            ]"
          >
            Demande de rappel enregistrée
          </h3>
          <p
            :class="[
              'mt-xs text-meta leading-relaxed',
              variant === 'dark' ? 'text-ink-inverse-muted' : 'text-ink-muted'
            ]"
          >
            Un conseiller vous rappellera <strong>{{ creneau?.toLowerCase() }}</strong> au
            <strong>{{ telephone }}</strong
            >.
          </p>
        </div>
        <button
          type="button"
          :class="[
            'mt-xs text-meta underline underline-offset-4 transition-colors',
            variant === 'dark'
              ? 'text-accent hover:text-paper'
              : 'text-primary hover:text-accent-text'
          ]"
          @click="reset"
        >
          Faire une autre demande
        </button>
      </output>
    </Transition>
  </Card>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { z } from 'zod'
import { Button } from '~/components/ui/button'
import { Card } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '~/components/ui/select'
import { leadFields } from '~/utils/leadFields'
import ConsentField from '~/components/ConsentField.vue'

const CRENEAU_ASAP = 'Dès que possible'
const CRENEAU_MATIN = 'Ce matin'
const CRENEAU_OPTIONS = [CRENEAU_ASAP, CRENEAU_MATIN, 'Cet après-midi'] as const

// Libellé de la case de consentement — transmis tel quel à l'API qui le
// verse dans legalConsentOptions HubSpot : le CRM enregistre exactement ce
// que l'utilisateur a lu.
const RAPPEL_CONSENT_TEXT =
  "J'accepte d'être rappelé par un conseiller au sujet de mon projet de formation."

// « Ce matin » n'a de sens qu'avant midi : passé 12 h le créneau est déjà
// révolu — recalculé à l'ouverture du formulaire et à la soumission.
function availableCreneaux(now = new Date()): string[] {
  return now.getHours() < 12
    ? [...CRENEAU_OPTIONS]
    : CRENEAU_OPTIONS.filter((option) => option !== CRENEAU_MATIN)
}

withDefaults(
  defineProps<{
    variant?: 'dark' | 'light'
  }>(),
  {
    variant: 'dark'
  }
)

const emit = defineEmits<{
  (e: 'submit', payload: { telephone: string; creneau: string }): void
  (e: 'cancel'): void
}>()

const isOpen = ref(false)
const submitted = ref(false)
const submitAttempted = ref(false)
const creneauOptions = ref<string[]>(availableCreneaux())

const openButtonRef = ref<{ $el?: HTMLButtonElement; focus?: () => void } | null>(null)
const phoneInputRef = ref<{ $el?: HTMLInputElement; focus?: () => void } | null>(null)

const {
  submit: submitLead,
  sending,
  error: submitError,
  validationErrors,
  reset: resetLeadError
} = useLeadSubmit()

const {
  errors,
  defineField,
  handleSubmit: validateAndSubmit,
  resetForm,
  setFieldError
} = useForm({
  validationSchema: toTypedSchema(
    z.object({
      telephone: leadFields({ email: '', consentement: '' }).telephone,
      creneau: z.string().optional(),
      consentement: leadFields({
        email: '',
        consentement: 'Consentement requis pour demander un rappel.'
      }).consentement
    })
  ),
  initialValues: {
    telephone: '',
    creneau: 'Dès que possible',
    consentement: false
  }
})

const [telephone] = defineField('telephone')
const [creneau] = defineField('creneau')
const [consentement] = defineField('consentement')

const errorMessage = computed(() => errors.value.telephone ?? null)
const showError = computed(() => submitAttempted.value && !!errorMessage.value)
const showConsentError = computed(() => submitAttempted.value && !!errors.value.consentement)

function openForm() {
  isOpen.value = true
  submitAttempted.value = false
  creneauOptions.value = availableCreneaux()
  resetLeadError()
}

function onTransitionAfterEnter() {
  if (isOpen.value && !submitted.value) {
    const el =
      (phoneInputRef.value?.$el as HTMLElement)?.querySelector('input') ??
      phoneInputRef.value?.$el ??
      phoneInputRef.value
    el?.focus?.()
  } else if (!isOpen.value && !submitted.value) {
    const el = openButtonRef.value?.$el ?? openButtonRef.value
    el?.focus?.()
  }
}

function handleCancel() {
  isOpen.value = false
  submitAttempted.value = false
  resetLeadError()
  emit('cancel')
}

const handleSubmit = validateAndSubmit(
  async (values) => {
    submitAttempted.value = true
    const tel = values.telephone.trim()
    // Le créneau peut être devenu invalide depuis l'ouverture du formulaire
    // (« Ce matin » choisi à 11 h 59, validé à 12 h 01) → repli.
    const requested = values.creneau || CRENEAU_ASAP
    const cr = availableCreneaux().includes(requested) ? requested : CRENEAU_ASAP

    const success = await submitLead('rappel', {
      telephone: tel,
      creneau: cr,
      consentement: values.consentement,
      consentementTexte: RAPPEL_CONSENT_TEXT
    })

    if (success) {
      submitted.value = true
      emit('submit', { telephone: tel, creneau: cr })
    } else if (validationErrors.value.length > 0) {
      // 400 de validation : le message du champ remonte sous l'input
      // plutôt que l'erreur générique sans piste de correction.
      setFieldError('telephone', validationErrors.value.join(' '))
      resetLeadError()
    }
  },
  () => {
    submitAttempted.value = true
  }
)

function reset() {
  submitted.value = false
  isOpen.value = false
  submitAttempted.value = false
  resetLeadError()
  resetForm({
    values: {
      telephone: '',
      creneau: 'Dès que possible',
      consentement: false
    }
  })
}
</script>
