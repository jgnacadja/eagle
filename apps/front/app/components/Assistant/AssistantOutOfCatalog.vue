<template>
  <!-- É8 — besoin hors catalogue, signalé sans approximation (§18). Le
       contexte saisi est transmis au conseiller avec la demande (§26-27). -->
  <div>
    <p class="text-small text-ink-body md:text-body">{{ outOfCatalog.message }}</p>
    <div class="mt-md flex flex-col gap-sm sm:flex-row">
      <Button as-child variant="accent" size="pill-sm" class="w-full sm:w-auto">
        <NuxtLink :to="advisorTo">Décrire mon besoin à un conseiller</NuxtLink>
      </Button>
      <Button as-child variant="outline" size="pill-sm" class="w-full sm:w-auto">
        <NuxtLink :to="catalogueTo">Voir le catalogue</NuxtLink>
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AssistantOutOfCatalog } from '~/types/assistant'

withDefaults(
  defineProps<{
    outOfCatalog: AssistantOutOfCatalog
    advisorTo?: string
    catalogueTo?: string
  }>(),
  { advisorTo: '/parler-a-votre-conseiller', catalogueTo: '/formations' }
)
</script>
