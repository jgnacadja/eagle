<template>
  <div
    class="map-canvas relative min-h-224 overflow-hidden rounded-md border border-rule"
    :class="{ 'flex items-center justify-center': !centers.length }"
  >
    <p
      v-if="centers.length"
      class="pointer-events-none absolute left-md top-md z-10 rounded-xs bg-paper/90 px-md py-xs text-meta text-ink-subtle"
    >
      Carte Leaflet · OpenStreetMap — <span>{{ caption }}</span>
    </p>

    <div class="absolute right-md top-md z-20 flex flex-col gap-sm">
      <button
        type="button"
        aria-label="Zoomer"
        class="flex h-control-sm w-control-sm items-center justify-center rounded-sm bg-paper text-ink shadow-sm transition hover:bg-surface"
        @click="zoomIn"
      >
        <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path d="M12 5v14M5 12h14" stroke-linecap="round" />
        </svg>
      </button>
      <button
        type="button"
        aria-label="Dézoomer"
        class="flex h-control-sm w-control-sm items-center justify-center rounded-sm bg-paper text-ink shadow-sm transition hover:bg-surface"
        @click="zoomOut"
      >
        <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path d="M5 12h14" stroke-linecap="round" />
        </svg>
      </button>
    </div>

    <div
      v-if="centers.length"
      class="map-layer absolute inset-0"
      :style="{ transform: `scale(${scale})`, transformOrigin: 'center center' }"
    >
      <button
        v-for="center in centers"
        :key="center.id"
        type="button"
        class="pin absolute -translate-x-1/2 -translate-y-full cursor-pointer"
        :style="{ top: center.pos.top, left: center.pos.left }"
        :aria-label="center.name"
        @click="$emit('select', center.id)"
      >
        <svg
          class="pin-svg"
          :class="{ active: activeId === center.id }"
          :width="activeId === center.id ? 38 : 30"
          :height="activeId === center.id ? 38 : 30"
          viewBox="0 0 24 24"
          fill="none"
        >
          <path
            d="M12 22s7-7.58 7-13A7 7 0 0 0 5 9c0 5.42 7 13 7 13z"
            :fill="activeId === center.id ? 'var(--color-accent)' : 'var(--color-primary)'"
          />
          <circle cx="12" cy="9" r="2.6" fill="white" />
        </svg>
      </button>

      <div
        v-if="activeCenter"
        class="absolute z-30 w-80 -translate-x-1/2 -translate-y-full rounded-md bg-paper p-md shadow-lg"
        :style="{ top: `calc(${activeCenter.pos.top} - 12px)`, left: activeCenter.pos.left }"
      >
        <button
          type="button"
          aria-label="Fermer"
          class="absolute right-sm top-sm text-ink-subtle transition hover:text-ink"
          @click.stop="$emit('select', '')"
        >
          <svg
            class="h-4 w-4"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            viewBox="0 0 24 24"
          >
            <path d="M6 6l12 12M18 6L6 18" stroke-linecap="round" />
          </svg>
        </button>
        <h4 class="pr-6 font-sans text-h4 text-ink">{{ activeCenter.name }}</h4>
        <p class="mt-xs text-meta text-ink-subtle">{{ mapLocationLabel }}</p>
        <p class="mt-sm text-small font-medium text-ink-body">{{ activeCenter.tagsShort }}</p>
        <NuxtLink
          :to="`/centres/${activeCenter.id}`"
          class="mt-md inline-block rounded-full bg-primary px-md py-sm text-small font-bold text-paper transition hover:bg-primary-dark"
        >
          Voir le centre
        </NuxtLink>
      </div>
    </div>

    <p v-if="!centers.length" class="px-gutter text-center text-small text-ink-muted">
      Aucun centre à afficher sur la carte pour ce département.
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { CenterResult } from '~/types/center-result'

const props = defineProps<{
  centers: CenterResult[]
  activeId: string | null
  caption: string
}>()

defineEmits<{
  select: [id: string]
}>()

const scale = ref(1)

const activeCenter = computed(() => props.centers.find((c) => c.id === props.activeId))

const mapLocationLabel = computed(() => {
  if (!activeCenter.value) return ''
  const parts = activeCenter.value.address.split('·')
  if (parts.length > 1) return parts[1].trim()
  return activeCenter.value.address.split(',').pop()?.trim() ?? ''
})

function zoomIn() {
  if (scale.value < 2) scale.value += 0.2
}

function zoomOut() {
  if (scale.value > 0.6) scale.value -= 0.2
}
</script>

<style scoped>
.map-canvas {
  background-color: var(--color-surface-alt);
  background-image:
    linear-gradient(var(--color-rule) 1px, transparent 1px),
    linear-gradient(90deg, var(--color-rule) 1px, transparent 1px);
  background-size: 2rem 2rem;
}

.pin {
  transition: transform 0.15s ease;
}

.pin:hover,
.pin:focus-visible {
  transform: translate(-50%, -100%) scale(1.08);
  outline: none;
}
</style>
