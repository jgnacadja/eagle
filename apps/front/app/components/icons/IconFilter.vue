<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    :width="size"
    :height="size"
    viewBox="0 0 15 15"
    fill="none"
    stroke="currentColor"
    stroke-width="1.375"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path d="M2.5 3.75H12.5M4.375 7.5H10.625M6.25 11.25H8.75" />
  </svg>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ size?: number }>(), { size: 15 })
</script>
