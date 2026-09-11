<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 15 15"
    fill="none"
    class="shrink-0"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M9.375 11.25L5.625 7.5L9.375 3.75"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ size?: number }>(), { size: 15 })
</script>
