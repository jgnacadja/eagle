<template>
  <section class="border-b border-rule">
    <div class="mx-auto grid max-w-container grid-cols-2 gap-8 px-6 py-14 md:grid-cols-4">
      <div v-for="stat in items" :key="stat.label">
        <!-- eslint-disable-next-line vue/no-v-html -- sanitizé via sanitizeHtml() -->
        <p
          class="font-display text-3xl font-extrabold text-ink md:text-4xl"
          v-html="safeHtml(stat.value)"
        />
        <p class="mt-1 text-sm text-ink-muted">{{ stat.label }}</p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { sanitizeHtml } from '~/utils/sanitizeHtml'
import type { Stat } from '@learnup/types'

defineProps<{
  items: Stat[]
}>()

function safeHtml(html: string): string {
  return sanitizeHtml(html)
}
</script>
