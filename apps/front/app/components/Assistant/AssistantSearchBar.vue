<template>
  <div role="search" :aria-label="srLabel">
    <SearchInput
      :model-value="modelValue"
      :input-id="inputId"
      :sr-label="srLabel"
      :placeholder="placeholder"
      button-label="Lancer la recherche"
      loading-label="Analyse de votre besoin en cours"
      :loading="loading"
      :error-message="errorMessage"
      :size="size"
      :class="cn('w-full text-left', pillClass)"
      @input="onInput"
      @clear="onClear"
      @submit="onSubmit"
    >
      <template #icon>
        <IconSparkle :size="size === 'hero' ? 22 : 18" class="shrink-0 text-accent" />
      </template>
    </SearchInput>

    <p
      v-if="hint"
      :class="
        cn(
          'mt-3 text-xs md:text-small',
          tone === 'inverse' ? 'text-ink-inverse-muted' : 'text-ink-muted'
        )
      "
    >
      {{ hint }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { cn } from '@/lib/utils'
import type { SearchInputSize } from '~/components/ui/search-input'

/**
 * Champ d'entrée du moteur IA — le composant de la Home (pilule marine,
 * étincelle ambre, bouton loupe) repris à l'identique sur toutes les entrées
 * du moteur (Home, page moteur, catalogue). Une soumission vide affiche
 * l'erreur de saisie (§40) au lieu d'ouvrir le moteur.
 */
withDefaults(
  defineProps<{
    modelValue?: string
    inputId: string
    size?: SearchInputSize
    placeholder?: string
    /** Aide affichée sous le champ (ex. « Vous pouvez écrire comme vous le feriez à un conseiller. »). */
    hint?: string
    /** `inverse` sur fond marine : l'aide passe en clair. */
    tone?: 'default' | 'inverse'
    /** Classes additionnelles de la pilule (bordure, ombre) selon le fond. */
    pillClass?: string
    loading?: boolean
  }>(),
  {
    modelValue: '',
    size: 'default',
    placeholder: 'Décrivez votre besoin de formation…',
    hint: '',
    tone: 'default',
    pillClass: '',
    loading: false
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
  submit: [value: string]
}>()

const srLabel = 'Décrivez votre besoin de formation'
const EMPTY_QUERY_MESSAGE = 'Décrivez votre besoin pour lancer la recherche.'

const errorMessage = ref('')

// SearchInput émet `clear` puis `submit('')` : le drapeau neutralise cette
// soumission — effacer le champ n'est pas une soumission vide.
let clearing = false

function onInput() {
  errorMessage.value = ''
}

function onClear() {
  clearing = true
  errorMessage.value = ''
  emit('update:modelValue', '')
}

function onSubmit(value: string) {
  if (clearing) {
    clearing = false
    return
  }

  const trimmed = value.trim()
  if (!trimmed) {
    errorMessage.value = EMPTY_QUERY_MESSAGE
    return
  }
  errorMessage.value = ''
  emit('update:modelValue', trimmed)
  emit('submit', trimmed)
}
</script>
