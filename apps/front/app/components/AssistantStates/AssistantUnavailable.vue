<template>
  <!-- É9 — moteur indisponible (§38) : aucun code technique exposé, le
       parcours catalogue reste toujours disponible (§2). -->
  <section
    class="mx-auto flex w-full max-w-prose flex-col items-center px-gutter-mobile py-3xl text-center md:px-gutter md:py-4xl"
    :aria-labelledby="titleId"
    role="alert"
  >
    <span
      class="flex h-4xl w-4xl items-center justify-center rounded-full bg-warning-soft text-warning"
      aria-hidden="true"
    >
      <IconAlertTriangle :size="28" />
    </span>
    <h2 :id="titleId" class="mt-lg font-display text-h3 font-extrabold text-ink md:text-h2">
      La recherche assistée est momentanément indisponible.
    </h2>
    <p class="mt-sm text-small text-ink-body md:text-body">
      Vous pouvez réessayer dans quelques instants. Le catalogue reste accessible pour rechercher
      une formation.
    </p>
    <div class="mt-lg flex w-full flex-col gap-sm sm:w-auto sm:flex-row">
      <Button type="button" size="pill" class="w-full gap-sm sm:w-auto" @click="emit('retry')">
        <IconRefresh :size="16" class="shrink-0" />
        Réessayer
      </Button>
      <Button as-child variant="outline" size="pill" class="w-full sm:w-auto">
        <NuxtLink :to="advisorTo">Parler à un conseiller</NuxtLink>
      </Button>
    </div>
    <NuxtLink
      :to="catalogueTo"
      class="mt-md text-small font-bold text-primary underline underline-offset-4 transition-colors hover:text-accent-text"
    >
      Voir le catalogue
    </NuxtLink>
  </section>
</template>

<script setup lang="ts">
import { useId } from 'vue'

withDefaults(
  defineProps<{
    advisorTo?: string
    catalogueTo?: string
  }>(),
  { advisorTo: '/parler-a-votre-conseiller', catalogueTo: '/formations' }
)

const emit = defineEmits<{ retry: [] }>()

const titleId = `assistant-unavailable-${useId()}`
</script>
