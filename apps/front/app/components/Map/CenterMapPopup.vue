<template>
  <div
    class="z-30 w-80 rounded-md bg-paper p-md shadow-lg"
    :class="popupClasses"
    :style="popupStyles"
  >
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label="Fermer"
      class="absolute right-sm top-sm h-control-sm w-control-sm text-ink-subtle transition hover:bg-surface hover:text-ink"
      @click.stop="handleClose"
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
      <a :href="`/centres/${id}`">Voir le centre</a>
    </Button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Button } from '@/components/ui/button'
import IconClose from '@/components/icons/IconClose.vue'

const props = defineProps<{
  id: string
  name: string
  locationLabel: string
  tagsShort: string
  pos?: { top: string; left: string }
  onClose?: () => void
}>()

const emit = defineEmits<{
  close: []
}>()

function handleClose() {
  emit('close')
  props.onClose?.()
}

const popupClasses = computed(() =>
  props.pos ? 'absolute -translate-x-1/2 -translate-y-full' : 'relative'
)

const popupStyles = computed(() =>
  props.pos ? { top: props.pos.top, left: props.pos.left } : undefined
)
</script>
