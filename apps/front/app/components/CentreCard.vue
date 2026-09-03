<template>
  <article class="rounded-md border border-rule bg-paper p-md shadow-sm">
    <div class="flex items-start justify-between gap-sm">
      <h3 class="font-sans text-h4 font-semibold text-ink">{{ name }}</h3>
      <span class="shrink-0 text-meta text-ink-subtle">{{ distance }}</span>
    </div>
    <p class="mt-xs text-small text-ink-muted">{{ formations }}</p>
    <div class="mt-md flex flex-wrap gap-sm">
      <span
        v-for="tag in tags"
        :key="tag"
        class="inline-flex items-center gap-xs rounded-full px-md py-xs text-meta font-bold"
        :class="tagClasses(tag)"
      >
        <span
          v-if="!tag.startsWith('▲') && dotClass(tag)"
          class="h-2.5 w-2.5 rounded-full"
          :class="dotClass(tag)"
        />
        {{ tag }}
      </span>
    </div>
  </article>
</template>

<script setup lang="ts">
defineProps<{
  name: string
  distance: string
  formations: string
  tags: string[]
}>()

function tagClasses(tag: string): string {
  if (tag.startsWith('▲')) return 'bg-warning-soft text-warning'
  if (tag === 'Intra sur site') return 'bg-surface text-ink-muted'
  return 'bg-success-soft text-success'
}

function dotClass(tag: string): string {
  if (tag === 'Sessions cette semaine') return 'bg-success'
  return ''
}
</script>
