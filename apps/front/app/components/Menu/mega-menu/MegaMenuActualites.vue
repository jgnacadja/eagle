<template>
  <div class="mega-menu-panel grid w-full grid-cols-4 gap-lg px-gutter-mobile py-lg md:px-gutter">
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
        <li v-for="region in displayedRegions" :key="region.slug">
          <button
            type="button"
            class="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-body transition-colors hover:text-accent-text"
            :class="
              region.slug === selectedRegion
                ? 'bg-surface font-semibold text-ink'
                : 'font-medium text-primary'
            "
            :aria-current="region.slug === selectedRegion ? 'true' : undefined"
            @focus="selectedRegion = region.slug"
            @click="selectedRegion = region.slug"
          >
            <span>{{ region.label }}</span>
            <span v-if="region.slug === selectedRegion" class="text-accent">›</span>
          </button>
        </li>

        <li
          v-if="!pending && !displayedRegions.length"
          class="px-2 py-1.5 text-small text-ink-muted"
        >
          Aucune région disponible.
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
        {{
          selectedRegionLabel
            ? `${selectedRegionLabel} — dernières publications`
            : 'Dernières publications'
        }}
      </h3>

      <Transition name="menu-panel" mode="out-in">
        <ul :key="`${selectedRubrique}-${selectedRegion}`" class="mt-sm grid gap-sm">
          <li v-for="actu in featuredNews" :key="actu.slug">
            <MegaMenuCard
              :to="`/actualites/${actu.slug}`"
              :title="actu.title"
              @select="$emit('close')"
            >
              <template #eyebrow>
                <span class="flex items-center gap-sm text-overline">
                  <span class="font-bold uppercase text-accent-text">
                    {{ actu.tag }}
                  </span>
                  <span class="font-medium text-ink-subtle">
                    {{ actu.date }}
                  </span>
                </span>
              </template>
            </MegaMenuCard>
          </li>
          <li v-if="!pending && !featuredNews.length" class="px-2 py-1.5 text-small text-ink-muted">
            {{ emptyMessage }}
          </li>
          <li>
            <NuxtLink
              to="/actualites"
              class="block rounded-md px-2 py-1.5 text-small font-semibold text-ink transition-colors hover:text-accent-text"
              @click="$emit('close')"
            >
              Toutes les actualités {{ selectedRegionLabel }}
              <span class="link-arrow">→</span>
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
import MegaMenuCard from '~/components/Menu/mega-menu/MegaMenuCard.vue'

defineEmits<{
  close: []
}>()

const { pending, rubriques, regions, actualitesParRegion } = useMenuActualites()

const selectedRubrique = ref(rubriques.value[0]?.slug ?? '')
watch(rubriques, (list) => {
  if (!selectedRubrique.value && list.length) {
    selectedRubrique.value = list[0]!.slug
  }
})
const allNews = computed(() => selectedRubrique.value === 'toute-actualite')
const displayedRegions = computed(() => {
  if (allNews.value) {
    return regions.value
  }

  return regions.value.filter((region) => {
    const actualites = actualitesParRegion.value[region.slug] ?? []

    return actualites.some((actu) => actu.categorySlug === selectedRubrique.value)
  })
})

const selectedRegion = ref(regions.value[0]?.slug ?? '')
watch(regions, (list) => {
  if (!selectedRegion.value && list.length) {
    selectedRegion.value = list[0]!.slug
  }
})

watch(
  displayedRegions,
  (list) => {
    const selectedRegionExists = list.some((region) => region.slug === selectedRegion.value)

    if (!selectedRegionExists) {
      selectedRegion.value = list[0]?.slug ?? ''
    }
  },
  {
    immediate: true
  }
)
const selectedRegionLabel = computed(
  () => displayedRegions.value.find((region) => region.slug === selectedRegion.value)?.label ?? ''
)
const featuredNews = computed(() => {
  const actualites = actualitesParRegion.value[selectedRegion.value] ?? []
  if (allNews.value) {
    return actualites.slice(0, 3)
  }

  return actualites.filter((actu) => actu.categorySlug === selectedRubrique.value).slice(0, 3)
})
const emptyMessage = computed(() => {
  if (allNews.value) return 'Aucune publication récente pour cette région.'

  return selectedRegion.value
    ? 'Aucune publication récente pour cette rubrique dans cette région.'
    : 'Aucune publication récente pour cette rubrique.'
})

function selectRubrique(slug: string) {
  selectedRubrique.value = slug
}
</script>
