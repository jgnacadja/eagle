<template>
  <article class="flex flex-col gap-md">
    <div
      class="flex aspect-[2/1] items-center justify-center rounded-md border border-dashed border-outline-inverse bg-primary-card px-md text-center text-small font-medium text-ink-inverse/60"
    >
      <span>{{ imageLabel }}<br v-if="imageSub" />{{ imageSub }}</span>
    </div>
    <div class="flex flex-col gap-1.5 rounded-md bg-primary-card p-lg">
      <p class="text-overline text-accent uppercase">{{ tag }}</p>
      <h3 class="font-sans text-h4 text-ink-inverse">{{ title }}</h3>
      <p class="text-body text-ink-inverse/65">{{ body }}</p>
    </div>
  </article>
</template>

<script setup lang="ts">
defineProps<{
  tag: string
  title: string
  body: string
  imageLabel: string
  imageSub?: string
}>()
</script>
