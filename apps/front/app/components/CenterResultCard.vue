<template>
  <article
    class="cursor-pointer rounded-md border p-md shadow-sm transition"
    :class="active ? 'border-ink bg-surface' : 'border-rule bg-paper'"
    @click="$emit('select')"
  >
    <div class="flex items-start justify-between gap-sm">
      <h3 class="font-sans text-h4 font-semibold text-ink">{{ center.name }}</h3>
      <span class="shrink-0 text-small text-ink-subtle">{{ center.cp }}</span>
    </div>
    <p class="mt-xs text-small text-ink-muted">{{ center.address }}</p>
    <p class="mt-sm text-small text-ink-body">{{ center.tags }}</p>
    <div class="mt-md flex items-center justify-between gap-sm">
      <span
        class="inline-flex items-center gap-xs rounded-full px-md py-xs text-meta font-bold"
        :class="statusClasses"
      >
        <span v-if="dotClass" class="h-2.5 w-2.5 rounded-full" :class="dotClass" />
        <svg
          v-else-if="center.status.type === 'warning'"
          class="h-3 w-3"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          viewBox="0 0 24 24"
        >
          <path d="M12 9v4m0 4h.01M10.3 4.6 2.4 18.2A2 2 0 0 0 4.2 21h15.6a2 2 0 0 0 1.8-2.8L13.7 4.6a2 2 0 0 0-3.4 0z" />
        </svg>
        {{ center.status.label }}
      </span>
      <NuxtLink
        :to="`/centres/${center.id}`"
        class="shrink-0 rounded-full border border-ink px-md py-sm text-small font-semibold text-ink transition hover:bg-ink hover:text-paper"
        @click.stop
      >
        Voir le centre
      </NuxtLink>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CenterResult } from '~/types/center-result'

const props = defineProps<{
  center: CenterResult
  active?: boolean
}>()

defineEmits<{
  select: []
}>()

const statusClasses = computed(() => {
  switch (props.center.status.type) {
    case 'success':
      return 'bg-success-soft text-success'
    case 'warning':
      return 'bg-warning-soft text-warning'
    default:
      return 'bg-surface text-ink-muted'
  }
})

const dotClass = computed(() => {
  if (props.center.status.type === 'success') return 'bg-success'
  return ''
})
</script>
