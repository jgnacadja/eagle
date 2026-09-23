<template>
  <NuxtLink
    :to="to"
    class="group flex items-center justify-between gap-md rounded-2xl border border-rule bg-paper p-md transition-all duration-200 hover:border-primary/40 hover:shadow-sm sm:p-lg"
  >
    <div class="min-w-0 flex-1">
      <h3 class="font-display text-sm font-extrabold uppercase text-ink md:text-body">
        {{ title }}
      </h3>
      <p v-if="subtitle" class="mt-1 text-xs text-ink-muted">
        {{ subtitle }}
      </p>
      <p v-if="body" class="mt-xs text-xs text-ink-muted">
        {{ body }}
      </p>
      <span v-if="cta" class="sr-only">{{ cta }}</span>
    </div>

    <div
      class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-primary/20 text-primary transition-colors group-hover:border-primary group-hover:bg-primary group-hover:text-ink-inverse sm:h-9 sm:w-9"
      aria-hidden="true"
    >
      <span class="link-arrow text-sm">→</span>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string
    subtitle?: string
    body?: string
    cta?: string
    to: string
  }>(),
  { subtitle: '', body: '', cta: '' }
)
</script>
