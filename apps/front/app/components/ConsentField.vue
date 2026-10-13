<template>
  <div>
    <Label :for="id" variant="muted" :class="['flex items-center gap-sm', labelClass]">
      <Checkbox
        :id="id"
        v-model="model"
        :aria-invalid="invalid || undefined"
        :aria-describedby="invalid ? `${id}-error` : undefined"
        :class="consentCheckbox({ surface: variant })"
      />
      <span><slot>Consentement requis</slot></span>
    </Label>
    <p
      v-if="invalid"
      :id="`${id}-error`"
      :class="['mt-xs text-small font-semibold', consentErrorText({ surface: variant })]"
    >
      {{ error }}
    </p>
  </div>
</template>

<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { consentCheckbox, consentErrorText, type ConsentSurface } from '~/utils/consentVariants'

const model = defineModel<boolean>()

withDefaults(
  defineProps<{
    /** Id du checkbox — sert aussi de préfixe pour `aria-describedby`. */
    id?: string
    /** Affiche l'erreur et marque le checkbox en `aria-invalid`. */
    invalid?: boolean
    /** Message d'erreur affiché quand `invalid` est vrai. */
    error?: string
    /** Classes additionnelles du label (ex. texte clair sur carte sombre). */
    labelClass?: HTMLAttributes['class']
    /** `dark` adapte le contour du checkbox et l'erreur aux fonds marine. */
    variant?: ConsentSurface
  }>(),
  { id: 'consentement', error: undefined, labelClass: undefined, variant: 'default' }
)
</script>
