<template>
  <div v-if="variant === 'marquee'" :class="styles.container" :aria-label="ariaLabel">
    <!-- Masques de fondu gauche et droite -->
    <div
      class="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-linear-to-r from-paper to-transparent sm:w-20"
      aria-hidden="true"
    />
    <div
      class="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-linear-to-l from-paper to-transparent sm:w-20"
      aria-hidden="true"
    />

    <div
      class="flex w-max marquee hover:[animation-play-state:paused] focus-within:[animation-play-state:paused]"
    >
      <!-- Premier groupe (accessible) -->
      <div class="flex shrink-0 items-center gap-2 sm:gap-3 md:gap-md pr-2 sm:pr-3 md:pr-md">
        <div
          v-for="(company, idx) in marqueeLogos"
          :key="`logo-1-${company.name}-${idx}`"
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
      <!-- Deuxième groupe pour boucle infinie transparente (masqué aux lecteurs d'écran) -->
      <div
        class="flex shrink-0 items-center gap-2 sm:gap-3 md:gap-md pr-2 sm:pr-3 md:pr-md"
        aria-hidden="true"
      >
        <div
          v-for="(company, idx) in marqueeLogos"
          :key="`logo-2-${company.name}-${idx}`"
          :class="styles.card"
        >
          <img :src="company.logoUrl" alt="" :class="styles.img" loading="lazy" />
        </div>
      </div>
    </div>
  </div>

  <div v-else :class="styles.container" :aria-label="ariaLabel">
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

type Variant = 'scroll' | 'grid' | 'marquee'

const MARQUEE_STYLES = {
  container: 'relative w-full overflow-hidden',
  card: 'flex h-14 w-28 shrink-0 items-center justify-center rounded-xl border border-dashed border-rule px-2 text-xs text-ink-subtle sm:w-32 md:h-14 md:w-36 md:rounded md:px-3',
  img: 'max-h-7 max-w-4/5 object-contain grayscale opacity-75 transition-[filter,opacity] hover:grayscale-0 hover:opacity-100 md:max-h-8'
}

const VARIANT_STYLES: Record<Variant, { container: string; card: string; img: string }> = {
  marquee: MARQUEE_STYLES,
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

const MIN_CARDS_PER_GROUP = 16

const marqueeLogos = computed(() => {
  const list = props.logos
  if (!list || list.length === 0) return []
  const repeats = Math.max(1, Math.ceil(MIN_CARDS_PER_GROUP / list.length))
  return Array.from({ length: repeats }, () => list).flat()
})
</script>
