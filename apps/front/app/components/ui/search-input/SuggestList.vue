<template>
  <ul
    :id="id"
    class="absolute inset-x-0 top-full z-40 mt-xs max-h-72 overflow-y-auto rounded-md border border-outline bg-paper py-xs shadow-md"
  >
    <li v-for="(suggestion, i) in suggestions" :key="suggestion">
      <button
        :id="`${id}-option-${i}`"
        type="button"
        tabindex="-1"
        class="block w-full cursor-pointer px-md py-sm text-left text-small text-ink transition-colors"
        :class="i === activeIndex ? 'bg-surface' : 'hover:bg-surface'"
        @mousedown.prevent
        @click="emit('pick', i)"
        @mouseenter="emit('highlight', i)"
      >
        {{ suggestion }}
      </button>
    </li>
  </ul>
</template>

<script setup lang="ts">
defineProps<{
  id: string
  suggestions: string[]
  activeIndex: number
}>()

const emit = defineEmits<{
  pick: [index: number]
  highlight: [index: number]
}>()
</script>
