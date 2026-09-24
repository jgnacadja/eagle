<template>
  <div class="sticky top-0 z-30 border-b border-rule bg-paper/95 backdrop-blur">
    <div class="mx-auto flex items-center gap-sm px-gutter-mobile py-sm md:px-gutter">
      <!-- Sortie explicite, toujours visible : retour à la page précédente
           (chevron sur mobile, « Fermer » sur desktop). -->
      <Button
        type="button"
        variant="outline"
        size="pill-sm"
        class="shrink-0 gap-xs"
        :aria-label="closeLabel"
        @click="emit('close')"
      >
        <IconChevronLeft :size="18" class="md:hidden" />
        <IconClose :size="16" class="hidden md:block" />
        <span class="hidden md:inline">Fermer</span>
      </Button>

      <p class="flex min-w-0 items-center gap-xs text-small font-semibold text-ink md:text-body">
        <IconSparkle :size="16" class="shrink-0 text-accent" />
        <span class="truncate">Recherche assistée</span>
        <span
          class="hidden text-meta font-normal uppercase tracking-wider text-ink-muted sm:inline"
        >
          LEARN UP ACADEMY
        </span>
      </p>

      <!-- « Nouvelle recherche » réinitialise et reste dans le moteur —
           distinct de « Fermer » qui revient à la navigation normale. -->
      <Button
        type="button"
        variant="link"
        size="inline"
        class="ml-auto shrink-0 text-small font-semibold underline underline-offset-4"
        @click="emit('reset')"
      >
        Nouvelle recherche
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
const emit = defineEmits<{ close: []; reset: [] }>()

const closeLabel = 'Fermer la recherche assistée et revenir à la page précédente'
</script>
