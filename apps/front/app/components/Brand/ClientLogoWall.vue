<template>
  <div :class="styles.container" :aria-label="ariaLabel">
    <div
      v-for="(company, i) in logos"
      :key="company.name"
      v-reveal="revealStagger(i)"
      :class="styles.card"
      :aria-label="`Logo client ${company.name}`"
    >
      <img
        :src="company.logoUrl"
        :alt="`Logo ${company.name}`"
        :class="styles.img"
        loading="lazy"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { companyLogos, type CompanyLogo } from '~/data/companies'
import { revealStagger } from '~/utils/reveal'

type Variant = 'scroll' | 'grid' | 'wrap'

const VARIANT_STYLES: Record<Variant, { container: string; card: string; img: string }> = {
  wrap: {
    container:
      'mt-md grid grid-cols-4 gap-2 sm:gap-3 md:flex md:flex-wrap md:items-center md:justify-center md:gap-md',
    card: 'flex h-14 items-center justify-center rounded-xl border border-dashed border-rule px-2 text-xs text-ink-subtle md:h-14 md:w-32 md:rounded md:px-3',
    img: 'max-h-7 max-w-4/5 object-contain'
  },
  grid: {
    container: 'mt-lg grid grid-cols-3 gap-sm sm:gap-grid md:grid-cols-6',
    card: 'flex h-16 sm:h-20 items-center justify-center rounded-sm border border-rule bg-surface p-md shadow-sm transition-all hover:border-primary/40',
    img: 'max-h-7 sm:max-h-9 max-w-full object-contain grayscale opacity-75 transition-[filter,opacity] hover:grayscale-0 hover:opacity-100'
  },
  scroll: {
    container:
      'mt-lg flex snap-x snap-mandatory gap-md overflow-x-auto pb-sm md:grid md:grid-cols-6 md:gap-md md:overflow-visible',
    card: 'flex h-16 w-32 shrink-0 snap-start items-center justify-center rounded-sm border border-rule bg-paper p-md shadow-sm transition-all hover:border-primary/40 md:h-20 md:w-auto',
    img: 'max-h-7 max-w-4/5 object-contain grayscale opacity-75 transition-[filter,opacity] hover:grayscale-0 hover:opacity-100 md:max-h-8'
  }
}

const props = withDefaults(
  defineProps<{
    logos?: CompanyLogo[]
    variant?: Variant
    ariaLabel?: string
  }>(),
  {
    logos: () => companyLogos,
    variant: 'scroll',
    ariaLabel: 'Références clients'
  }
)

const styles = computed(() => VARIANT_STYLES[props.variant])
</script>
