<template>
  <figure
    :class="[
      'flex flex-col justify-between rounded-2xl p-lg transition-all duration-200 hover:shadow-xs',
      variant === 'surface' ? 'bg-surface' : 'bg-paper'
    ]"
  >
    <div>
      <div class="text-sm tracking-wider text-accent" aria-hidden="true">{{ stars }}</div>
      <blockquote class="mt-sm text-xs font-normal leading-relaxed text-ink md:text-small">
        {{ quote }}
      </blockquote>
    </div>
    <figcaption class="mt-md text-xs text-ink-muted">{{ author }}</figcaption>
  </figure>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    stars: string
    quote: string
    author: string
    variant?: 'surface' | 'paper'
  }>(),
  {
    variant: 'surface'
  }
)
</script>
