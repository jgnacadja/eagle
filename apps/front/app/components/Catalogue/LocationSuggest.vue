<template>
  <div class="relative flex items-center gap-sm rounded-full border border-outline px-md py-sm">
    <IconMapPin :size="16" class="shrink-0 text-ink-subtle" />
    <input
      :id="inputId"
      v-model="input"
      type="text"
      role="combobox"
      aria-autocomplete="list"
      :aria-expanded="isOpen"
      :aria-controls="listId"
      :aria-activedescendant="activeDescendant"
      :placeholder="placeholder"
      autocomplete="off"
      class="min-w-0 flex-1 border-0 bg-transparent text-small text-ink-body placeholder:text-ink-placeholder focus:outline-none focus:ring-0"
      @input="onInput"
      @keydown="onKeydown"
      @focus="open"
      @blur="close"
    />
    <button
      v-if="input"
      type="button"
      class="text-ink-subtle transition-colors hover:text-accent-text"
      aria-label="Effacer la localisation"
      @click="clear()"
    >
      <IconClose :size="14" />
    </button>
    <SuggestList
      v-if="isOpen && suggestions.length"
      :id="listId"
      :suggestions="suggestionLabels"
      :active-index="activeIndex"
      @pick="pick"
      @highlight="(i) => (activeIndex = i)"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue'
import { useGeoSuggest } from '~/composables/useGeoSuggest'
import { useSuggestDropdown } from '~/composables/useSuggestDropdown'
import SuggestList from '~/components/ui/search-input/SuggestList.vue'

const model = defineModel<string | undefined>()
withDefaults(defineProps<{ inputId?: string; placeholder?: string }>(), {
  inputId: undefined,
  placeholder: 'Ville, département, région'
})

const input = ref(model.value ?? '')
const listId = `geo-suggest-${useId()}`
const { suggestions, request, byLabel, byLocation } = useGeoSuggest()
const suggestionLabels = computed(() => suggestions.value.map((s) => s.label))
const { isOpen, activeIndex, open, close, onKeydown } = useSuggestDropdown(suggestions, pick)

const activeDescendant = computed(() =>
  isOpen.value && activeIndex.value >= 0 ? `${listId}-option-${activeIndex.value}` : undefined
)

// L'input porte le label (« Lyon (69) ») pendant que le modèle reçoit la
// valeur de filtrage (lat,lng ou code département) via cette correspondance.
watch(model, (value) => {
  const next = (value && byLocation(value)?.label) ?? value ?? ''
  if (next !== input.value) input.value = next
})

function onInput() {
  model.value = byLabel(input.value)?.location ?? (input.value || undefined)
  request(input.value)
  open()
}

function pick(index: number) {
  // pick n'est appelé que via les options rendues ou Entrée avec activeIndex >= 0
  const suggestion = suggestions.value[index]!
  input.value = suggestion.label
  model.value = suggestion.location
  close()
}

function clear() {
  input.value = ''
  model.value = undefined
}
</script>
