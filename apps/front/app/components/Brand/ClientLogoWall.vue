<template>
  <div :class="containerClass">
    <div
      v-for="(company, i) in logos"
      :key="company.name"
      v-reveal="revealStagger(i)"
      :class="cardClass"
    >
      <img :src="company.logoUrl" :alt="`Logo ${company.name}`" :class="imgClass" loading="lazy" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { companyLogos, type CompanyLogo } from '~/data/companies'
import { revealStagger } from '~/utils/reveal'

const props = withDefaults(
  defineProps<{
    logos?: CompanyLogo[]
    variant?: 'scroll' | 'grid'
  }>(),
  {
    logos: () => companyLogos,
    variant: 'scroll'
  }
)

const containerClass = computed(() =>
  props.variant === 'grid'
    ? 'mt-lg grid grid-cols-3 gap-sm sm:gap-grid md:grid-cols-6'
    : 'mt-lg flex snap-x snap-mandatory gap-md overflow-x-auto pb-sm md:grid md:grid-cols-6 md:gap-md md:overflow-visible'
)

const cardClass = computed(() =>
  props.variant === 'grid'
    ? 'flex h-16 sm:h-20 items-center justify-center rounded-sm border border-rule bg-surface p-md shadow-sm transition-all hover:border-primary/40'
    : 'flex h-16 w-32 shrink-0 snap-start items-center justify-center rounded-sm border border-rule bg-paper p-md shadow-sm transition-all hover:border-primary/40 md:h-20 md:w-auto'
)

const imgClass = computed(() =>
  props.variant === 'grid'
    ? 'max-h-7 sm:max-h-9 max-w-full object-contain grayscale opacity-75 transition-[filter,opacity] hover:grayscale-0 hover:opacity-100'
    : 'max-h-7 max-w-4/5 object-contain grayscale opacity-75 transition-[filter,opacity] hover:grayscale-0 hover:opacity-100 md:max-h-8'
)
</script>
