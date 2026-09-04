<template>
  <div>
    <p class="font-display text-h1 font-extrabold text-ink">
      {{ value }}<span v-if="unit" class="text-h4 align-baseline text-ink-muted">{{ unit }}</span>
    </p>
    <p class="mt-xs text-body font-medium text-ink-muted">{{ label }}</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  value: string
  unit?: string
  label: string
}>()
</script>
