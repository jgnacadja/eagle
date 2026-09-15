<template>
  <ol
    class="relative flex flex-col gap-xl md:grid md:gap-2xl"
    :class="
      { 3: 'md:grid-cols-3', 4: 'md:grid-cols-4', 5: 'md:grid-cols-5' }[steps.length] ??
      'md:grid-cols-4'
    "
  >
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

    <li
      v-for="(step, index) in steps"
      :key="step.title"
      class="relative flex flex-row items-start gap-md text-left md:flex-col md:items-center md:gap-0 md:text-center"
    >
      <span
        class="z-10 flex h-control-sm w-control-sm shrink-0 items-center justify-center rounded-full text-small font-bold"
        :class="badgeClass(index)"
      >
        {{ step.number ?? index + 1 }}
      </span>

      <div class="flex-1 pt-1 md:pt-0">
        <h3
          class="font-bold text-ink md:mt-2.5"
          :class="
            titleSize === 'h4' ? 'font-display text-h4 font-extrabold' : 'font-sans text-body'
          "
        >
          {{ step.title }}
        </h3>

        <p class="mt-0.5 text-small text-ink-muted md:mx-auto md:mt-1" :class="step.maxWidth">
          {{ step.body }}
        </p>
      </div>
    </li>
  </ol>
</template>

<script setup lang="ts">
import { computed } from 'vue'

export interface StepItem {
  title: string
  body: string
  number?: number
  maxWidth?: string
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

const horizontalLineStyle = computed(() => {
  const n = props.steps.length

  return n > 1 ? { left: `${50 / n}%`, right: `${50 / n}%` } : { display: 'none' }
})

const badgeClass = (index: number) => {
  if (index < props.steps.length - 1) return 'bg-primary text-paper'

  return {
    success: 'bg-success text-paper',
    accent: 'bg-accent text-ink',
    primary: 'bg-primary text-paper'
  }[props.lastStepVariant]
}
</script>
