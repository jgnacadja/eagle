<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    :width="size"
    :height="size"
    viewBox="0 0 17 17"
    fill="none"
    stroke="currentColor"
    stroke-width="1.41667"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path
      d="M8.5 14.875C12.0208 14.875 14.875 12.0208 14.875 8.5C14.875 4.97918 12.0208 2.125 8.5 2.125C4.97918 2.125 2.125 4.97918 2.125 8.5C2.125 12.0208 4.97918 14.875 8.5 14.875Z"
    />
    <path d="M8.5 4.9585V8.50016L10.625 9.91683" />
  </svg>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ size?: number }>(), { size: 24 })
</script>
