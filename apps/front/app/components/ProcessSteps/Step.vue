<template>
  <li
    v-reveal="revealStagger(index)"
    class="relative flex flex-row items-start gap-md text-left md:flex-col md:items-center md:gap-0 md:text-center"
  >
    <span
      class="z-10 flex h-control-sm w-control-sm shrink-0 items-center justify-center rounded-full text-small font-bold"
      :class="badgeClass"
    >
      {{ step.number ?? index + 1 }}
    </span>

    <div class="flex-1 pt-1 md:pt-0">
      <h3 class="text-ink md:mt-2.5" :class="titleClass">
        {{ step.title }}
      </h3>

      <p class="mt-0.5 text-small text-ink-muted md:mx-auto md:mt-1" :class="maxWidthClass">
        {{ step.body }}
      </p>
    </div>
  </li>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { revealStagger } from '~/utils/reveal'
import type { StepItem } from './index.vue'

const props = defineProps<{
  step: StepItem
  index: number
  isLast: boolean
  lastStepVariant: 'success' | 'accent' | 'primary'
  titleSize: 'body' | 'h4'
  maxWidthClass?: string
}>()

const badgeClass = computed(() => {
  if (!props.isLast) return 'bg-primary text-paper'

  return {
    success: 'bg-success text-paper',
    accent: 'bg-accent text-ink',
    primary: 'bg-primary text-paper'
  }[props.lastStepVariant]
})

const titleClass = computed(() =>
  props.titleSize === 'h4' ? 'font-display text-h4 font-extrabold' : 'font-sans text-body font-bold'
)
</script>
