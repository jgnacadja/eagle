<template>
  <section
    class="mx-auto w-full max-w-prose px-gutter-mobile py-4xl text-center md:px-gutter"
    :aria-labelledby="titleId"
  >
    <div
      class="mx-auto mb-lg flex h-4xl w-4xl items-center justify-center rounded-full bg-accent-soft"
    >
      <slot name="icon">
        <IconRefresh :size="30" class="text-accent-text" />
      </slot>
    </div>
    <h1 :id="titleId" class="font-display text-h2 font-extrabold text-ink">
      {{ title }}
    </h1>
    <p class="mt-md text-body leading-relaxed text-ink-body">
      <slot />
    </p>
    <div
      class="mt-2xl flex flex-col items-stretch justify-center gap-md sm:flex-row sm:items-center"
    >
      <Button
        type="button"
        class="h-control gap-sm rounded-full bg-primary-dark px-lg text-button font-semibold text-ink-inverse transition hover:bg-primary"
        @click="emit('retry')"
      >
        <IconRefresh :size="16" />
        {{ retryLabel }}
      </Button>
      <Button
        as-child
        variant="outline"
        class="h-control rounded-full border-outline px-lg text-button font-semibold text-ink transition hover:border-primary"
      >
        <NuxtLink :to="linkTo">{{ linkLabel }}</NuxtLink>
      </Button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useId } from 'vue'

withDefaults(
  defineProps<{
    title: string
    linkTo: string
    linkLabel: string
    retryLabel?: string
  }>(),
  { retryLabel: 'Réessayer' }
)

const emit = defineEmits<{ retry: [] }>()

const titleId = `load-error-title-${useId()}`
</script>
