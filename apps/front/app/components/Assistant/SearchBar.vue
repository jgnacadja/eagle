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
      :size="size"
      :empty-error-message="EMPTY_QUERY_MESSAGE"
      :class="cn('w-full text-left', pillClass)"
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
    /** Aide affichée sous le champ (ex. « Vous pouvez écrire comme vous le feriez à votre conseiller. »). */
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

// SearchInput refuse lui-même la soumission vide (`emptyErrorMessage`) ;
// « effacer » émet `submit('')` : le champ se vide sans ouvrir le moteur.
function onSubmit(value: string) {
  const trimmed = value.trim()
  emit('update:modelValue', trimmed)
  if (trimmed) emit('submit', trimmed)
}
</script>
