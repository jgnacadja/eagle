<template>
  <Card class="rounded-md">
    <CardContent class="flex flex-col gap-md p-md sm:flex-row sm:items-center">
      <div class="flex min-w-0 flex-1 items-center gap-md">
        <div class="w-3xl shrink-0 rounded-md bg-surface py-sm text-center">
          <p class="font-display text-h3 font-bold leading-none text-ink">{{ day }}</p>
          <p class="text-overline uppercase text-ink-muted">{{ month }}</p>
        </div>
        <div class="min-w-0 flex-1">
          <p class="font-sans text-h4 font-semibold text-ink">{{ title }}</p>
          <p class="text-small text-ink-muted">{{ meta }}</p>
        </div>
      </div>
      <div class="flex items-center justify-between gap-sm sm:contents">
        <div
          v-if="price || places !== undefined"
          class="flex shrink-0 items-center gap-sm sm:flex-col sm:items-end sm:justify-center sm:gap-xs"
        >
          <p v-if="price" class="text-small text-ink-muted">
            <span class="font-semibold text-ink">{{ price }}</span> {{ priceNote }}
          </p>
          <Badge v-if="type && places !== undefined" :variant="type">
            <span
              v-if="type !== 'warning'"
              class="h-sm w-sm rounded-full bg-current"
              aria-hidden="true"
            />
            <span v-else aria-hidden="true">▲</span>
            <span class="hidden sm:inline">{{ placesLabel(places, true) }}</span>
            <span class="sm:hidden">{{ placesLabel(places, false) }}</span>
          </Badge>
        </div>
        <Button
          as-child
          variant="outline"
          class="h-auto shrink-0 rounded-full border-outline bg-paper px-md py-xs text-small font-bold text-ink transition hover:border-primary hover:bg-paper"
        >
          <NuxtLink :to="to">Voir la session</NuxtLink>
        </Button>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { placesLabel } from '~/utils/placesLabel'

withDefaults(
  defineProps<{
    day: string
    month: string
    title: string
    meta: string
    to?: string
    places?: number
    type?: 'success' | 'warning'
    price?: string
    priceNote?: string
  }>(),
  { to: '#', places: undefined, type: undefined, price: '', priceNote: '' }
)
</script>
