<template>
  <article class="mx-auto max-w-prose px-6 py-16">
    <h1 class="font-display text-2xl font-bold text-ink">{{ centre.name }}</h1>
    <p v-if="centre.address || centre.city" class="mt-2 font-sans text-ink-muted">
      {{ [centre.address, centre.postal_code, centre.city].filter(Boolean).join(', ') }}
    </p>

    <dl class="mt-8 grid gap-4 sm:grid-cols-2">
      <div v-if="centre.phone">
        <dt class="font-sans text-sm text-ink-muted">Téléphone</dt>
        <dd class="font-sans text-ink">{{ centre.phone }}</dd>
      </div>
      <div v-if="centre.email">
        <dt class="font-sans text-sm text-ink-muted">Email</dt>
        <dd class="font-sans text-ink">{{ centre.email }}</dd>
      </div>
      <div v-if="centre.contact_name">
        <dt class="font-sans text-sm text-ink-muted">Interlocuteur</dt>
        <dd class="font-sans text-ink">
          {{ centre.contact_name
          }}<span v-if="centre.contact_role"> — {{ centre.contact_role }}</span>
        </dd>
      </div>
      <div v-if="centre.qualiopi_certified">
        <dt class="font-sans text-sm text-ink-muted">Certification</dt>
        <dd class="font-sans text-ink">Qualiopi</dd>
      </div>
    </dl>
  </article>
</template>

<script setup lang="ts">
import type { Centre } from '@learnup/types'

const route = useRoute()
const slug = route.params.slug as string

const centre = await useDirectusItemBySlug<Centre>('centres', slug, `centre-${slug}`)

useContentSeo(centre, centre.name)
</script>
