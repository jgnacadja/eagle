<template>
  <div>
    <p class="font-display text-h1 font-extrabold text-ink md:text-hero">
      {{ value }}<span v-if="unit" class="text-h3 align-top">{{ unit }}</span>
    </p>
    <p class="mt-xs text-small text-ink-muted">{{ label }}</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  value: string
  unit?: string
  label: string
}>()
</script>
