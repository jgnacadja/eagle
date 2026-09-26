<template>
  <div>
    <Label :for="id" variant="muted" class="flex items-center gap-sm">
      <Checkbox
        :id="id"
        v-model="model"
        :aria-invalid="invalid || undefined"
        :aria-describedby="invalid ? `${id}-error` : undefined"
      />
      <span><slot>Consentement requis</slot></span>
    </Label>
    <p v-if="invalid" :id="`${id}-error`" class="mt-xs text-small font-semibold text-danger">
      {{ error }}
    </p>
  </div>
</template>

<script setup lang="ts">
const model = defineModel<boolean>()

withDefaults(
  defineProps<{
    /** Id du checkbox — sert aussi de préfixe pour `aria-describedby`. */
    id?: string
    /** Affiche l'erreur et marque le checkbox en `aria-invalid`. */
    invalid?: boolean
    /** Message d'erreur affiché quand `invalid` est vrai. */
    error?: string
  }>(),
  { id: 'consentement', error: undefined }
)
</script>
