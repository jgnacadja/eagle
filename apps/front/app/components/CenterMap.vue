<template>
  <div
    class="relative h-full min-h-full overflow-hidden bg-surface-alt"
    :class="{ 'flex items-center justify-center': !centers.length }"
  >
    <p
      v-if="centers.length"
      class="pointer-events-none absolute left-md top-md z-10 rounded-xs bg-paper/90 px-md py-xs text-meta text-ink-subtle"
    >
      Carte Leaflet · OpenStreetMap — <span>{{ caption }}</span>
    </p>

    <div class="absolute right-md top-md z-20 flex flex-col gap-sm">
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label="Zoomer"
        class="h-control-sm w-control-sm rounded-sm bg-paper text-ink shadow-sm hover:bg-surface"
        @click="zoomIn"
      >
        <IconPlus :size="16" />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label="Dézoomer"
        class="h-control-sm w-control-sm rounded-sm bg-paper text-ink shadow-sm hover:bg-surface"
        @click="zoomOut"
      >
        <IconMinus :size="16" />
      </Button>
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
        <IconMapPin
          class="pin-svg"
          :class="activeId === center.id ? 'text-accent' : 'text-primary'"
          :size="activeId === center.id ? 38 : 30"
        />
      </button>

      <CenterMapPopup
        v-if="activeCenter"
        :id="activeCenter.id"
        :name="activeCenter.name"
        :location-label="mapLocationLabel"
        :tags-short="activeCenter.tagsShort"
        :pos="activeCenter.pos"
        @close="$emit('select', '')"
      />
    </div>

    <p v-if="!centers.length" class="px-gutter text-center text-small text-ink-muted">
      Aucun centre à afficher sur la carte pour ce département.
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Button } from '@/components/ui/button'
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
.pin {
  transition: transform 0.15s ease;
}

.pin:hover,
.pin:focus-visible {
  transform: translate(-50%, -100%) scale(1.08);
  outline: none;
}
</style>
