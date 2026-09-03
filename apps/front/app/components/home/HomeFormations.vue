<template>
  <section id="formations" class="bg-surface py-20">
    <div class="mx-auto max-w-container px-6">
      <div class="flex items-end justify-between">
        <div>
          <h2 class="font-display text-2xl font-extrabold text-ink md:text-3xl">Nos formations</h2>
          <p class="mt-2 font-sans text-ink-muted">
            Nous vous accompagnons grâce à un catalogue varié.
          </p>
        </div>
        <NuxtLink
          to="/formations"
          class="hidden whitespace-nowrap text-sm font-semibold text-ink hover:text-accent-text sm:block"
        >
          Voir tout le catalogue →
        </NuxtLink>
      </div>

      <div v-if="familles?.length" class="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <article
          v-for="famille in displayedFamilles"
          :key="famille.id"
          class="overflow-hidden rounded-md border border-rule bg-paper"
        >
          <div class="h-36 overflow-hidden bg-surface-alt">
            <img
              v-if="famille.icon"
              :src="assetUrl(famille.icon) ?? undefined"
              :alt="famille.name"
              class="h-full w-full object-cover"
              loading="lazy"
            />
            <div
              v-else
              class="flex h-full w-full items-center justify-center bg-surface-alt text-center text-xs text-ink-subtle px-4"
            >
              {{ famille.name }}
            </div>
          </div>
          <div class="p-4">
            <h3 class="font-sans font-semibold text-ink">{{ famille.name }}</h3>
            <NuxtLink
              :to="`/formations/${famille.slug}`"
              class="mt-1 inline-block text-sm text-accent-text hover:text-accent"
            >
              Voir le détail →
            </NuxtLink>
          </div>
        </article>
      </div>

      <NuxtLink
        to="/formations"
        class="mt-8 inline-block text-sm font-semibold text-ink hover:text-accent-text sm:hidden"
      >
        Voir tout le catalogue →
      </NuxtLink>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDirectusAsset } from '~/composables/useDirectusAsset'
import type { FamilleFormation } from '@learnup/types'

const props = defineProps<{
  familles: FamilleFormation[]
}>()

const displayedFamilles = computed(() => props.familles.slice(0, 4))

function assetUrl(fileId: string | null): string | null {
  return useDirectusAsset(fileId)
}
</script>
