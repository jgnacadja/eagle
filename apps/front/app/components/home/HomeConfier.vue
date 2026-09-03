<template>
  <section id="confier" class="bg-primary-dark py-20 text-ink-inverse">
    <div class="mx-auto max-w-container px-6">
      <p class="text-sm font-bold tracking-wide text-accent">Confier mes formations</p>

      <div class="mt-3 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <h2 class="max-w-lg font-display text-2xl font-extrabold leading-snug md:text-3xl">
          Un interlocuteur unique orchestre votre plan de formation
        </h2>
        <p class="max-w-md text-sm text-ink-inverse-muted">
          Pensé pour les RH, responsables formation, QHSE et directions d'exploitation : vous gardez
          la maîtrise, nous portons l'exécution.
        </p>
      </div>

      <div class="mt-12 grid gap-6 md:grid-cols-3">
        <article
          v-for="card in cards"
          :key="card.title"
          class="overflow-hidden rounded-md bg-primary"
        >
          <div class="h-40 overflow-hidden bg-primary/60">
            <img
              :src="card.image"
              :alt="card.title"
              class="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
          <div class="p-5">
            <p class="text-xs font-bold tracking-wide text-accent">{{ card.tag }}</p>
            <h3 class="mt-1 font-sans font-semibold">{{ card.title }}</h3>
            <p class="mt-2 text-sm text-ink-inverse-muted">{{ card.body }}</p>
          </div>
        </article>
      </div>

      <div class="mt-10 flex flex-wrap gap-4">
        <NuxtLink
          to="/confier"
          class="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-ink hover:bg-accent-text transition"
        >
          Confier mes formations
        </NuxtLink>
        <NuxtLink
          to="/contact"
          class="rounded-full border border-outline-inverse px-6 py-3 text-sm font-semibold text-ink-inverse hover:bg-ink-inverse/10 transition"
        >
          Parler à un conseiller
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const cards = [
  {
    tag: 'Conseil',
    title: 'Qualifier le besoin réglementaire',
    body: "Diagnostic des obligations et des recyclages à échéance, même à partir d'une demande imprécise.",
    image: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800&h=400&fit=crop&q=80'
  },
  {
    tag: 'Externalisation',
    title: "Déléguer l'exécution du plan",
    body: 'Sessions programmées, convocations envoyées, attestations suivies, budget consolidé.',
    image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&h=400&fit=crop&q=80'
  },
  {
    tag: 'Multi-sites',
    title: 'Piloter la conformité partout',
    body: 'Reporting site par site, alertes avant expiration, un seul point de contact national.',
    image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&h=400&fit=crop&q=80'
  }
]
</script>
