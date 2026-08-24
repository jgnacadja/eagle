<template>
  <div class="mx-auto max-w-5xl px-6 py-16">
    <section class="mb-16 text-center">
      <h1 class="font-display text-3xl font-bold text-ink">LEARN UP ACADEMY</h1>
      <p class="mt-4 font-sans text-ink-muted">Gabarit d'accueil — en cours de construction.</p>
    </section>

    <section v-if="centres?.length" class="mb-16">
      <h2 class="mb-6 font-display text-xl font-bold text-ink">Nos centres</h2>
      <div class="grid gap-4 sm:grid-cols-3">
        <NuxtLink
          v-for="centre in centres"
          :key="centre.id"
          :to="`/centres/${centre.slug}`"
          class="rounded-md border border-rule bg-paper p-4 shadow-sm hover:shadow-md"
        >
          <p class="font-sans font-semibold text-ink">{{ centre.name }}</p>
          <p v-if="centre.city" class="mt-1 font-sans text-sm text-ink-muted">{{ centre.city }}</p>
        </NuxtLink>
      </div>
    </section>

    <section v-if="familles?.length">
      <h2 class="mb-6 font-display text-xl font-bold text-ink">Nos formations</h2>
      <div class="grid gap-4 sm:grid-cols-3">
        <NuxtLink
          v-for="famille in familles"
          :key="famille.id"
          :to="`/formations/${famille.slug}`"
          class="rounded-md border border-rule bg-paper p-4 shadow-sm hover:shadow-md"
        >
          <p class="font-sans font-semibold text-ink">{{ famille.name }}</p>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { readItems } from '@directus/sdk'
import type { Centre, FamilleFormation } from '@learnup/types'

const directus = useDirectusClient()

const { data: centres } = await useAsyncData('home-centres', () =>
  directus.request<Centre[]>(readItems('centres', { limit: 3 })).catch(() => [])
)

const { data: familles } = await useAsyncData('home-familles', () =>
  directus.request<FamilleFormation[]>(readItems('familles_formation', { limit: 6 })).catch(() => [])
)

useContentSeo({}, 'LEARN UP ACADEMY')
</script>
