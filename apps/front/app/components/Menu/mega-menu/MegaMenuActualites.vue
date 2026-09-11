<template>
  <div class="grid w-full grid-cols-3 gap-lg p-lg">
    <!-- RUBRIQUES -->
    <div>
      <h3 class="text-small font-semibold text-ink-muted">Rubriques</h3>
      <ul class="mt-sm space-y-1">
        <li v-for="rubrique in rubriquesActualites" :key="rubrique.slug">
          <NuxtLink
            to="/actualites"
            class="block rounded-md px-2 py-1.5 text-body text-primary transition-colors hover:text-accent-text"
            @click="$emit('close')"
          >
            {{ rubrique.label }}
          </NuxtLink>
        </li>
      </ul>
    </div>

    <!-- PAR RÉGION -->
    <div class="border-l border-rule pl-lg">
      <h3 class="text-small font-semibold text-ink-muted">Par région</h3>
      <ul class="mt-sm space-y-1">
        <li v-for="region in regionsAvecActus" :key="region.slug">
          <button
            type="button"
            class="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-body transition-colors hover:text-accent-text"
            :class="
              region.slug === selectedRegion ? 'bg-surface font-semibold text-ink' : 'text-primary'
            "
            @mouseenter="selectedRegion = region.slug"
            @focus="selectedRegion = region.slug"
            @click="selectedRegion = region.slug"
          >
            <span>{{ region.label }}</span>
          </button>
        </li>
        <li>
          <NuxtLink
            to="/centres"
            class="block rounded-md px-2 py-1.5 text-small font-semibold text-ink transition-colors hover:text-accent-text"
            @click="$emit('close')"
          >
            Toutes les régions →
          </NuxtLink>
        </li>
      </ul>
    </div>

    <!-- DERNIÈRES PUBLICATIONS DE LA RÉGION -->
    <div>
      <h3 class="text-small font-semibold text-ink-muted">
        {{ selectedRegionLabel }} — dernières publications
      </h3>
      <ul class="mt-sm space-y-sm">
        <li v-for="actu in actusAffichees" :key="actu.slug">
          <NuxtLink
            :to="`/actualites/${actu.slug}`"
            class="group block rounded-md px-2 py-1.5 transition-colors"
            @click="$emit('close')"
          >
            <span class="block text-small font-semibold text-ink-muted"
              >{{ actu.tag }} · {{ actu.date }}</span
            >
            <span class="text-body text-ink transition-colors group-hover:text-accent-text">{{
              actu.title
            }}</span>
          </NuxtLink>
        </li>
        <li v-if="!actusAffichees.length" class="px-2 py-1.5 text-small text-ink-muted">
          Aucune publication récente pour cette région.
        </li>
        <li>
          <NuxtLink
            to="/actualites"
            class="block rounded-md px-2 py-1.5 text-small font-semibold text-ink transition-colors hover:text-accent-text"
            @click="$emit('close')"
          >
            Toutes les actualités {{ selectedRegionLabel }} →
          </NuxtLink>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { regions, rubriquesActualites, actualitesParRegion } from '~/data/navigation'

defineEmits<{ close: [] }>()

// Seules les régions avec de l'actualité publiée apparaissent ici
const regionsAvecActus = computed(() => regions.filter((r) => actualitesParRegion[r.slug]?.length))

// Défaut : première région qui a réellement des actus
const selectedRegion = ref(regionsAvecActus.value[0]?.slug ?? '')
const selectedRegionLabel = computed(
  () => regions.find((r) => r.slug === selectedRegion.value)?.label ?? ''
)
const actusAffichees = computed(() => actualitesParRegion[selectedRegion.value] ?? [])
</script>
