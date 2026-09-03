<template>
  <section id="centres" class="mx-auto max-w-container px-6 py-20">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 class="font-display text-2xl font-extrabold text-ink md:text-3xl">
          Le réseau Learn Up Academy
        </h2>
        <p class="mt-2 font-sans text-ink-muted">
          <strong class="text-ink">+400 centres partenaires</strong> dans
          <strong class="text-ink">96 départements</strong>
          — en centre, sur votre site ou en intra-entreprise.
        </p>
      </div>
      <NuxtLink
        to="/centres"
        class="whitespace-nowrap text-sm font-semibold text-ink hover:text-accent-text"
      >
        Explorer la carte des centres →
      </NuxtLink>
    </div>

    <div class="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
      <div
        class="flex h-96 items-center justify-center rounded-md border border-rule bg-surface-alt text-center text-sm text-ink-muted px-6"
      >
        Carte de France interactive<br />départements + pins centres — lisible, pas un outil SIG
      </div>

      <div class="flex flex-col gap-4">
        <label class="relative block">
          <span class="sr-only">Rechercher une ville, code postal ou département</span>
          <input
            v-model="centerQuery"
            type="text"
            placeholder="Ville, code postal ou département"
            class="w-full rounded-full border border-rule bg-paper px-5 py-3 font-sans text-sm text-ink placeholder:text-ink-placeholder focus:outline-none focus:ring-2 focus:ring-outline"
          />
        </label>

        <article
          v-for="centre in displayedCentres"
          :key="centre.id"
          class="rounded-md border border-rule bg-paper p-5 shadow-sm"
        >
          <div class="flex items-start justify-between gap-3">
            <h3 class="font-sans font-semibold text-ink">{{ centre.name }}</h3>
            <span v-if="centre.city" class="shrink-0 text-xs text-ink-subtle">{{
              centre.city
            }}</span>
          </div>
          <p class="mt-1 text-sm text-ink-muted">{{ centreSummary(centre) }}</p>
          <div v-if="centre.departments_covered?.length" class="mt-3 flex flex-wrap gap-2">
            <span
              class="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-3 py-1 text-xs font-medium text-success"
            >
              <span class="h-1.5 w-1.5 rounded-full bg-success" /> Sessions accessibles
            </span>
            <span class="rounded-full bg-surface-alt px-3 py-1 text-xs font-medium text-ink-muted">
              {{ centre.departments_covered.slice(0, 3).join(', ') }}
            </span>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Centre } from '@learnup/types'

const props = defineProps<{
  centres: Centre[]
}>()

const centerQuery = ref('')

const displayedCentres = computed(() => props.centres.slice(0, 2))

function centreSummary(centre: Centre): string {
  const parts: string[] = []
  if (centre.address) parts.push(centre.address)
  if (centre.phone) parts.push(centre.phone)
  return parts.length ? parts.join(' · ') : 'Coordonnées sur demande'
}
</script>
