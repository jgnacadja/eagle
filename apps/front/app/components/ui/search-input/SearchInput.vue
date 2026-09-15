<template>
  <div>
    <div
      :class="[
        'flex h-control items-center gap-sm rounded-full border bg-paper pl-md pr-sm shadow-sm transition-colors',
        isLoading ? 'border-outline-soft bg-surface-soft' : '',
        hasError ? 'border-danger' : 'border-outline',
        !isLoading && !hasError ? 'focus-within:ring-2 focus-within:ring-outline' : '',
        $attrs.class as string
      ]"
    >
      <slot name="icon" />
      <label :for="inputId" class="sr-only">{{ srLabel }}</label>
      <Input
        :id="inputId"
        :model-value="draft"
        :type="type"
        :placeholder="placeholder"
        :disabled="isLoading"
        :aria-invalid="hasError ? 'true' : undefined"
        :aria-describedby="hasError ? errorId : undefined"
        class="h-auto flex-1 border-0 bg-transparent px-0 text-small text-ink shadow-none placeholder:text-ink-placeholder focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-70"
        @update:model-value="onInput"
        @keydown.enter="submit"
      />
      <button
        v-if="draft && !isLoading"
        type="button"
        class="flex h-lg w-lg shrink-0 items-center justify-center rounded-full text-ink-subtle transition hover:bg-surface hover:text-ink"
        :aria-label="clearLabel"
        @click="clear"
      >
        <IconClose :size="14" />
      </button>
      <Button
        type="button"
        size="icon"
        :aria-label="isLoading ? loadingLabel : buttonLabel"
        :disabled="isLoading"
        class="h-8 w-8 shrink-0 rounded-full bg-primary text-paper hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-70"
        @click="submit"
      >
        <span
          v-if="isLoading"
          class="block h-4 w-4 animate-spin rounded-full border-2 border-paper/40 border-t-paper"
          aria-hidden="true"
        />
        <IconSearch v-else :size="16" />
      </Button>
    </div>

    <!-- Erreur de saisie (§40, moteur É9) -->
    <p v-if="hasError" :id="errorId" class="mt-xs text-small font-semibold text-danger">
      {{ errorMessage }}
    </p>

    <!-- Annonce accessible de l'état de chargement (aria-live) -->
    <output class="sr-only" aria-live="polite">
      {{ isLoading ? loadingLabel : '' }}
    </output>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue?: string
    inputId: string
    srLabel: string
    placeholder?: string
    buttonLabel?: string
    clearLabel?: string
    loadingLabel?: string
    type?: string
    loading?: boolean
    errorMessage?: string
  }>(),
  {
    modelValue: '',
    placeholder: '',
    buttonLabel: 'Rechercher',
    clearLabel: 'Effacer la recherche',
    loadingLabel: 'Analyse de votre besoin en cours',
    type: 'text',
    loading: false,
    errorMessage: ''
  }
)

defineOptions({ inheritAttrs: false })

const emit = defineEmits<{
  'update:modelValue': [value: string]
  submit: [value: string]
}>()

const draft = ref(props.modelValue ?? '')
const errorId = `${props.inputId}-error`

const isLoading = computed(() => props.loading)
const hasError = computed(() => !!props.errorMessage)

watch(
  () => props.modelValue,
  (value) => {
    draft.value = value
  }
)

function onInput(value: string | number) {
  draft.value = String(value)
}

function submit() {
  if (isLoading.value) return
  emit('update:modelValue', draft.value)
  emit('submit', draft.value)
}

function clear() {
  if (isLoading.value) return
  draft.value = ''
  emit('update:modelValue', '')
  emit('submit', '')
}
</script>
