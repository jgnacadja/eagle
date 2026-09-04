<template>
  <div
    class="absolute z-30 w-80 -translate-x-1/2 -translate-y-full rounded-md bg-paper p-md shadow-lg"
    :style="{ top: pos.top, left: pos.left }"
  >
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label="Fermer"
      class="absolute right-sm top-sm h-control-sm w-control-sm text-ink-subtle transition hover:bg-surface hover:text-ink"
      @click.stop="$emit('close')"
    >
      <IconClose :size="16" />
    </Button>
    <h4 class="pr-6 font-sans text-h4 text-ink">{{ name }}</h4>
    <p class="mt-xs text-meta text-ink-subtle">{{ locationLabel }}</p>
    <p class="mt-sm text-small font-medium text-ink-body">{{ tagsShort }}</p>
    <Button
      as-child
      class="mt-md h-control rounded-full bg-primary px-md text-small font-bold text-paper hover:bg-primary-dark"
    >
      <NuxtLink :to="`/centres/${id}`">Voir le centre</NuxtLink>
    </Button>
  </div>
</template>

<script setup lang="ts">
import { Button } from '@/components/ui/button'
import IconClose from '@/components/icons/IconClose.vue'

defineProps<{
  id: string
  name: string
  locationLabel: string
  tagsShort: string
  pos: { top: string; left: string }
}>()

defineEmits<{
  close: []
}>()
</script>
