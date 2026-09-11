<template>
  <div class="grid w-full grid-cols-4 gap-lg p-lg">
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

    <!-- FORMATIONS DE LA FAMILLE SÉLECTIONNÉE -->
    <div class="col-span-2 border-l border-rule pl-lg">
      <h3 class="text-overline uppercase text-ink-muted">{{ selectedFamilleLabel }}</h3>
      <ul v-if="formationsFamille.length" class="mt-sm grid grid-cols-2 gap-sm">
        <li v-for="formation in formationsFamille" :key="formation.slug">
          <MegaMenuCard
            :to="formation.to"
            :title="formation.label"
            :meta="formation.meta"
            @select="$emit('close')"
          />
        </li>
      </ul>
      <NuxtLink
        v-if="selectedFamille"
        :to="`/formations/${selectedFamille}`"
        class="mt-sm inline-block text-small font-semibold text-ink underline underline-offset-4"
        @click="$emit('close')"
      >
        Voir la famille →
      </NuxtLink>
    </div>

    <!-- À LA UNE + CTA -->
    <div>
      <h3 class="text-small font-semibold text-ink-muted">À la une</h3>
      <ul class="mt-sm space-y-1">
        <li v-for="formation in formationsALaUne" :key="formation.slug">
          <NuxtLink
            :to="formation.to"
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
import { computed, ref, watch } from 'vue'
import {
  useMenuFamilles,
  useMenuFormationsALaUne,
  useMenuFormationsParFamille
} from '~/composables/useMenuData'
import MegaMenuCard from '~/components/Menu/mega-menu/MegaMenuCard.vue'

defineEmits<{ close: [] }>()

const familles = useMenuFamilles()
const formationsParFamille = useMenuFormationsParFamille()
const formationsALaUne = useMenuFormationsALaUne()

const selectedFamille = ref(familles.value?.[0]?.slug ?? '')

// Si les familles arrivent après le premier rendu (dégradation), pré-sélectionner la première.
watch(
  familles,
  (list) => {
    if (!selectedFamille.value && list?.length) {
      selectedFamille.value = list[0]!.slug
    }
  },
  { immediate: true }
)

const selectedFamilleLabel = computed(() => {
  return familles.value?.find((f) => f.slug === selectedFamille.value)?.label ?? ''
})
const formationsFamille = computed(() => {
  return formationsParFamille.value[selectedFamille.value] ?? []
})

function goToFamille(slug: string) {
  selectedFamille.value = slug
}
</script>
