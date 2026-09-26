<template>
  <div>
    <div
      :class="[
        'relative flex h-control items-center gap-sm rounded-full border bg-paper pl-md pr-sm shadow-sm transition-colors',
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
        :role="suggestions ? 'combobox' : undefined"
        :aria-expanded="suggestions ? isOpen : undefined"
        :aria-controls="suggestions ? listId : undefined"
        :aria-activedescendant="activeDescendant"
        :aria-autocomplete="suggestions ? 'list' : undefined"
        :autocomplete="suggestions ? 'off' : undefined"
        :placeholder="placeholder"
        :disabled="isLoading"
        :aria-invalid="hasError ? 'true' : undefined"
        :aria-describedby="hasError ? errorId : undefined"
        class="h-auto flex-1 border-0 bg-transparent px-0 text-small text-ink shadow-none placeholder:text-ink-placeholder focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-70"
        @update:model-value="onInput"
        @keydown="onKeydown"
        @focus="open"
        @blur="close"
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
      <slot name="action" />
      <Button
        type="button"
        size="icon-sm"
        :aria-label="isLoading ? loadingLabel : buttonLabel"
        :disabled="isLoading"
        class="shrink-0 disabled:cursor-not-allowed"
        @click="submit"
      >
        <span
          v-if="isLoading"
          class="block h-4 w-4 animate-spin rounded-full border-2 border-paper/40 border-t-paper"
          aria-hidden="true"
        />
        <IconSearch v-else :size="16" />
      </Button>

      <SuggestList
        v-if="suggestions && isOpen && suggestions.length"
        :id="listId"
        :suggestions="suggestions"
        :active-index="activeIndex"
        @pick="pickSuggestion"
        @highlight="(i) => (activeIndex = i)"
      />
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
import SuggestList from '~/components/ui/search-input/SuggestList.vue'
import { useSuggestDropdown } from '~/composables/useSuggestDropdown'

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
    /** Libellés d'autocomplétion (liste stylée) — ex. ville, CP, département. */
    suggestions?: string[]
  }>(),
  {
    modelValue: '',
    placeholder: '',
    buttonLabel: 'Rechercher',
    clearLabel: 'Effacer la recherche',
    loadingLabel: 'Analyse de votre besoin en cours',
    type: 'text',
    loading: false,
    errorMessage: '',
    suggestions: undefined
  }
)

defineOptions({ inheritAttrs: false })

const emit = defineEmits<{
  'update:modelValue': [value: string]
  submit: [value: string]
  /** Chaque frappe — alimente l'autocomplétion. `modelValue` reste réservé à la soumission. */
  input: [value: string]
}>()

const draft = ref(props.modelValue)
const errorId = `${props.inputId}-error`
const listId = `${props.inputId}-suggestions`

const isLoading = computed(() => props.loading)
const hasError = computed(() => !!props.errorMessage)

const suggestionList = computed(() => props.suggestions ?? [])
const {
  isOpen,
  activeIndex,
  open,
  close,
  onKeydown: onDropdownKeydown
} = useSuggestDropdown(suggestionList, pickSuggestion)

const activeDescendant = computed(() =>
  props.suggestions && isOpen.value && activeIndex.value >= 0
    ? `${listId}-option-${activeIndex.value}`
    : undefined
)

watch(
  () => props.modelValue,
  (value) => {
    draft.value = value
  }
)

function onInput(value: string | number) {
  draft.value = String(value)
  emit('input', draft.value)
  open()
}

function onKeydown(event: KeyboardEvent) {
  if (onDropdownKeydown(event)) return
  if (event.key === 'Enter') submit()
}

// Choix d'une suggestion : remplit le champ et soumet — même scénario que
// la touche Entrée ou le bouton recherche.
function pickSuggestion(index: number) {
  // pick n'est appelé qu'avec un index de la liste (option rendue ou Entrée
  // sur l'option active) : la suggestion est garantie d'exister.
  const value = suggestionList.value[index]!
  draft.value = value
  close()
  emit('update:modelValue', value)
  emit('submit', value)
}

// Les contrôles qui déclenchent submit/clear sont disabled ou masqués sous
// loading (v-if) : aucune garde isLoading nécessaire ici.
function submit() {
  close()
  emit('update:modelValue', draft.value)
  emit('submit', draft.value)
}

function clear() {
  draft.value = ''
  close()
  emit('update:modelValue', '')
  emit('submit', '')
}
</script>
