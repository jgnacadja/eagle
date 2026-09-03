<template>
  <section id="actualites" class="bg-surface py-20">
    <div class="mx-auto max-w-container px-6">
      <div class="flex items-end justify-between">
        <h2 class="font-display text-2xl font-extrabold text-ink md:text-3xl">Actualités</h2>
        <a href="#" class="whitespace-nowrap text-sm font-semibold text-ink hover:text-accent-text"
          >Tout le blog →</a
        >
      </div>

      <div class="mt-10 grid gap-6 md:grid-cols-3">
        <article
          v-for="article in articles"
          :key="article.title"
          class="overflow-hidden rounded-md border border-rule bg-paper"
        >
          <div
            class="flex h-40 items-center justify-center bg-surface-alt text-center text-xs text-ink-subtle"
          >
            Visuel article à fournir
          </div>
          <div class="p-5">
            <p class="text-xs font-bold tracking-wide text-accent-text">{{ article.category }}</p>
            <h3 class="mt-1 font-sans font-semibold text-ink">{{ article.title }}</h3>
            <p class="mt-3 text-xs text-ink-subtle">{{ article.date }}</p>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const articles = [
  {
    category: 'Réglementation',
    title: 'Recyclage CACES : les échéances 2026 à anticiper',
    date: '28 août 2026 · 4 min'
  },
  {
    category: 'Conformité',
    title: 'Habilitations électriques : quelles obligations pour vos sous-traitants ?',
    date: '21 août 2026 · 6 min'
  },
  {
    category: 'Financement',
    title: 'OPCO : optimiser la prise en charge de votre plan de formation',
    date: '12 août 2026 · 5 min'
  }
]
</script>
