<template>
  <div class="grid w-full grid-cols-4 gap-lg p-lg">
    <!-- RÉGIONS -->
    <div>
      <h3 class="text-small font-semibold text-ink-muted">Régions</h3>
      <ul class="mt-sm space-y-1">
        <li v-for="region in regions" :key="region.slug">
          <button
            type="button"
            class="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-body transition-colors hover:bg-surface"
            :class="
              region.slug === selectedRegion ? 'bg-surface font-semibold text-ink' : 'text-primary'
            "
            @focus="selectedRegion = region.slug"
            @click="goToRegion(region.slug)"
          >
            <span>{{ region.label }}</span>
            <span class="text-small text-ink-muted">{{ region.count }}</span>
          </button>
        </li>
        <li>
          <NuxtLink
            to="/centres"
            class="block rounded-md px-2 py-1.5 text-small font-semibold text-ink underline underline-offset-4 transition-colors hover:bg-surface"
            @click="$emit('close')"
          >
            Toutes les régions →
          </NuxtLink>
        </li>
      </ul>
    </div>

    <!-- CENTRES DE LA RÉGION SÉLECTIONNÉE -->
    <div class="col-span-2 border-l border-rule pl-lg">
      <h3 class="text-overline uppercase text-ink-muted">
        {{ selectedRegionLabel }} — {{ selectedRegionCount }} centre{{
          selectedRegionCount > 1 ? 's' : ''
        }}
      </h3>
      <ul class="mt-sm grid grid-cols-2 gap-sm">
        <li v-for="centre in centresAffiches" :key="centre.slug">
          <MegaMenuCard
            :to="`/centres/${centre.slug}`"
            :title="centre.name"
            :meta="centre.department ?? centre.city"
            @select="$emit('close')"
          />
        </li>
        <li class="col-span-2">
          <NuxtLink
            to="/centres"
            class="block rounded-md px-2 py-1.5 text-small font-semibold text-ink underline underline-offset-4 transition-colors hover:bg-surface"
            @click="$emit('close')"
          >
            Tous les centres {{ selectedRegionLabel }} →
          </NuxtLink>
        </li>
      </ul>
    </div>

    <!-- TROUVER UN CENTRE + CTA -->
    <div>
      <h3 class="text-small font-semibold text-ink-muted">Trouver un centre</h3>
      <form class="mt-sm flex flex-col gap-sm" @submit.prevent="onSearchSubmit">
        <Label for="mega-menu-centre-search" class="sr-only">Ville ou code postal</Label>
        <Input
          id="mega-menu-centre-search"
          v-model="searchQuery"
          type="text"
          placeholder="Ville ou code postal"
        />
      </form>

      <div class="mt-md rounded-lg bg-ink px-md py-md text-paper">
        <p class="text-body font-semibold">Besoin d’une formation sur votre site ?</p>
        <NuxtLink
          to="/formation-intra"
          class="mt-sm inline-block rounded-full bg-paper px-lg py-2 text-small font-semibold text-ink hover:bg-surface"
          @click="$emit('close')"
        >
          Organiser une formation intra
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { useMenuCentres } from '~/composables/useMenuData'
import MegaMenuCard from '~/components/Menu/mega-menu/MegaMenuCard.vue'

const emit = defineEmits<{ close: [] }>()

const { regions, centresParRegion } = useMenuCentres()

const selectedRegion = ref(regions.value?.[0]?.slug ?? '')
const searchQuery = ref('')

watch(
  regions,
  (list) => {
    if (!selectedRegion.value && list?.length) {
      selectedRegion.value = list[0]!.slug
    }
  },
  { immediate: true }
)

const selectedRegionLabel = computed(
  () => regions.value?.find((r) => r.slug === selectedRegion.value)?.label ?? ''
)
const selectedRegionCount = computed(
  () => regions.value?.find((r) => r.slug === selectedRegion.value)?.count ?? 0
)
const centresAffiches = computed(() => {
  const region = regions.value?.find((r) => r.slug === selectedRegion.value)
  return (region ? (centresParRegion.value.get(region.label) ?? []) : []).slice(0, 4)
})

function goToRegion(slug: string) {
  selectedRegion.value = slug
}

function onSearchSubmit() {
  const q = searchQuery.value.trim()
  if (!q) return
  // Pas de page recherche dédiée : on renvoie vers l'annuaire avec la query.
  navigateTo({ path: '/centres', query: { q } })
  emit('close')
}
</script>
