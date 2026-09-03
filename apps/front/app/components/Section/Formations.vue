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
        <a
          href="#"
          class="hidden whitespace-nowrap text-sm font-semibold text-ink hover:text-accent-text sm:block"
        >
          Voir tout le catalogue →
        </a>
      </div>

      <div class="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <article
          v-for="item in items"
          :key="item.title"
          class="overflow-hidden rounded-md border border-rule bg-paper"
        >
          <div
            class="flex h-36 items-center justify-center bg-surface-alt text-center text-xs text-ink-subtle px-4"
          >
            <!-- eslint-disable-next-line vue/no-v-html -- contenu local statique, sanitizé -->
            <span v-html="sanitizeHtml(item.placeholder)" />
          </div>
          <div class="p-4">
            <h3 class="font-sans font-semibold text-ink">{{ item.title }}</h3>
            <a href="#" class="mt-1 inline-block text-sm text-accent-text hover:text-accent"
              >Voir le détail →</a
            >
          </div>
        </article>
      </div>

      <a
        href="#"
        class="mt-8 inline-block text-sm font-semibold text-ink hover:text-accent-text sm:hidden"
      >
        Voir tout le catalogue →
      </a>
    </div>
  </section>
</template>

<script setup lang="ts">
import { sanitizeHtml } from '~/utils/sanitizeHtml'

const items = [
  { title: "CACES & conduite d'engins", placeholder: 'Photo à fournir<br>cariste en manœuvre' },
  {
    title: 'Habilitations électriques',
    placeholder: 'Photo à fournir<br>intervention armoire électrique'
  },
  { title: 'Santé, secours & incendie', placeholder: 'Photo à fournir<br>exercice SST / incendie' },
  { title: 'Travaux en hauteur', placeholder: 'Photo à fournir<br>harnais & travaux en hauteur' }
]
</script>
