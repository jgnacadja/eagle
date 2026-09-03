<template>
  <div v-if="items.length" class="overflow-hidden bg-primary-dark py-3">
    <div class="flex whitespace-nowrap animate-[scroll-left_30s_linear_infinite]">
      <div class="flex items-center gap-10 px-5 text-sm font-medium text-ink-inverse-muted">
        <template v-for="item in displayItems" :key="item.key">
          <span>
            <strong class="text-ink-inverse">{{ item.value }}</strong> {{ item.label }}
          </span>
        </template>
      </div>
      <div
        class="flex items-center gap-10 px-5 text-sm font-medium text-ink-inverse-muted"
        aria-hidden="true"
      >
        <template v-for="item in displayItems" :key="`${item.key}-dup`">
          <span>
            <strong class="text-ink-inverse">{{ item.value }}</strong> {{ item.label }}
          </span>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Stat } from '@learnup/types'

const props = defineProps<{
  items: Stat[]
}>()

const displayItems = computed(() =>
  props.items.map((item, index) => ({
    key: `${item.id}-${index}`,
    value: item.value,
    label: item.label
  }))
)
</script>
