<template>
  <section class="mx-auto max-w-container px-6 py-20">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <h2 class="font-display text-2xl font-extrabold text-ink md:text-3xl">
        Ce qu'en disent les entreprises
        <span class="ml-2 text-sm font-medium text-ink-subtle">4,7/5 · 312 avis Google</span>
      </h2>
      <NuxtLink to="/avis" class="text-sm font-semibold text-ink hover:text-accent-text"
        >Voir tous les avis →</NuxtLink
      >
    </div>

    <div class="mt-10 grid gap-6 md:grid-cols-3">
      <figure v-for="t in testimonials" :key="t.author" class="rounded-md bg-surface p-6">
        <div class="text-accent" aria-hidden="true">{{ t.stars }}</div>
        <blockquote class="mt-4 text-sm text-ink-muted">{{ t.quote }}</blockquote>
        <figcaption class="mt-4 text-xs text-ink-subtle">{{ t.author }}</figcaption>
      </figure>
    </div>
  </section>
</template>

<script setup lang="ts">
const testimonials = [
  {
    stars: '★★★★★',
    quote:
      '« Douze habilitations à renouveler sur trois sites, une seule interlocutrice, tout était planifié en une semaine. »',
    author: 'Responsable QHSE — logistique, 240 salariés'
  },
  {
    stars: '★★★★★',
    quote: '« Je ne savais pas quel CACES demander. La description libre a suffi. »',
    author: "Directeur d'agence — intérim"
  },
  {
    stars: '★★★★☆',
    quote: '« Plan déployé sur nos quatre dépôts sans une seule relance de notre part. »',
    author: 'Responsable formation — BTP'
  }
]
</script>
