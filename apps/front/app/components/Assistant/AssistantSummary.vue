<template>
  <!-- É11 — l'IA agrège les réponses successives sans ressaisie (§29) :
       demande complète + formation retenue, prête pour les sessions. -->
  <div>
    <p class="text-small text-ink-body md:text-body">{{ summary.text }}</p>
    <div
      class="mt-sm flex flex-col gap-sm rounded-md border border-rule bg-paper p-md sm:flex-row sm:items-center sm:justify-between"
    >
      <div class="min-w-0">
        <p class="font-bold text-ink">
          <NuxtLink :to="summary.course.to" class="transition-colors hover:text-accent-text">
            {{ summary.course.title }}
          </NuxtLink>
        </p>
        <p class="mt-xs text-small text-ink-muted">{{ summary.meta }}</p>
      </div>
      <Button as-child variant="accent" size="pill-sm" class="w-full shrink-0 sm:w-auto">
        <NuxtLink :to="summary.sessionsTo">Voir les sessions</NuxtLink>
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AssistantSummary } from '~/types/assistant'

defineProps<{ summary: AssistantSummary }>()
</script>
