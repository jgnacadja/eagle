<template>
  <!-- É7 — aucun résultat suffisamment pertinent (§17) : aucune
       recommandation approximative (§16), quatre portes de sortie, la
       demande personnalisée en action principale. -->
  <div>
    <p class="font-semibold text-ink md:text-body">
      Nous n'avons pas identifié de formation correspondant exactement à votre besoin.
    </p>
    <div class="mt-md grid gap-sm sm:grid-cols-2">
      <Button
        as-child
        variant="accent"
        size="control"
        class="order-first justify-start gap-sm sm:order-none sm:col-start-2 sm:row-start-2"
      >
        <NuxtLink :to="requestTo">
          <IconPlus :size="16" class="shrink-0" />
          Faire une demande personnalisée
        </NuxtLink>
      </Button>
      <Button
        type="button"
        variant="outline"
        size="control"
        class="justify-start gap-sm"
        @click="emit('reformulate')"
      >
        <IconRefresh :size="16" class="shrink-0" />
        Reformuler mon besoin
      </Button>
      <Button as-child variant="outline" size="control" class="justify-start gap-sm">
        <NuxtLink :to="catalogueTo">
          <IconBook :size="16" class="shrink-0" />
          Consulter le catalogue
        </NuxtLink>
      </Button>
      <Button as-child variant="outline" size="control" class="justify-start gap-sm">
        <NuxtLink :to="advisorTo">
          <IconMessageCircle :size="16" class="shrink-0" />
          Parler à un conseiller
        </NuxtLink>
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    requestTo?: string
    catalogueTo?: string
    advisorTo?: string
  }>(),
  {
    requestTo: '/centres/demande-de-formation',
    catalogueTo: '/formations',
    advisorTo: '/parler-a-votre-conseiller'
  }
)

const emit = defineEmits<{ reformulate: [] }>()
</script>
