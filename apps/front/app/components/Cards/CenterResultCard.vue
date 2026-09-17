<template>
  <article
    class="cursor-pointer rounded-md border p-md transition"
    :class="
      active
        ? 'border-2 border-primary bg-surface shadow-md'
        : 'border border-rule bg-paper hover:border-primary/40 hover:shadow-md'
    "
    @click="$emit('select')"
  >
    <div class="flex items-start justify-between gap-sm">
      <h3 class="font-sans text-h4 text-ink">{{ center.name }}</h3>
      <span class="shrink-0 rounded-full bg-surface px-sm py-xs text-meta text-ink-subtle">{{
        center.cp
      }}</span>
    </div>
    <p class="mt-xs text-small text-ink-muted">{{ center.address }}</p>
    <p
      v-if="center.distanceKm != null"
      data-testid="center-distance"
      class="mt-xs flex items-center gap-xs text-small text-ink-subtle"
    >
      <IconMapPin :size="14" />
      {{ formatDistance(center.distanceKm) }}
    </p>
    <p v-if="center.tags" class="mt-sm hidden text-small font-medium text-ink-body md:block">
      {{ center.tags }}
    </p>
    <div class="mt-sm flex items-center justify-between gap-sm">
      <Badge v-if="center.status" :variant="center.status.type" class="py-sm">
        <span v-if="dotClass" class="h-sm w-sm rounded-full" :class="dotClass" aria-hidden="true" />
        <span v-else-if="center.status.type === 'warning'" aria-hidden="true">▲</span>
        <span class="hidden md:inline">{{ center.status.label }}</span>
        <span class="md:hidden">{{ center.status.labelShort ?? center.status.label }}</span>
      </Badge>
      <span v-else />
      <Button
        as-child
        :variant="active ? 'default' : 'outline'"
        size="pill-sm"
        class="shrink-0 font-bold"
      >
        <NuxtLink :to="`/centres/${center.id}`" @click.stop>Voir le centre</NuxtLink>
      </Button>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Button } from '@/components/ui/button'
import IconMapPin from '@/components/icons/IconMapPin.vue'
import { formatDistance } from '~/utils/geo'
import type { CenterResult } from '~/types/center-result'

const props = defineProps<{
  center: CenterResult
  active?: boolean
}>()

defineEmits<{
  select: []
}>()

const dotClass = computed(() => {
  if (props.center.status?.type === 'success') return 'bg-success'
  return ''
})
</script>
