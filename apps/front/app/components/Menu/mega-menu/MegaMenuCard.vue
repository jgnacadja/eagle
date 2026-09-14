<template>
  <NuxtLink
    :to="to"
    class="group block h-full rounded-md bg-surface px-md py-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
    @click="$emit('select')"
  >
    <span
      class="block text-body font-semibold text-ink transition-colors group-hover:text-accent-text"
      >{{ title }}</span
    >
    <span v-if="meta" class="mt-1 block text-small text-ink-subtle">{{ meta }}</span>
  </NuxtLink>
</template>

<script setup lang="ts">
defineProps<{ to: string; title: string; meta?: string | null }>()
defineEmits<{ select: [] }>()
</script>
