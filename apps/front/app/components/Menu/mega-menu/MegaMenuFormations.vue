<template>
  <div class="grid w-full grid-cols-3 gap-lg p-lg">
    <!-- FAMILLES -->
    <div>
      <h3 class="text-small font-semibold text-ink-muted">Familles</h3>
      <ul class="mt-sm space-y-1">
        <li v-for="famille in familles" :key="famille.slug">
          <button
            type="button"
            class="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-body transition-colors hover:bg-surface"
            :class="
              famille.slug === selectedFamille
                ? 'bg-surface font-semibold text-ink'
                : 'text-primary'
            "
            @mouseenter="selectedFamille = famille.slug"
            @focus="selectedFamille = famille.slug"
            @click="goToFamille(famille.slug)"
          >
            <span>{{ famille.label }}</span>
            <span class="text-small text-ink-muted">{{ famille.count }}</span>
          </button>
        </li>
      </ul>
      <NuxtLink
        to="/formations"
        class="mt-sm inline-block text-small font-semibold text-ink underline underline-offset-4"
        @click="$emit('close')"
      >
        Tout le catalogue →
      </NuxtLink>
    </div>

    <!-- DÉTAIL FAMILLE SÉLECTIONNÉE -->
    <div class="border-l border-rule pl-lg">
      <h3 class="text-small font-semibold text-ink-muted">
        {{ selectedFamilleLabel }}<template v-if="isCaces"> — par type d’engin</template>
      </h3>
      <ul v-if="isCaces" class="mt-sm space-y-1">
        <li v-for="engin in enginsCaces" :key="engin.slug">
          <NuxtLink
            :to="`/formations/caces-conduite-engins/${engin.slug}`"
            class="block rounded-md px-2 py-1.5 text-body text-primary transition-colors hover:bg-surface hover:text-ink"
            @click="$emit('close')"
          >
            <span class="font-medium">{{ engin.label }}</span>
            <span class="ml-1 text-small text-ink-muted"
              >{{ engin.refs }} → {{ engin.count }} formations</span
            >
          </NuxtLink>
        </li>
      </ul>
      <p v-else class="mt-sm px-2 text-body text-ink-muted">
        {{ selectedFamilleCount }} formations dans cette famille.
      </p>
      <NuxtLink
        :to="`/formations/${selectedFamille}`"
        class="mt-sm inline-block text-small font-semibold text-ink underline underline-offset-4"
        @click="$emit('close')"
      >
        Voir la famille →
      </NuxtLink>
      <p class="mt-1 text-small text-ink-muted">Informations pratiques exigées</p>
    </div>

    <!-- PLUS CONSULTÉS + CTA -->
    <div>
      <h3 class="text-small font-semibold text-ink-muted">Les plus consultés</h3>
      <ul class="mt-sm space-y-1">
        <li v-for="formation in formationsPlusConsultees" :key="formation.slug">
          <NuxtLink
            :to="`/formations/caces-conduite-engins/${formation.slug}`"
            class="flex items-center justify-between rounded-md px-2 py-1.5 text-body text-primary transition-colors hover:bg-surface hover:text-ink"
            @click="$emit('close')"
          >
            <span>{{ formation.label }}</span>
            <span class="text-accent">+</span>
          </NuxtLink>
        </li>
      </ul>

      <div class="mt-md rounded-lg bg-ink px-md py-md text-paper">
        <p class="text-body font-semibold">Vous ne savez pas quelle formation choisir ?</p>
        <NuxtLink
          to="/etre-guide"
          class="mt-sm inline-block rounded-full bg-accent px-lg py-2 text-small font-semibold text-ink hover:bg-accent-text"
          @click="$emit('close')"
        >
          Être guidé dans mon choix
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { familles, enginsCaces, formationsPlusConsultees } from '~/data/navigation'

defineEmits<{ close: [] }>()

// CACES & conduite d'engins mis en avant par défaut, comme sur la maquette
const selectedFamille = ref('caces-conduite-engins')

const selectedFamilleLabel = computed(() => {
  return familles.find((f) => f.slug === selectedFamille.value)?.label ?? ''
})
const selectedFamilleCount = computed(() => {
  return familles.find((f) => f.slug === selectedFamille.value)?.count ?? 0
})
// Seule la famille CACES a un découpage par type d'engin
const isCaces = computed(() => selectedFamille.value === 'caces-conduite-engins')

function goToFamille(slug: string) {
  selectedFamille.value = slug
}
</script>
