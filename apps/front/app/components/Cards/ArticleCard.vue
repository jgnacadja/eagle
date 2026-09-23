<template>
  <article
    v-if="variant === 'card'"
    class="group relative flex flex-row items-center gap-3.5 rounded-2xl border border-rule bg-paper p-3.5 shadow-xs transition-all duration-200 hover:border-primary/40 hover:shadow-sm sm:gap-4 sm:p-4 md:flex-col md:items-stretch md:gap-0 md:p-md"
  >
    <!-- Zone Visuel / Placeholder -->
    <div
      class="flex aspect-square w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl text-center md:aspect-16/10 md:w-full"
      :class="
        imageUrl
          ? 'bg-paper'
          : 'border border-dashed border-outline/60 bg-surface-alt text-xs text-ink-muted'
      "
    >
      <NuxtImg
        v-if="imageUrl"
        :src="imageUrl"
        :alt="title"
        loading="lazy"
        class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
      <span v-else>Visuel</span>
    </div>

    <!-- Contenu -->
    <div class="flex min-w-0 flex-1 flex-col justify-center md:mt-md">
      <p class="text-overline font-extrabold uppercase tracking-wider text-accent-text">
        {{ category }}
      </p>

      <NuxtLink :to="to" class="mt-0.5 md:mt-1 after:absolute after:inset-0">
        <h3
          class="line-clamp-2 font-sans text-sm font-bold text-ink transition-colors group-hover:text-primary md:text-body"
        >
          {{ title }}
        </h3>
      </NuxtLink>

      <p class="mt-1 md:mt-2 text-xs font-medium text-ink-muted">
        {{ date }}
      </p>
    </div>
  </article>

  <article
    v-else
    class="group relative flex flex-row gap-md rounded-md border border-rule bg-paper p-md shadow-sm transition-[border-color,box-shadow] hover:border-primary/40 hover:shadow-md md:flex-col md:gap-0 md:overflow-hidden md:p-0"
  >
    <div
      class="flex aspect-3/2 w-2/5 shrink-0 items-center justify-center overflow-hidden rounded-sm text-center md:w-auto md:rounded-none"
      :class="
        imageUrl
          ? 'border-0 bg-paper'
          : 'border border-dashed border-outline bg-surface-alt text-small text-ink-muted md:border-b md:border-x-0 md:border-t-0'
      "
    >
      <NuxtImg
        v-if="imageUrl"
        :src="imageUrl"
        :alt="title"
        loading="lazy"
        class="h-full w-full object-cover"
      />
      <span v-else>Visuel article à fournir</span>
    </div>
    <div class="flex min-w-0 flex-1 flex-col bg-paper md:p-md">
      <div class="flex flex-wrap items-center gap-x-sm gap-y-xs">
        <p class="text-overline uppercase font-bold text-accent-text">{{ category }}</p>
        <p class="hidden text-meta font-medium text-ink-subtle md:block">{{ date }}</p>
      </div>

      <NuxtLink :to="to" class="after:absolute after:inset-0 hover:underline">
        <h3 class="mt-sm font-sans text-small font-bold text-ink md:text-h4">{{ title }}</h3>
      </NuxtLink>
      <p class="mt-sm hidden text-small text-ink-body md:block">{{ excerpt }}</p>
      <!-- Lien visuel seulement : le titre porte le stretched-link qui
           rend toute la carte cliquable — le hover s'applique via `group`. -->
      <p
        class="mt-auto hidden pt-md text-small font-bold text-primary transition-colors group-hover:text-accent-text md:block"
      >
        Lire l'article
        <span class="link-arrow group-hover:translate-x-xs">→</span>
      </p>
      <p class="mt-auto pt-xs text-meta text-ink-subtle font-medium md:hidden">{{ date }}</p>
    </div>
  </article>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    category: string
    title: string
    date: string
    excerpt?: string
    imageUrl?: string
    to?: string
    variant?: 'default' | 'card'
  }>(),
  { excerpt: '', imageUrl: '', to: '#', variant: 'default' }
)
</script>
