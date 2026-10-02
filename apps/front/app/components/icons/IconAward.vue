<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    :width="size"
    :height="size"
    viewBox="0 0 22 22"
    fill="none"
    stroke="currentColor"
    stroke-width="1.83333"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path
      d="M11 13.75C14.0376 13.75 16.5 11.2876 16.5 8.25C16.5 5.21243 14.0376 2.75 11 2.75C7.96243 2.75 5.5 5.21243 5.5 8.25C5.5 11.2876 7.96243 13.75 11 13.75Z"
    />
    <path d="M8.25 12.8335L6.875 19.2502L11 16.9585L15.125 19.2502L13.75 12.8335" />
  </svg>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ size?: number }>(), { size: 24 })
</script>
