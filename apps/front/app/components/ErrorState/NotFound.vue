<template>
  <section
    class="mx-auto w-full max-w-prose px-gutter-mobile py-4xl text-center md:px-gutter"
    :aria-labelledby="titleId"
  >
    <div class="mx-auto mb-lg flex h-4xl w-4xl items-center justify-center rounded-full bg-surface">
      <slot name="icon" />
    </div>
    <h1 :id="titleId" class="font-display text-h2 font-extrabold text-ink lg:text-h1">
      {{ title }}
    </h1>
    <p class="mt-md text-body leading-relaxed text-ink-body">
      <slot />
    </p>
    <div
      class="mt-2xl flex flex-col items-stretch justify-center gap-md sm:flex-row sm:items-center"
    >
      <Button
        as-child
        class="h-control rounded-full bg-accent px-lg text-button font-semibold text-ink transition hover:bg-accent-text"
      >
        <NuxtLink :to="primaryTo">{{ primaryLabel }}</NuxtLink>
      </Button>
      <Button
        as-child
        variant="outline"
        class="h-control rounded-full border-outline px-lg text-button font-semibold text-ink transition hover:border-primary"
      >
        <NuxtLink :to="secondaryTo">{{ secondaryLabel }}</NuxtLink>
      </Button>
    </div>
    <form
      v-if="searchPlaceholder"
      class="mt-2xl"
      :class="{ 'text-left': searchLabel }"
      role="search"
      :aria-label="searchLabel ?? 'Rechercher une formation'"
      @submit.prevent
    >
      <label
        v-if="searchLabel"
        :for="inputId"
        class="mb-sm block text-meta font-bold tracking-wide text-ink-muted"
      >
        {{ searchLabel }}
      </label>
      <SearchInput
        v-model="query"
        :input-id="inputId"
        :sr-label="searchLabel ?? searchPlaceholder"
        :placeholder="searchPlaceholder"
        button-label="Rechercher"
        class="w-full"
        @submit="emit('search', $event)"
      >
        <template #icon>
          <IconSparkle :size="18" class="shrink-0 text-accent" />
        </template>
      </SearchInput>
    </form>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, useId } from 'vue'

const props = withDefaults(
  defineProps<{
    title: string
    primaryTo: string
    primaryLabel: string
    secondaryTo: string
    secondaryLabel: string
    /** Affiche le formulaire de recherche quand renseigné. */
    searchPlaceholder?: string
    /** Label visible au-dessus du champ de recherche. */
    searchLabel?: string
    searchInputId?: string
  }>(),
  { searchPlaceholder: undefined, searchLabel: undefined, searchInputId: undefined }
)

const emit = defineEmits<{ search: [query: string] }>()

const titleId = `not-found-title-${useId()}`
const generatedInputId = useId()
const inputId = computed(() => props.searchInputId ?? `error-search-${generatedInputId}`)
const query = ref('')
</script>
