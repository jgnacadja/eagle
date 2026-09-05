<template>
  <article class="rounded-md border border-rule bg-paper p-md shadow-sm">
    <div class="flex items-start justify-between gap-sm">
      <h3 class="font-sans text-h4 font-semibold text-ink">{{ name }}</h3>
      <span class="shrink-0 text-meta text-ink-subtle">{{ distance }}</span>
    </div>
    <p class="mt-xs text-small text-ink-muted">{{ formations }}</p>
    <div v-if="tags.length" class="mt-md flex flex-wrap gap-sm">
      <Badge v-for="tag in tags" :key="tag" :variant="tagVariant(tag)">
        <span
          v-if="tag === 'Sessions cette semaine'"
          class="h-sm w-sm rounded-full bg-current"
          aria-hidden="true"
        />
        {{ tag }}
      </Badge>
    </div>
    <span class="mt-md block text-small font-bold text-primary">Voir le centre →</span>
  </article>
</template>

<script setup lang="ts">
defineProps<{
  name: string
  distance: string
  formations: string
  tags: string[]
}>()

function tagVariant(tag: string): 'success' | 'warning' | 'neutral' {
  if (tag.startsWith('▲')) return 'warning'
  if (tag === 'Intra sur site') return 'neutral'
  return 'success'
}
</script>
