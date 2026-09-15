<template>
  <ol class="relative flex flex-col gap-xl md:grid md:gap-2xl" :class="gridClass">
    <!-- Ligne verticale mobile -->
    <div
      class="absolute left-[calc(var(--spacing-control-sm)/2-0.5px)] top-[calc(var(--spacing-control-sm)/2)] bottom-[calc(var(--spacing-control-sm)/2)] z-0 w-px bg-rule-strong md:hidden"
      aria-hidden="true"
    />

    <!-- Ligne horizontale desktop -->
    <div
      class="pointer-events-none absolute top-[calc(var(--spacing-control-sm)/2-0.5px)] z-0 hidden h-px bg-rule-strong md:block"
      :style="horizontalLineStyle"
      aria-hidden="true"
    />

    <ProcessStepsStep
      v-for="(step, index) in steps"
      :key="step.title"
      :step="step"
      :index="index"
      :is-last="index === steps.length - 1"
      :last-step-variant="lastStepVariant"
      :title-size="titleSize"
    />
  </ol>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ProcessStepsStep from './Step.vue'

export interface StepItem {
  title: string
  body: string
  number?: number
}

const props = withDefaults(
  defineProps<{
    steps: StepItem[]
    lastStepVariant?: 'success' | 'accent' | 'primary'
    titleSize?: 'body' | 'h4'
  }>(),
  {
    lastStepVariant: 'success',
    titleSize: 'body'
  }
)

const GRID_COLS: Record<number, string> = {
  3: 'md:grid-cols-3',
  4: 'md:grid-cols-4',
  5: 'md:grid-cols-5'
}

const gridClass = computed(() => GRID_COLS[props.steps.length] ?? 'md:grid-cols-4')

const horizontalLineStyle = computed(() => {
  const n = props.steps.length

  return n > 1 ? { left: `${50 / n}%`, right: `${50 / n}%` } : { display: 'none' }
})
</script>
