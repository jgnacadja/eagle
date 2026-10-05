<template>
  <figure
    :class="[
      'testimonial-card motion-surface flex flex-col justify-between rounded-2xl p-lg',
      variant === 'surface' ? 'bg-surface' : 'bg-paper'
    ]"
  >
    <div>
      <div class="text-sm tracking-wider text-accent" aria-hidden="true">{{ stars }}</div>
      <blockquote class="mt-sm text-xs font-normal leading-relaxed text-ink md:text-small">
        {{ quote }}
      </blockquote>
    </div>
    <figcaption class="mt-md text-xs text-ink-muted font-bold">{{ author }}</figcaption>
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

<style scoped>
/* Élévation plus légère que le shadow-md de .motion-surface : la carte
   n'est pas cliquable, un hover trop marqué suggère une interaction. */
@media (hover: hover) {
  .testimonial-card:hover {
    box-shadow: var(--shadow-sm);
  }
}

.testimonial-card:focus-within {
  box-shadow: var(--shadow-sm);
}
</style>
