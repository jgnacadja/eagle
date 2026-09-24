<template>
  <!-- É10 — comparaison des alternatives (§15) : aider à choisir, pas
       multiplier les résultats. Le score de pertinence ordonne les lignes
       mais n'est pas affiché (§12). Tableau sur desktop, cartes sur mobile. -->
  <section :aria-labelledby="titleId">
    <Button
      type="button"
      variant="link"
      size="inline"
      class="gap-xs text-small font-semibold"
      @click="emit('back')"
    >
      <IconChevronLeft :size="16" />
      Retour aux recommandations
    </Button>

    <h2 :id="titleId" class="mt-md font-display text-h4 font-bold text-ink md:text-h3">
      Comparer les formations recommandées
    </h2>
    <p class="mt-xs text-small text-ink-body md:text-body">
      Les différences ci-dessous portent sur le besoin exprimé : {{ comparison.need }}.
    </p>

    <div class="mt-md hidden overflow-hidden rounded-md border border-rule md:block">
      <table class="w-full border-collapse text-left text-small">
        <caption class="sr-only">
          Comparaison des formations recommandées
        </caption>
        <thead class="bg-surface text-overline uppercase tracking-wider text-ink-muted">
          <tr>
            <th scope="col" class="px-md py-sm font-bold">Formation</th>
            <th scope="col" class="px-md py-sm font-bold">Pourquoi la choisir</th>
            <th scope="col" class="px-md py-sm font-bold">Durée</th>
            <th scope="col" class="px-md py-sm font-bold">Modalité</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in comparison.rows"
            :key="row.course.to"
            class="border-t border-rule align-top"
            :class="row.principal ? 'bg-surface-soft' : ''"
          >
            <th scope="row" class="px-md py-md font-bold text-ink">
              <span
                v-if="row.principal"
                class="block text-overline uppercase tracking-wider text-accent-text"
              >
                Principale
              </span>
              <NuxtLink :to="row.course.to" class="transition-colors hover:text-accent-text">
                {{ row.course.title }}
              </NuxtLink>
            </th>
            <td class="px-md py-md text-ink-body">{{ row.why }}</td>
            <td class="px-md py-md text-ink">{{ row.duration }}</td>
            <td class="px-md py-md text-ink">{{ row.modality }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <ul class="mt-md flex flex-col gap-sm md:hidden" aria-label="Formations comparées">
      <li
        v-for="row in comparison.rows"
        :key="row.course.to"
        class="rounded-md border p-md"
        :class="row.principal ? 'border-primary bg-surface-soft' : 'border-rule bg-paper'"
      >
        <p
          v-if="row.principal"
          class="text-overline font-bold uppercase tracking-wider text-accent-text"
        >
          Principale
        </p>
        <p class="font-bold text-ink">
          <NuxtLink :to="row.course.to">{{ row.course.title }}</NuxtLink>
        </p>
        <p class="mt-xs text-small text-ink-body">{{ row.why }}</p>
        <p class="mt-xs text-meta text-ink-muted">{{ row.duration }} · {{ row.modality }}</p>
      </li>
    </ul>

    <div class="mt-lg flex flex-col gap-sm sm:flex-row sm:items-center">
      <Button v-if="principal" as-child variant="accent" size="pill-sm" class="w-full sm:w-auto">
        <NuxtLink :to="principal.course.to">Voir la formation principale</NuxtLink>
      </Button>
      <NuxtLink
        :to="advisorTo"
        class="text-small font-bold text-primary underline underline-offset-4 transition-colors hover:text-accent-text sm:ml-sm"
      >
        Être accompagné dans le choix
      </NuxtLink>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, useId } from 'vue'
import type { AssistantComparison } from '~/types/assistant'

const props = withDefaults(
  defineProps<{
    comparison: AssistantComparison
    advisorTo?: string
  }>(),
  { advisorTo: '/parler-a-votre-conseiller' }
)

const emit = defineEmits<{ back: [] }>()

const titleId = `assistant-comparison-${useId()}`
const principal = computed(() => props.comparison.rows.find((row) => row.principal))
</script>
