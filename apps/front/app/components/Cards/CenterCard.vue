<template>
  <article
    class="rounded-md border border-rule bg-paper p-md shadow-sm transition-[border-color,box-shadow] hover:border-primary/40 hover:shadow-md"
  >
    <div class="flex items-start justify-between gap-sm">
      <NuxtLink v-if="titleTo" :to="titleTo" class="group">
        <h3
          class="font-sans text-h4 font-semibold text-ink transition-colors group-hover:text-accent-text"
        >
          {{ name }}
        </h3>
      </NuxtLink>
      <h3 v-else class="font-sans text-h4 font-semibold text-ink">{{ name }}</h3>
      <span class="hidden md:block shrink-0 text-meta text-ink-subtle">{{ distance }}</span>
    </div>
    <p class="mt-xs text-small text-ink-muted">{{ formations }}</p>
    <div v-if="status || tags.length" class="mt-md flex flex-wrap gap-sm">
      <Badge v-if="status" :variant="status.type" class="w-fit">
        <span
          v-if="status.type === 'success'"
          class="h-sm w-sm rounded-full bg-current"
          aria-hidden="true"
        />
        <span v-else-if="status.type === 'warning'" aria-hidden="true">▲</span>
        {{ status.label }}
      </Badge>
      <Badge v-for="tag in tags" :key="tag" :variant="tagVariant(tag)">
        <span
          v-if="tag === 'Sessions cette semaine'"
          class="h-sm w-sm rounded-full bg-current"
          aria-hidden="true"
        />
        {{ tag }}
      </Badge>
    </div>
    <NuxtLink
      v-if="to"
      :to="to"
      class="mt-md block text-small font-bold text-primary transition-colors hover:text-accent-text"
    >
      Voir le centre <span class="link-arrow">→</span>
    </NuxtLink>
  </article>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    name: string
    distance: string
    formations: string
    tags?: string[]
    status?: { type: 'success' | 'warning' | 'neutral'; label: string }
    to?: string | null
    titleTo?: string | null
  }>(),
  { tags: () => [], status: undefined, to: undefined, titleTo: '/centres' }
)

function tagVariant(tag: string): 'success' | 'warning' | 'neutral' {
  if (tag.startsWith('▲')) return 'warning'
  if (tag === 'Intra sur site') return 'neutral'
  return 'success'
}
</script>
