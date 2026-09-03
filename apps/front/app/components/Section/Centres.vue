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
      <a href="#" class="whitespace-nowrap text-sm font-semibold text-ink hover:text-accent-text">
        Explorer la carte des centres →
      </a>
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
            type="text"
            placeholder="Ville, code postal ou département"
            class="w-full rounded-full border border-rule bg-paper px-5 py-3 font-sans text-sm text-ink placeholder:text-ink-placeholder focus:outline-none focus:ring-2 focus:ring-outline"
          />
        </label>

        <article
          v-for="centre in centres"
          :key="centre.name"
          class="rounded-md border border-rule bg-paper p-5 shadow-sm"
        >
          <div class="flex items-start justify-between gap-3">
            <h3 class="font-sans font-semibold text-ink">{{ centre.name }}</h3>
            <span class="shrink-0 text-xs text-ink-subtle">{{ centre.distance }}</span>
          </div>
          <p class="mt-1 text-sm text-ink-muted">{{ centre.formations }}</p>
          <p class="mt-1 text-sm text-ink-subtle">{{ centre.departments }}</p>
          <div class="mt-3 flex flex-wrap gap-2">
            <span
              v-for="tag in centre.tags"
              :key="tag"
              class="rounded-full px-3 py-1 text-xs font-medium"
              :class="tagClasses(tag)"
            >
              {{ tag }}
            </span>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const centres = [
  {
    name: 'Centre de Créteil',
    distance: 'à 6 km',
    formations: 'CACES · Habilitations électriques · SST',
    departments: 'Départements : 94, 75, 77',
    tags: ['Sessions cette semaine', 'Intra sur site']
  },
  {
    name: 'Centre de Villeneuve-le-Roi',
    distance: 'à 14 km',
    formations: 'Travaux en hauteur · Échafaudages · PEMP',
    departments: 'Départements : 94, 78',
    tags: ['⚠ Prochaine session le 14/09']
  }
]

function tagClasses(tag: string): string {
  if (tag.startsWith('⚠')) return 'bg-warning-soft text-warning'
  if (tag === 'Intra sur site') return 'bg-surface-alt text-ink-muted'
  return 'bg-success-soft text-success'
}
</script>
