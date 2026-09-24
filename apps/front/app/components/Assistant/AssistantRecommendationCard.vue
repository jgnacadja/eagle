<template>
  <!-- Anatomie carte (§13-14, §20, §25) : rang, intitulé exact du catalogue,
       justification au conditionnel, attributs factuels, disponibilité
       réelle, 1 CTA ambre max. -->
  <article
    :aria-label="`Recommandation ${position} sur ${total}`"
    :class="
      cn(
        'rounded-md p-md',
        principal
          ? 'border-2 border-primary bg-surface-soft md:p-lg'
          : 'border border-rule bg-paper'
      )
    "
  >
    <p
      :class="
        cn(
          'text-overline font-bold uppercase tracking-wider',
          principal ? 'text-accent-text' : 'text-ink-muted'
        )
      "
    >
      {{ principal ? 'Recommandation principale' : 'Alternative' }}
    </p>

    <h3 class="mt-xs font-sans text-h4 font-bold text-ink">
      <NuxtLink :to="recommendation.course.to" class="transition-colors hover:text-accent-text">
        {{ recommendation.course.title }}
      </NuxtLink>
    </h3>

    <p class="mt-xs text-small text-ink-body md:text-body">{{ recommendation.justification }}</p>

    <ul v-if="recommendation.attributes.length" class="mt-sm flex flex-wrap gap-xs">
      <li v-for="attribute in recommendation.attributes" :key="attribute">
        <Badge variant="outline">{{ attribute }}</Badge>
      </li>
    </ul>

    <!-- Bloc disponibilité : 3 niveaux formation / centre / session (§20),
         données référentiel uniquement (RG-IA-09). -->
    <div
      v-if="availability"
      class="mt-md rounded-sm border border-rule bg-paper p-sm text-small text-ink"
    >
      <div class="flex flex-wrap items-center justify-between gap-xs">
        <span class="flex items-center gap-xs font-semibold">
          <IconMapPin :size="16" class="shrink-0 text-primary" />
          {{ availability.centre }}
        </span>
        <span v-if="availability.distance" class="text-meta text-ink-muted">
          {{ availability.distance }}
        </span>
      </div>
      <div
        class="mt-xs flex flex-wrap items-center justify-between gap-xs border-t border-rule pt-xs"
      >
        <span class="flex items-center gap-xs">
          <IconCalendar :size="16" class="shrink-0 text-primary" />
          Prochaine session : {{ availability.nextSession }}
        </span>
        <Badge
          v-if="availability.seats"
          :variant="availability.seats === 'limited' ? 'warning' : 'success'"
        >
          {{ availability.seats === 'limited' ? 'Dernières places' : 'Places disponibles' }}
        </Badge>
      </div>
    </div>

    <!-- Actions : CTA prioritaire selon qualification (§25). -->
    <div
      v-if="principal"
      class="mt-md flex flex-col gap-sm sm:flex-row sm:flex-wrap sm:items-center"
    >
      <template v-if="availability">
        <Button as-child variant="accent" size="pill-sm" class="w-full sm:w-auto">
          <NuxtLink :to="availability.sessionsTo">Voir les sessions</NuxtLink>
        </Button>
        <Button as-child variant="outline" size="pill-sm" class="w-full sm:w-auto">
          <NuxtLink :to="availability.requestTo">Demander cette formation</NuxtLink>
        </Button>
        <NuxtLink :to="recommendation.course.to" :class="linkClass">Voir la formation</NuxtLink>
      </template>
      <template v-else>
        <Button as-child variant="accent" size="pill-sm" class="w-full sm:w-auto">
          <NuxtLink :to="recommendation.course.to">Voir la formation</NuxtLink>
        </Button>
        <Button
          v-if="recommendation.sessionsTo"
          as-child
          variant="outline"
          size="pill-sm"
          class="w-full sm:w-auto"
        >
          <NuxtLink :to="recommendation.sessionsTo">Voir les sessions</NuxtLink>
        </Button>
        <NuxtLink :to="advisorTo" :class="linkClass">Être accompagné</NuxtLink>
      </template>
    </div>
    <NuxtLink v-else :to="recommendation.course.to" :class="cn('mt-sm inline-block', linkClass)">
      Voir la formation
    </NuxtLink>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/lib/utils'
import type { AssistantRecommendation } from '~/types/assistant'

const props = withDefaults(
  defineProps<{
    recommendation: AssistantRecommendation
    rank?: 'principal' | 'alternative'
    position: number
    total: number
    advisorTo?: string
  }>(),
  { rank: 'alternative', advisorTo: '/parler-a-votre-conseiller' }
)

const principal = computed(() => props.rank === 'principal')
const availability = computed(() =>
  principal.value ? props.recommendation.availability : undefined
)

const linkClass =
  'text-small font-bold text-primary underline underline-offset-4 transition-colors hover:text-accent-text sm:ml-sm'
</script>
