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
            <SelectTrigger id="rappel-creneau" variant="field">
              <span class="flex items-center gap-xs">
                <IconClock :size="16" class="text-ink-subtle" aria-hidden="true" />
                <SelectValue placeholder="Dès que possible" />
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="option in CRENEAU_OPTIONS"
                :key="option"
                :value="option"
                class="text-small"
              >
                {{ option }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <p
          :class="[
            'text-meta leading-tight',
            variant === 'dark' ? 'text-ink-inverse-muted' : 'text-ink-muted'
          ]"
        >
          En validant, vous acceptez d'être rappelé par un conseiller pour votre projet de
          formation.
        </p>

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
      <div
        v-else
        key="confirmed"
        role="status"
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
            Un conseiller vous rappellera <strong>{{ creneau.toLowerCase() }}</strong> au
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
      </div>
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

const CRENEAU_OPTIONS = ['Dès que possible', 'Ce matin', 'Cet après-midi'] as const

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

const openButtonRef = ref<{ $el?: HTMLButtonElement; focus?: () => void } | null>(null)
const phoneInputRef = ref<{ $el?: HTMLInputElement; focus?: () => void } | null>(null)

const { submit: submitLead, sending, error: submitError, reset: resetLeadError } = useLeadSubmit()

const {
  errors,
  defineField,
  handleSubmit: validateAndSubmit,
  resetForm
} = useForm({
  validationSchema: toTypedSchema(
    z.object({
      telephone: leadFields({ email: '', consentement: '' }).telephone,
      creneau: z.string().optional()
    })
  ),
  initialValues: {
    telephone: '',
    creneau: 'Dès que possible'
  }
})

const [telephone] = defineField('telephone')
const [creneau] = defineField('creneau')

const errorMessage = computed(() => errors.value.telephone ?? null)
const showError = computed(() => submitAttempted.value && !!errorMessage.value)

function openForm() {
  isOpen.value = true
  submitAttempted.value = false
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
    const cr = values.creneau || 'Dès que possible'

    const success = await submitLead('rappel', {
      telephone: tel,
      creneau: cr,
      consentement: true
    })

    if (success) {
      submitted.value = true
      emit('submit', { telephone: tel, creneau: cr })
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
      creneau: 'Dès que possible'
    }
  })
}
</script>
