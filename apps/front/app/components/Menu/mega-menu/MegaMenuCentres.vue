<template>
  <div class="grid w-full grid-cols-3 gap-lg p-lg">
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
            @mouseenter="selectedRegion = region.slug"
            @focus="selectedRegion = region.slug"
            @click="goToRegion(region.slug)"
          >
            <span>{{ region.label }}</span>
            <span class="text-small text-ink-muted">{{ region.count }}</span>
          </button>
        </li>
      </ul>
      <NuxtLink
        to="/centres"
        class="mt-sm inline-block text-small font-semibold text-ink underline underline-offset-4"
        @click="$emit('close')"
      >
        Toutes les régions →
      </NuxtLink>
    </div>

    <!-- CENTRES DE LA RÉGION SÉLECTIONNÉE -->
    <div class="border-l border-rule pl-lg">
      <h3 class="text-small font-semibold text-ink-muted">
        {{ selectedRegionLabel }} — {{ selectedRegionCount }} centres
      </h3>
      <ul class="mt-sm space-y-2">
        <li v-for="centre in centresAffiches" :key="centre.slug">
          <NuxtLink
            :to="`/centres/${centre.slug}`"
            class="block rounded-md px-2 py-1.5 text-body text-primary transition-colors hover:bg-surface hover:text-ink"
            @click="$emit('close')"
          >
            <span class="font-medium">{{ centre.name }}</span>
            <span class="block text-small text-ink-muted"
              >{{ centre.departement }} · {{ centre.specialites }}</span
            >
          </NuxtLink>
        </li>
      </ul>
      <NuxtLink
        to="/centres"
        class="mt-sm inline-block text-small font-semibold text-ink underline underline-offset-4"
        @click="$emit('close')"
      >
        Tous les centres {{ selectedRegionLabel }} →
      </NuxtLink>
      <p class="mt-1 text-small text-ink-muted">Ouverture(s) prévue(s) 2026</p>
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
        <Button type="button" variant="outline" class="rounded-full" @click="useGeolocation">
          Autour de moi
        </Button>
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
import { computed, ref } from 'vue'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { regions, centresParRegion } from '~/data/navigation'

const emit = defineEmits<{ close: [] }>()

const selectedRegion = ref('ile-de-france')
const searchQuery = ref('')

const selectedRegionLabel = computed(
  () => regions.find((r) => r.slug === selectedRegion.value)?.label ?? ''
)
const selectedRegionCount = computed(
  () => regions.find((r) => r.slug === selectedRegion.value)?.count ?? 0
)
const centresAffiches = computed(() => (centresParRegion[selectedRegion.value] ?? []).slice(0, 4))

function goToRegion(slug: string) {
  selectedRegion.value = slug
}

function onSearchSubmit() {
  if (!searchQuery.value.trim()) return
  // Pas de page recherche dédiée pour l'instant : on renvoie vers l'annuaire.
  navigateTo('/centres')
  emit('close')
}

function useGeolocation() {
  navigateTo('/centres')
  emit('close')
}
</script>
