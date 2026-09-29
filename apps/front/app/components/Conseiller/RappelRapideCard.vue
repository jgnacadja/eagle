<template>
  <Card
    :variant="variant === 'dark' ? 'dark' : 'surface'"
    :class="[
      'p-lg transition-all duration-300',
      variant === 'light' ? 'border border-rule bg-surface' : ''
    ]"
  >
    <div class="space-y-xs">
      <h2 :class="['text-small font-semibold', variant === 'dark' ? 'text-paper' : 'text-ink']">
        Besoin d'un échange téléphonique direct&nbsp;?
      </h2>
      <p :class="['text-small', variant === 'dark' ? 'text-ink-inverse-muted' : 'text-ink-muted']">
        Saisissez votre numéro afin que votre conseiller puisse vous rappeler.
      </p>
    </div>

    <!-- Transition fluide entre l'état initial, le formulaire déplié et la confirmation -->
    <Transition name="rappel-fade-slide" mode="out-in">
      <!-- État A : Encart compact (Bouton CTA principal) -->
      <div v-if="!isOpen && !submitted" key="cta" class="mt-md">
        <Button
          type="button"
          variant="accent"
          size="pill"
          class="w-full shadow-sm font-semibold"
          @click="openForm"
        >
          <IconPhone :size="16" class="mr-xs" aria-hidden="true" />
          Me faire appeler
        </Button>
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
      <div v-else key="confirmed" class="mt-md flex flex-col items-center gap-sm text-center py-sm">
        <p
          class="flex h-3xl w-3xl items-center justify-center rounded-full bg-success-soft text-success"
        >
          <IconCheck :size="24" />
        </p>
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
import { computed, nextTick, ref } from 'vue'
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

const CRENEAU_OPTIONS = ['Dès que possible', 'Ce matin', 'Cet après-midi'] as const
export type CreneauOption = (typeof CRENEAU_OPTIONS)[number]

const props = withDefaults(
  defineProps<{
    variant?: 'dark' | 'light'
    initialOpen?: boolean
  }>(),
  {
    variant: 'dark',
    initialOpen: false
  }
)

const emit = defineEmits<{
  (e: 'submit', payload: { telephone: string; creneau: string }): void
  (e: 'cancel'): void
}>()

const isOpen = ref(props.initialOpen)
const submitted = ref(false)
const sending = ref(false)
const telephone = ref('')
const creneau = ref<string>('Dès que possible')
const submitAttempted = ref(false)
const phoneInputRef = ref<{ $el?: HTMLInputElement; focus?: () => void } | null>(null)

const errorMessage = computed(() => {
  const trimmed = telephone.value.trim()
  if (!trimmed) {
    return 'Indiquez votre numéro de téléphone.'
  }
  const digits = trimmed.replace(/\D/g, '')
  if (digits.length < 10) {
    return 'Numéro incomplet — 10 chiffres attendus.'
  }
  return null
})

const showError = computed(() => submitAttempted.value && !!errorMessage.value)

function openForm() {
  isOpen.value = true
  submitAttempted.value = false
  nextTick(() => {
    const el = phoneInputRef.value?.$el ?? phoneInputRef.value
    el?.focus?.()
  })
}

function handleCancel() {
  isOpen.value = false
  submitAttempted.value = false
  emit('cancel')
}

async function handleSubmit() {
  submitAttempted.value = true
  if (errorMessage.value) return

  sending.value = true
  await new Promise((resolve) => setTimeout(resolve, 300))
  sending.value = false
  submitted.value = true

  emit('submit', {
    telephone: telephone.value.trim(),
    creneau: creneau.value
  })
}

function reset() {
  submitted.value = false
  isOpen.value = false
  telephone.value = ''
  creneau.value = 'Dès que possible'
  submitAttempted.value = false
}
</script>

<style scoped>
.rappel-fade-slide-enter-active,
.rappel-fade-slide-leave-active {
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.rappel-fade-slide-enter-from {
  opacity: 0;
  transform: translateY(-6px);
}

.rappel-fade-slide-leave-to {
  opacity: 0;
  transform: translateY(6px);
}
</style>
