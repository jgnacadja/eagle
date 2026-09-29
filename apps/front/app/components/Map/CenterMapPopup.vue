<template>
  <div
    class="z-30 flex w-80 flex-col gap-xs rounded-md bg-paper p-md shadow-lg"
    :class="popupClasses"
    :style="popupStyles"
  >
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label="Fermer"
      class="absolute right-sm top-sm text-ink-subtle"
      @click.stop="handleClose"
    >
      <IconClose :size="16" />
    </Button>
    <h4 class="pr-6 font-sans text-h4 text-ink">{{ name }}</h4>
    <p class="text-meta text-ink-subtle">{{ locationLabel }}</p>
    <p class="text-small font-medium text-ink-body">{{ tagsShort }}</p>
    <Button as-child size="pill-sm" class="center-map-popup-cta self-start font-bold">
      <a :href="`/centres/${id}`">Voir le centre</a>
    </Button>
    <span
      aria-hidden="true"
      class="absolute -bottom-1 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 bg-paper"
    />
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
