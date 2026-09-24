<template>
  <!-- Bandeau contexte (§26-29) : la mémoire de la conversation, visible
       et modifiable — « Nouvelle recherche » (coquille) la supprime. -->
  <div class="flex flex-wrap items-center gap-sm border-b border-rule py-sm">
    <span class="text-overline uppercase tracking-wider text-ink-muted">Contexte</span>
    <ul class="flex flex-wrap gap-xs" aria-label="Contexte de la recherche">
      <li v-for="chip in chips" :key="chip">
        <Badge variant="outline">{{ chip }}</Badge>
      </li>
    </ul>
    <Button
      type="button"
      variant="link"
      size="inline"
      class="ml-auto text-small font-semibold underline underline-offset-4"
      @click="emit('edit')"
    >
      Modifier mon besoin
    </Button>
  </div>
</template>

<script setup lang="ts">
defineProps<{ chips: string[] }>()

const emit = defineEmits<{ edit: [] }>()
</script>
