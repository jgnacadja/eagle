<template>
  <section :id="id" :class="sectionClass" :aria-labelledby="`${id}-title`">
    <h2 :id="`${id}-title`" class="font-display text-h2 font-extrabold text-ink">
      {{ title }}
    </h2>

    <div class="mt-xl grid gap-grid sm:grid-cols-2 lg:grid-cols-4">
      <article v-for="benefit in benefits" :key="benefit.label" class="rounded-md bg-surface p-lg">
        <p class="text-overline font-bold uppercase text-accent-text">
          {{ benefit.label }}
        </p>

        <h3 class="mt-md font-display text-h4 font-extrabold text-ink">
          {{ benefit.title }}
        </h3>

        <p class="mt-sm text-small text-ink-muted">
          {{ benefit.body }}
        </p>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
export interface BenefitItem {
  label: string
  title: string
  body: string
}

withDefaults(
  defineProps<{
    id?: string
    title: string
    benefits: BenefitItem[]
    sectionClass?: string
  }>(),
  {
    id: 'modele',
    sectionClass: 'mt-4xl'
  }
)
</script>
