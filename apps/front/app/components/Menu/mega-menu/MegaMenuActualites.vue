<template>
  <div class="grid w-full grid-cols-4 gap-lg px-gutter-mobile py-lg md:px-gutter">
    <!-- RUBRIQUES -->
    <div class="border-r border-rule pr-lg">
      <h3 class="text-small font-semibold text-ink-muted uppercase">Rubriques</h3>
      <ul class="mt-sm space-y-1">
        <li v-for="rubrique in rubriques" :key="rubrique.slug">
          <button
            type="button"
            class="block w-full rounded-md px-2 py-1.5 text-left text-body text-primary transition-colors hover:text-accent-text"
            :class="
              rubrique.slug === selectedRubrique
                ? 'bg-surface font-semibold text-ink'
                : 'font-medium'
            "
            :aria-current="rubrique.slug === selectedRubrique ? 'true' : undefined"
            @click="selectRubrique(rubrique.slug)"
          >
            {{ rubrique.label }}
          </button>
        </li>
      </ul>
    </div>

    <!-- PAR RÉGION -->
    <div class="border-r border-rule pr-lg">
      <h3 class="text-small font-semibold text-ink-muted uppercase">Par région</h3>
      <ul class="mt-sm space-y-1">
        <li v-for="region in regions" :key="region.slug">
          <button
            type="button"
            class="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-body transition-colors hover:text-accent-text"
            :class="
              region.slug === selectedRegion
                ? 'bg-surface font-semibold text-ink'
                : 'font-medium text-primary'
            "
            :aria-current="region.slug === selectedRegion ? 'true' : undefined"
            @mouseenter="selectedRegion = region.slug"
            @focus="selectedRegion = region.slug"
            @click="selectedRegion = region.slug"
          >
            <span>{{ region.label }}</span>
            <span v-if="region.slug === selectedRegion" class="text-accent">›</span>
          </button>
        </li>
        <li>
          <NuxtLink
            to="/actualites"
            class="block rounded-md px-2 py-1.5 text-small font-semibold text-ink transition-colors hover:text-accent-text"
            @click="$emit('close')"
          >
            Toutes les régions <span class="link-arrow">→</span>
          </NuxtLink>
        </li>
      </ul>
    </div>

    <!-- DERNIÈRES PUBLICATIONS DE LA RÉGION -->
    <div class="col-span-2">
      <h3 class="text-small font-semibold text-ink-muted uppercase">
        {{ selectedRegionLabel }} — dernières publications
      </h3>
      <Transition name="menu-panel" mode="out-in">
        <ul :key="selectedRegion" class="mt-sm space-y-xs">
          <li v-for="actu in actusAffichees" :key="actu.slug">
            <NuxtLink
              :to="`/actualites/${actu.slug}`"
              class="group block rounded-md bg-surface px-md py-sm transition-colors hover:bg-surface-alt"
              @click="$emit('close')"
            >
              <p class="flex items-center gap-sm text-overline">
                <span class="font-bold uppercase text-accent-text">{{ actu.tag }}</span>
                <span class="font-medium text-ink-subtle">{{ actu.date }}</span>
              </p>
              <span
                class="text-small font-semibold text-ink transition-colors group-hover:text-accent-text"
                >{{ actu.title }}</span
              >
            </NuxtLink>
          </li>
          <li v-if="!actusAffichees.length" class="px-2 py-1.5 text-small text-ink-muted">
            {{ emptyMessage }}
          </li>
          <li>
            <NuxtLink
              to="/actualites"
              class="block rounded-md px-2 py-1.5 text-small font-semibold text-ink transition-colors hover:text-accent-text"
              @click="$emit('close')"
            >
              Toutes les actualités {{ selectedRegionLabel }} <span class="link-arrow">→</span>
            </NuxtLink>
          </li>
        </ul>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useMenuActualites } from '~/composables/useMenuData'

defineEmits<{ close: [] }>()

const { rubriques, regions, actualitesParRegion } = useMenuActualites()

const selectedRubrique = ref(rubriques.value[0]?.slug ?? '')
watch(rubriques, (list) => {
  if (!selectedRubrique.value && list.length) selectedRubrique.value = list[0]!.slug
})

// Défaut : première région qui a réellement des actus
const selectedRegion = ref(regions.value[0]?.slug ?? '')
watch(regions, (list) => {
  if (!selectedRegion.value && list.length) selectedRegion.value = list[0]!.slug
})
const selectedRegionLabel = computed(
  () => regions.value.find((r) => r.slug === selectedRegion.value)?.label ?? ''
)
const isTouteActualite = computed(() => selectedRubrique.value === rubriques.value[0]?.slug)
const actusAffichees = computed(() => {
  const actualites = actualitesParRegion.value[selectedRegion.value] ?? []
  if (isTouteActualite.value) return actualites.slice(0, 3)

  return actualites.filter((actu) => actu.categorySlug === selectedRubrique.value).slice(0, 3)
})
const emptyMessage = computed(() =>
  isTouteActualite.value
    ? 'Aucune publication récente pour cette région.'
    : 'Aucune publication récente pour cette rubrique dans cette région.'
)

function selectRubrique(slug: string) {
  selectedRubrique.value = slug
}
</script>
