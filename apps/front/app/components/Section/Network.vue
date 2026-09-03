<template>
  <section class="mx-auto max-w-container px-6 py-section">
    <h2 class="text-center font-display text-2xl font-extrabold text-ink md:text-3xl">
      Construisons ensemble le réseau Learn Up Academy
    </h2>
    <p class="mx-auto mt-3 max-w-2xl text-center font-sans text-ink-muted">
      Rejoignez un réseau national dédié aux formations réglementaires et participez à son
      développement partout en France.
    </p>

    <div class="mt-10 grid gap-6 text-left md:grid-cols-3">
      <article
        v-for="card in cards"
        :key="card.title"
        class="rounded-md border border-rule bg-paper p-6 shadow-sm"
      >
        <h3 class="font-display font-bold text-ink">{{ card.title }}</h3>
        <p class="mt-1 text-sm font-semibold text-accent-text">{{ card.subtitle }}</p>
        <p class="mt-3 text-sm text-ink-muted">{{ card.body }}</p>
        <NuxtLink
          :to="card.link"
          class="mt-4 inline-block text-sm font-semibold text-ink hover:text-accent-text"
        >
          {{ card.cta }}
        </NuxtLink>
      </article>
    </div>

    <p class="mt-8 text-center text-sm text-ink-muted">
      Vous êtes un particulier ? Certaines sessions sont ouvertes aux inscriptions individuelles —
      <NuxtLink to="/contact" class="font-semibold text-accent-text hover:text-accent"
        >contactez le centre le plus proche →</NuxtLink
      >
    </p>
  </section>
</template>

<script setup lang="ts">
const cards = [
  {
    title: 'Devenir franchisé',
    subtitle: 'Rejoignez un réseau en pleine croissance',
    body: "Ouvrez votre centre Learn Up Academy avec l'appui de la marque, des outils et du réseau national.",
    cta: 'Découvrir la franchise →',
    link: '/franchise'
  },
  {
    title: 'Organisme partenaire',
    subtitle: 'Référencez vos centres, développez votre activité',
    body: 'Rendez vos sessions visibles et recevez des demandes qualifiées de tout le territoire.',
    cta: 'Référencer mon organisme →',
    link: '/referencer'
  },
  {
    title: 'Formateur indépendant',
    subtitle: 'Intervenez sur les sessions du réseau',
    body: 'Missions en centre, sur site ou en intra, au plus près de chez vous.',
    cta: 'Devenir formateur partenaire →',
    link: '/formateur'
  }
]
</script>
