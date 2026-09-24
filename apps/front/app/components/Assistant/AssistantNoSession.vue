<template>
  <!-- É6 — formation pertinente, aucune session programmée (§21) : aucun
       calendrier fictif (RG-IA-02), la demande devient l'action principale. -->
  <div>
    <article
      class="rounded-md border border-rule bg-paper p-md md:p-lg"
      aria-label="Formation recommandée sans session programmée"
    >
      <h3 class="font-sans text-h4 font-bold text-ink">
        <NuxtLink :to="noSession.course.to" class="transition-colors hover:text-accent-text">
          {{ noSession.course.title }}
        </NuxtLink>
      </h3>
      <p class="mt-xs text-small text-ink-body md:text-body">
        Cette formation correspond à votre besoin, mais aucune session n'est actuellement
        programmée.
      </p>
      <div class="mt-md flex flex-col gap-sm sm:flex-row">
        <Button as-child variant="accent" size="pill-sm" class="w-full sm:w-auto">
          <NuxtLink :to="noSession.requestTo">Demander une session</NuxtLink>
        </Button>
        <Button as-child variant="outline" size="pill-sm" class="w-full sm:w-auto">
          <NuxtLink :to="advisorTo">Être accompagné</NuxtLink>
        </Button>
      </div>
    </article>
    <p class="mt-sm text-meta text-ink-muted">
      La page formation reste consultable : programme, objectifs, modalités.
      <NuxtLink
        :to="noSession.course.to"
        class="font-bold text-primary underline underline-offset-4 transition-colors hover:text-accent-text"
      >
        Voir la formation
      </NuxtLink>
    </p>
  </div>
</template>

<script setup lang="ts">
import type { AssistantNoSession } from '~/types/assistant'

withDefaults(
  defineProps<{
    noSession: AssistantNoSession
    advisorTo?: string
  }>(),
  { advisorTo: '/parler-a-votre-conseiller' }
)
</script>
