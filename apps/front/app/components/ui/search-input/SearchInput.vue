<template>
  <div>
    <div
      :class="
        cn(
          'relative flex h-control items-center gap-sm rounded-full border bg-paper pl-md pr-sm shadow-sm transition-colors',
          sizeClasses.pill,
          isLoading ? 'border-outline-soft bg-surface-soft' : '',
          hasError ? 'border-danger' : sizeClasses.border,
          !isLoading && !hasError ? sizeClasses.focus : '',
          $attrs.class as string
        )
      "
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
        :class="
          cn(
            'h-auto flex-1 border-0 bg-transparent px-0 text-small text-ink shadow-none placeholder:text-ink-placeholder focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-70',
            sizeClasses.input
          )
        "
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
        :class="cn('shrink-0 disabled:cursor-not-allowed', sizeClasses.button)"
        @click="submit"
      >
        <span
          v-if="isLoading"
          class="block h-4 w-4 animate-spin rounded-full border-2 border-paper/40 border-t-paper"
          aria-hidden="true"
        />
        <IconSearch v-else :size="sizeClasses.iconSize" />
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
import { cn } from '@/lib/utils'
import SuggestList from '~/components/ui/search-input/SuggestList.vue'
import { useSuggestDropdown } from '~/composables/useSuggestDropdown'
import type { SearchInputSize } from '~/components/ui/search-input'

interface SizeClasses {
  pill: string
  border: string
  focus: string
  input: string
  button: string
  iconSize: number
}

// Une seule anatomie déclinée en deux tailles (§3) : `default` (44px —
// catalogue, header) et `hero` (48px, bordure marine épaisse — Home et page
// moteur, composant validé 9a).
const SIZE_CLASSES: Record<SearchInputSize, SizeClasses> = {
  default: {
    pill: '',
    border: 'border-outline',
    focus: 'focus-within:ring-2 focus-within:ring-outline',
    input: '',
    button: '',
    iconSize: 16
  },
  hero: {
    pill: 'h-14 gap-md border-2 pl-md md:h-16 md:pl-lg',
    border: 'border-primary/75',
    focus: 'focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20',
    input: 'md:text-body',
    button: 'md:h-12 md:w-12',
    iconSize: 18
  }
}

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
    size?: SearchInputSize
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
    size: 'default',
    suggestions: undefined
  }
)

defineOptions({ inheritAttrs: false })

const emit = defineEmits<{
  'update:modelValue': [value: string]
  submit: [value: string]
  /** Chaque frappe — alimente l'autocomplétion. `modelValue` reste réservé à la soumission. */
  input: [value: string]
  /** Clic sur « effacer » — émis avant `update:modelValue('')` et `submit('')`. */
  clear: []
}>()

const draft = ref(props.modelValue ?? '')
const errorId = `${props.inputId}-error`
const listId = `${props.inputId}-suggestions`

const isLoading = computed(() => props.loading)
const hasError = computed(() => !!props.errorMessage)
const sizeClasses = computed(() => SIZE_CLASSES[props.size])

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
  const value = suggestionList.value[index]
  if (value === undefined) return
  draft.value = value
  close()
  emit('update:modelValue', value)
  emit('submit', value)
}

function submit() {
  if (isLoading.value) return
  close()
  emit('update:modelValue', draft.value)
  emit('submit', draft.value)
}

function clear() {
  if (isLoading.value) return
  draft.value = ''
  close()
  emit('clear')
  emit('update:modelValue', '')
  emit('submit', '')
}
</script>
