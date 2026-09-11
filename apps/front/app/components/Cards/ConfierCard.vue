<template>
  <article v-if="variant === 'full'" class="flex h-full flex-col gap-md">
    <div
      class="flex aspect-[2/1] items-center justify-center rounded-md border border-dashed border-outline-inverse bg-primary-card px-md text-center text-small font-medium text-ink-inverse/60"
    >
      <span>{{ imageLabel }}<br v-if="imageSub" />{{ imageSub }}</span>
    </div>
    <div class="flex flex-1 flex-col gap-1.5 rounded-md bg-primary-card p-lg">
      <p class="text-overline text-accent uppercase">{{ tag }}</p>
      <h3 class="font-sans text-body md:text-h3 font-bold text-ink-inverse">{{ title }}</h3>
      <p class="text-small md:text-body text-ink-inverse/65">{{ body }}</p>
    </div>
  </article>

  <div
    v-else-if="variant === 'image'"
    class="flex aspect-[2/1] basis-3/4 shrink-0 snap-start items-center justify-center rounded-md border border-dashed border-outline-inverse bg-primary-card px-md text-center text-small font-medium text-ink-inverse/60 md:min-w-0"
  >
    <span>{{ imageLabel }}<br v-if="imageSub" />{{ imageSub }}</span>
  </div>

  <div v-else class="flex flex-col gap-1.5 rounded-md bg-primary-card p-lg">
    <p class="text-overline text-accent uppercase">{{ tag }}</p>
    <h3 class="font-sans text-body md:text-h3 font-bold text-ink-inverse">{{ title }}</h3>
    <p class="text-small md:text-body text-ink-inverse/65">{{ body }}</p>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    tag: string
    title: string
    body: string
    imageLabel: string
    imageSub?: string
    variant?: 'full' | 'image' | 'detail'
  }>(),
  {
    imageSub: '',
    variant: 'full'
  }
)
</script>
