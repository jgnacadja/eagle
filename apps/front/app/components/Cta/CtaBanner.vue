<template>
  <section
    class="flex flex-wrap items-center justify-between gap-2xl rounded-md bg-primary-dark px-lg py-xl text-ink-inverse"
    :aria-labelledby="resolvedTitleId"
  >
    <div class="max-w-prose">
      <h2 :id="resolvedTitleId" class="font-display text-h3 font-bold text-ink-inverse">
        {{ title }}
      </h2>
      <p class="mt-sm text-small text-ink-inverse/70">{{ text }}</p>
    </div>
    <div class="flex w-full flex-col gap-md sm:w-auto sm:flex-row">
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, useId } from 'vue'

const props = defineProps<{
  title: string
  text: string
  titleId?: string
}>()

const resolvedTitleId = computed(() => props.titleId ?? useId())
</script>
