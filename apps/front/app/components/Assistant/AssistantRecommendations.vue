<template>
  <!-- É4 / É5 — 3 recommandations max, hiérarchisées (§13-15). -->
  <section :aria-labelledby="titleId">
    <h2 :id="titleId" class="font-display text-h4 font-bold text-ink">Nous vous recommandons</h2>

    <AssistantRecommendationCard
      class="mt-md"
      :recommendation="recommendations.principal"
      rank="principal"
      :position="1"
      :total="total"
      :advisor-to="advisorTo"
    />

    <div v-if="recommendations.alternatives.length" class="mt-md grid gap-md md:grid-cols-2">
      <AssistantRecommendationCard
        v-for="(alternative, index) in recommendations.alternatives"
        :key="alternative.course.to"
        :recommendation="alternative"
        rank="alternative"
        :position="index + 2"
        :total="total"
        :advisor-to="advisorTo"
      />
    </div>

    <p class="mt-md flex flex-wrap items-center gap-sm text-small font-bold">
      <!-- Comparaison : desktop uniquement, chaque carte porte déjà sa
           différence sur mobile (§15, §39). -->
      <template v-if="recommendations.alternatives.length">
        <Button
          type="button"
          variant="link"
          size="inline"
          class="hidden text-small font-bold underline underline-offset-4 md:inline-flex"
          @click="emit('compare')"
        >
          Comparer ces trois formations
        </Button>
        <span class="hidden font-normal text-ink-muted md:inline">ou</span>
      </template>
      <NuxtLink
        :to="advisorTo"
        class="text-primary underline underline-offset-4 transition-colors hover:text-accent-text"
      >
        Être accompagné par un conseiller
      </NuxtLink>
    </p>

    <!-- Mention de source (RG-IA-01). -->
    <p class="mt-sm text-meta text-ink-muted">
      Recommandations issues des formations publiées du catalogue LEARN UP.
    </p>
  </section>
</template>

<script setup lang="ts">
import { computed, useId } from 'vue'
import type { AssistantRecommendationSet } from '~/types/assistant'

const props = withDefaults(
  defineProps<{
    recommendations: AssistantRecommendationSet
    advisorTo?: string
  }>(),
  { advisorTo: '/parler-a-votre-conseiller' }
)

const emit = defineEmits<{ compare: [] }>()

const titleId = `assistant-recommendations-${useId()}`
const total = computed(() => 1 + props.recommendations.alternatives.length)
</script>
