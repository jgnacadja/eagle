<template>
  <section class="border-b border-rule">
    <div class="mx-auto grid max-w-container grid-cols-2 gap-8 px-6 py-14 md:grid-cols-4">
      <div v-for="stat in items" :key="stat.label">
        <!-- eslint-disable-next-line vue/no-v-html -- contenu local statique, sanitizé -->
        <p
          class="font-display text-3xl font-extrabold text-ink md:text-4xl"
          v-html="sanitizeHtml(stat.value)"
        />
        <p class="mt-1 text-sm text-ink-muted">{{ stat.label }}</p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { sanitizeHtml } from '~/utils/sanitizeHtml'

const items = [
  { value: '+250', label: 'formations référencées' },
  { value: '+400', label: 'centres partenaires' },
  { value: '+10 000', label: 'apprenants par an' },
  { value: '4,7<span class="text-base align-top">/5</span>', label: 'satisfaction stagiaires' }
]
</script>
