<template>
  <!-- Saisie libre en pied de conversation (réponse à une clarification). -->
  <form class="flex items-center gap-sm" @submit.prevent="submit">
    <label :for="inputId" class="sr-only">{{ label }}</label>
    <Input
      :id="inputId"
      v-model="draft"
      variant="field"
      type="text"
      autocomplete="off"
      :placeholder="placeholder"
      class="flex-1"
    />
    <Button type="submit" size="icon-sm" class="shrink-0" :aria-label="buttonLabel">
      <IconArrowRight :size="16" />
    </Button>
  </form>
</template>

<script setup lang="ts">
import { ref, useId } from 'vue'

withDefaults(
  defineProps<{
    placeholder?: string
    label?: string
    buttonLabel?: string
  }>(),
  {
    placeholder: 'Ou répondez librement…',
    label: 'Répondre librement',
    buttonLabel: 'Envoyer ma réponse'
  }
)

const emit = defineEmits<{ submit: [value: string] }>()

const inputId = `assistant-composer-${useId()}`
const draft = ref('')

function submit() {
  const value = draft.value.trim()
  if (!value) return
  emit('submit', value)
  draft.value = ''
}
</script>
